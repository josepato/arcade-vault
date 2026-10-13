# SPEC 01 — MVP visual de Arcade Vault (todas las pantallas del template)

> **Status:** Implemented  
> **Depends on:** ninguna
> **Date:** 2026-10-12
> **Objective:** Portar a Next.js (App Router) las 5 pantallas y la navegación de `references/templates/` como un MVP solo visual, con datos simulados y sin ningún juego real.

---

## Por qué existe este spec

El template en `references/templates/` es un prototipo React + Babel en el navegador, con un router casero por hash. El proyecto es hoy el resultado intacto de `create-next-app`. Este spec convierte el prototipo en el esqueleto real de la app, para que los siguientes specs (juegos reales, backend, auth real) tengan dónde enchufarse.

El estado de partida ya incluye (cambios en el working tree, aún sin commit):

- `app/globals.css`: el CSS del template portado (tokens, fondo, CRT, animaciones) más el mapeo `@theme inline` de Tailwind v4.
- `app/layout.tsx`: fuentes `Press Start 2P`, `JetBrains Mono` y `Courier Prime` vía `next/font/google`, y los divs `av-bg` / `av-noise` / `av-root`.

Este spec **no** vuelve a portar esos dos archivos. Solo los toca para añadir la navegación y el footer.

---

## Scope

**In:**

- Cinco pantallas con el aspecto y comportamiento visual del template:
  - Biblioteca (`/`): hero, buscador por nombre, chips de categoría, grilla de tarjetas con efecto tilt y estado vacío.
  - Detalle de juego (`/juegos/[id]`): portada, etiquetas, descripción, tira de estadísticas, botones y tabla de mejores puntuaciones.
  - Reproductor (`/jugar/[id]`): HUD, marco CRT con arena decorativa, pausa, botón FIN y modal de fin de juego con guardado de puntuación.
  - Acceso (`/acceso`): pestañas "Iniciar sesión" / "Crear cuenta", formulario, "Jugar como invitado" y botones sociales decorativos.
  - Salón de la Fama (`/salon`): pestañas por juego, podio top 3, tabla de 12 filas y fila "Tu mejor marca" si hay sesión.
- Navegación global: barra superior, contador de créditos decorativo, menú móvil (hamburguesa + panel lateral) y footer, todo en `app/layout.tsx`.
- Datos simulados: catálogo de 8 juegos, categorías y marcadores generados con una semilla determinista, en módulos TypeScript.
- Sesión simulada: `{ name }` guardado en `localStorage` bajo la clave `av_user`. El nombre se muestra en la barra y en el salón.
- Guardado simulado de puntuaciones del reproductor en `localStorage` bajo la clave `av_scores`.
- Ruta inexistente o `id` de juego desconocido: página 404 de Next.js con el estilo del tema.
- Diseño responsive tal como lo define el CSS ya portado (breakpoints 720 / 840 / 900 px).

**Out of scope (para futuros specs):**

- Cualquier juego real: lógica, canvas, input de teclado o táctil, puntuación real. El reproductor muestra una arena decorativa y un puntaje simulado.
- Backend, base de datos y API: los marcadores y el catálogo son datos fijos del código.
- Autenticación real: sin validación de campos, sin contraseñas, sin OAuth. Los botones Google y GitHub no hacen nada.
- Leer `av_scores` de vuelta: las puntuaciones guardadas no aparecen en el salón ni en el detalle.
- Sistema de créditos real: "CRÉDITOS · 03" es un texto fijo.
- Internacionalización: la interfaz queda solo en español.
- Tests automatizados: no hay test runner configurado en el repo.
- Rediseño visual: se respeta el diseño del template tal cual.

---

## Data model

Todo vive en módulos TypeScript. No hay base de datos.

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export interface Game {
  id: string;            // slug de la URL, p. ej. "bloque-buster"
  title: string;         // "BLOQUE BUSTER"
  short: string;         // descripción de la tarjeta
  long: string;          // descripción del detalle
  cat: GameCategory;
  cover: string;         // clase CSS ya portada: "cover-bricks", "cover-tetro", ...
  color: GameColor;      // define la variante del botón JUGAR
  best: number;          // mejor puntuación global (mock)
  plays: string;         // "12.4K" (texto, no número)
}

export const GAMES: Game[];                              // los 8 juegos de data.jsx
export const CATS: readonly ["TODOS", ...GameCategory[]];
export function getGame(id: string): Game | undefined;
```

```ts
// lib/scores.ts
export interface ScoreRow { rank: number; name: string; score: number; date: string } // date: "DD/MM/2026"

// Misma fórmula que seededScores de data.jsx: determinista dada la semilla.
export function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// lib/session.ts — tipos y claves de localStorage
export interface SessionUser { name: string }   // máx. 10 caracteres, en mayúsculas
export const USER_KEY = "av_user";
export const SCORES_KEY = "av_scores";          // [{ game, score, name, at }]
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`, como en el template.
- Semillas: detalle usa `id.length * 17 + 3` con 10 filas; salón usa `id.length * 23 + 7` con 12 filas.
- La sesión vive en un `AuthProvider` (Client Component, React context) que lee `localStorage` tras montar, para no romper la hidratación. Expone `user`, `login(user | null)` y `logout()`.
- Los accesos a `localStorage` van dentro de `try/catch`; si fallan, la app sigue funcionando sin persistir.

---

## Implementation plan

Antes de cada paso, leer la guía correspondiente en `node_modules/next/dist/docs/01-app/` (`params` es una `Promise`, se usan los helpers globales `PageProps<'/ruta'>`). Cada paso deja la app compilando y ejecutable.

1. Crear `lib/games.ts` y `lib/scores.ts` con los datos y la función `seededScores` portados de `data.jsx`, y `lib/session.ts` con tipos y claves. Verificar con `npm run build`.
2. Crear `components/auth-provider.tsx` (`"use client"`, contexto con `user`, `login`, `logout`, lectura de `av_user` tras montar) y envolver `children` con él en `app/layout.tsx`.
3. Crear `components/nav.tsx` (`"use client"`): logo, enlaces Biblioteca y Salón de la Fama con estado activo por `usePathname()`, contador de créditos, botón de sesión, menú móvil. Añadirlo a `app/layout.tsx` junto con el footer del template. Los enlaces usan `next/link`. Biblioteca está activa también en `/juegos/*` y `/jugar/*`.
4. Biblioteca: reemplazar `app/page.tsx` por el hero y un componente `components/library.tsx` (`"use client"`, estado de búsqueda y categoría) con `components/game-card.tsx` (tilt por `onMouseMove`). La tarjeta enlaza a `/juegos/[id]`. Incluye el estado "NO HAY RESULTADOS".
5. Detalle: crear `app/juegos/[id]/page.tsx` (Server Component, `await params`, `notFound()` si el `id` no existe) y `components/leaderboard.tsx` para la tabla de mejores puntuaciones. Botón "JUGAR AHORA" a `/jugar/[id]` y "VOLVER AL VAULT" a `/`.
6. Reproductor: crear `app/jugar/[id]/page.tsx` (Server Component con `notFound()`) y `components/game-player.tsx` (`"use client"`): HUD, CRT con arena decorativa, puntaje simulado por `setInterval`, pausa, FIN, modal de fin de juego, guardado en `av_scores`, "JUGAR DE NUEVO". "SALIR" vuelve a `/juegos/[id]`.
7. Salón de la Fama: crear `app/salon/page.tsx` y `components/hall-of-fame.tsx` (`"use client"`, pestaña activa por juego, podio, tabla, fila "Tu mejor marca" solo con sesión).
8. Acceso: crear `app/acceso/page.tsx` y `components/auth-form.tsx` (`"use client"`): pestañas, campo de correo solo en "Crear cuenta", envío que llama a `login({ name })` y redirige a `/` con `router.push`. "Jugar como invitado" llama a `login(null)` y redirige.
9. Crear `app/not-found.tsx` con el estilo del tema y actualizar `metadata` de `app/layout.tsx` si hace falta (título "Arcade Vault · Portal Retro").

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores de TypeScript.
- [ ] `npm run lint` termina sin errores.
- [ ] La consola del navegador no muestra errores ni warnings de hidratación en ninguna de las 5 rutas.
- [ ] `/` muestra 8 tarjetas de juego con su portada, categoría, mejor puntuación y botón JUGAR.
- [ ] En `/`, escribir "caída" en el buscador deja solo la tarjeta CAÍDA.
- [ ] En `/`, el chip SHOOTER muestra exactamente INVASORES y ROCAS.
- [ ] En `/`, una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Hacer clic en una tarjeta lleva a `/juegos/[id]` de ese juego.
- [ ] `/juegos/serpentina` muestra título, descripción larga, tira de estadísticas y 10 filas de puntuaciones; recargar la página muestra las mismas filas.
- [ ] `/juegos/no-existe` y `/jugar/no-existe` muestran la página 404.
- [ ] "JUGAR AHORA" lleva a `/jugar/[id]` y "VOLVER AL VAULT" lleva a `/`.
- [ ] En `/jugar/[id]` el puntaje sube solo, "PAUSA" lo detiene y muestra "EN PAUSA", y "REANUDAR" lo reanuda.
- [ ] En `/jugar/[id]`, pulsar "FIN" abre el modal con la puntuación final; "GUARDAR PUNTUACIÓN" muestra "PUNTUACIÓN GUARDADA" y añade una entrada a `localStorage["av_scores"]`.
- [ ] "JUGAR DE NUEVO" reinicia puntaje, vidas y nivel y cierra el modal; "SALIR" lleva a `/juegos/[id]`.
- [ ] `/salon` muestra el podio con 3 puestos, 12 filas y una pestaña por cada uno de los 8 juegos; cambiar de pestaña cambia los datos.
- [ ] En `/salon` sin sesión no aparece "TU MEJOR MARCA"; con sesión aparece con el nombre del usuario.
- [ ] En `/acceso`, la pestaña "CREAR CUENTA" muestra el campo de correo y "INICIAR SESIÓN" lo oculta.
- [ ] Enviar el formulario de `/acceso` con usuario "px_kai" guarda `{"name":"PX_KAI"}` en `localStorage["av_user"]`, redirige a `/` y la barra muestra "PX_KAI ▾".
- [ ] Enviar el formulario con todos los campos vacíos inicia sesión como "PLAYER1".
- [ ] "JUGAR COMO INVITADO" redirige a `/` sin guardar `av_user`.
- [ ] Tras recargar la página con sesión iniciada, la barra sigue mostrando el nombre.
- [ ] Hacer clic en el botón con el nombre de usuario cierra la sesión y borra `av_user`.
- [ ] A 375 px de ancho aparece el botón hamburguesa, el panel móvil abre y cierra, y no hay scroll horizontal en ninguna ruta.
- [ ] El enlace activo de la barra es "Biblioteca" en `/`, `/juegos/*` y `/jugar/*`, y "Salón de la Fama" en `/salon`.
- [ ] El footer "© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN" aparece en todas las rutas.
- [ ] No queda ninguna referencia a `React.createElement` por Babel ni a `window.GAMES`: todo el código usa imports ES.
- [ ] Con `localStorage` bloqueado, las 5 rutas cargan sin lanzar excepciones.

---

## Decisions

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/jugar/[id]`, `/acceso`, `/salon`). URLs limpias, `404` real para ids inválidos y el camino listo para datos reales. Se descarta replicar el router por hash del template porque desaprovecha Next.js.
- **Sí:** nombres de ruta en español, coherentes con la interfaz y con el nombre de archivo de las pantallas del template (`biblioteca`, `detalle`, `reproductor`, `salon`).
- **Sí:** reutilizar el CSS ya portado en `app/globals.css` con las clases del template (`av-grid`, `crt`, `podium`...). Se descarta reescribir con utilidades Tailwind (más trabajo y riesgo de divergir del diseño) y CSS Modules (obliga a refactorizar tokens y animaciones compartidas).
- **Sí:** datos mock en `lib/` y sesión simulada en `localStorage` (`av_user`, `av_scores`), igual que el template. Se descarta un backend real: contradice "solo parte visual" y merece su propio spec.
- **Sí:** el reproductor conserva el puntaje simulado, la pausa y el modal de fin de juego, para poder probar todo el flujo visual. Se descarta dejar solo un marco CRT estático.
- **Sí:** Server Components por defecto. Solo llevan `"use client"` los componentes con estado, `localStorage` o `usePathname`: `AuthProvider`, `Nav`, `Library`, `GameCard`, `GamePlayer`, `HallOfFame` y `AuthForm`.
- **Sí:** el `AuthProvider` lee `localStorage` después de montar. Leerlo durante el render rompería la hidratación, porque el servidor no conoce la sesión.
- **No:** persistir o mostrar las puntuaciones guardadas en el salón. Los marcadores siguen siendo mock hasta que exista un backend.
- **No:** `generateStaticParams` en este spec. Los dos `id` dinámicos se resuelven sin él y se puede añadir después sin cambiar nada más.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Next.js 16 cambia APIs respecto a lo conocido (`params` como `Promise`, helpers `PageProps`) | Leer `node_modules/next/dist/docs/01-app/` antes de cada paso, como pide `AGENTS.md`. |
| Error de hidratación por leer `localStorage` en el primer render | `AuthProvider` carga la sesión en un `useEffect`; la barra renderiza "Iniciar Sesión" hasta que carga. |
| `Math.random` en el reproductor produce HTML distinto entre servidor y cliente | Solo se usa dentro de `setInterval`, nunca durante el render. |
| Las clases `cover-*` o animaciones del CSS portado no coinciden con las usadas en los componentes | El criterio "8 tarjetas con su portada" y la revisión visual de cada ruta lo detectan; corregir en `globals.css`. |
| `localStorage` bloqueado o modo privado | Todos los accesos van en `try/catch`; la app sigue funcionando sin persistir. |
| El efecto de nivel del template (`score % 2500 < 100`) puede dispararse varias veces seguidas | Es comportamiento simulado heredado del template; no se considera un defecto en este spec. |

---

## What is **not** in this spec

- Ningún juego real (lógica, canvas, controles).
- Backend, base de datos, API o marcadores reales.
- Autenticación real (contraseñas, OAuth, sesiones de servidor).
- Mostrar en el salón o en el detalle las puntuaciones guardadas en `av_scores`.
- Sistema real de créditos.
- Internacionalización y tests automatizados.
- Cambios al diseño visual del template.

Cada uno de estos puntos, si se aborda, va en su propio spec.

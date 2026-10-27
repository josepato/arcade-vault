# SPEC 02 — Home (landing) de Arcade Vault

> **Status:** Approved   
> **Depends on:** SPEC 01
> **Date:** 2026-10-18
> **Objective:** Crear la landing de `references/home-about/home.jsx` en `/` como Server Component de Next.js, y mover la Biblioteca actual a `/biblioteca`.

---

## Por qué existe este spec

Hoy `/` es la Biblioteca (SPEC 01). La referencia en `references/home-about/` define una landing de marketing previa a la Biblioteca: hero, "¿por qué?", vista previa de juegos, stats, actividad en vivo, precios y CTA final. Para que la landing sea la página principal, la Biblioteca se muda a `/biblioteca`, igual que el flujo Inicio → Biblioteca de la referencia.

La carpeta de referencia también contiene `about.jsx` (Acerca de + Contacto) y CSS de gamepad (`.gp-*`). Ninguno entra en este spec.

---

## Scope

**In:**

- Home en `/` con las 6 secciones de `home.jsx`:
  - Hero: eyebrow "▸ INSERTA UNA MONEDA_", título de 3 líneas, subtítulo, CTAs "EXPLORAR JUEGOS" y "CREAR CUENTA", indicador "DESLIZA" y 8 siluetas pixel flotantes.
  - `// 01 ¿POR QUÉ ARCADE VAULT?`: 4 tarjetas de características con icono pixel SVG.
  - `// 02 JUEGOS DISPONIBLES AHORA`: 6 mini-tarjetas y botón "VER TODOS LOS JUEGOS →".
  - Bloque de 3 stats ("12+ JUEGOS", "MILES DE PARTIDAS", "GLOBAL RANKING").
  - `// 03 ACTIVIDAD EN VIVO`: ticker de 7 últimas puntuaciones y lista "TOP JUGADORES · HOY" de 5 filas con enlace "VER SALÓN →".
  - `// 04 PRECIOS`: tarjeta "JUGADOR VAULT $0 / SIEMPRE" con sello "FREE PLAY" y 3 preguntas frecuentes.
  - CTA final "¿LISTO PARA JUGAR?" con botón "INSERTAR MONEDA →".
- Animación de aparición al hacer scroll (clase `.reveal` → `.in`) con `IntersectionObserver`.
- Mover la Biblioteca (hero `av-hero` + `Library`) de `/` a `/biblioteca`, sin cambiar su aspecto.
- Nav: nuevo enlace "Inicio" (activo solo en `/`) antes de "Biblioteca"; "Biblioteca" activo en `/biblioteca`, `/juegos/*` y `/jugar/*`. El logo sigue apuntando a `/`.
- Actualizar los enlaces que hoy apuntan a la Biblioteca con `/` para que apunten a `/biblioteca`.
- Portar a `app/globals.css` el CSS de la landing de `references/home-about/styles.css`: secciones `HOME PAGE` (líneas 930–1069), `ACTIVITY` (1621–1670) y `PRICING` (1672–1725), más las `@keyframes` que falten.
- Datos mock del ticker, top de jugadores y stats en `lib/home-data.ts`, copiados de la referencia.

**Out of scope (para futuros specs):**

- Página "Acerca de" y formulario de contacto (`about.jsx`): otro spec.
- Enlace "Acerca de" en el nav y en el menú móvil: llega con ese spec.
- CSS del gamepad (`.gp-*`, `.dp`, `.ab`...): lo usa el reproductor, no la landing.
- Datos reales: el ticker y el top no se derivan de `lib/games.ts`, `seededScores` ni de `av_scores`.
- Ticker "en vivo" real o con actualización periódica: es una lista estática con animación de entrada.
- Sistema real de planes o pagos: la tarjeta de precios es solo texto.
- Cambios de diseño sobre la referencia.
- Tests automatizados (siguen sin existir en el repo).

---

## Data model

```ts
// lib/home-data.ts — constantes copiadas literalmente de home.jsx
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export interface Feature { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; color: NeonColor }
export interface HomeStat { n: string; u: string; s: string }
export interface RecentScore { player: string; game: string; score: number; when: string; color: NeonColor } // when: "hace 2 min"
export interface TopPlayer { rank: number; player: string; score: number }

export const FEATURES: Feature[];      // 4 elementos
export const HOME_STATS: HomeStat[];   // 3 elementos
export const RECENT_SCORES: RecentScore[]; // 7 elementos
export const TOP_PLAYERS: TopPlayer[]; // 5 elementos
```

Convenciones:

- Los números se formatean con `toLocaleString("es-ES")`, como en SPEC 01 y en la referencia.
- Los 6 juegos de la vista previa son `GAMES.slice(0, 6)` de `lib/games.ts` (ya existente).
- El ancho de la barra del top es `100 - index * 16` por ciento, como en la referencia.
- No hay estado, `localStorage` ni claves nuevas.

---

## Implementation plan

Antes de cada paso, leer la guía correspondiente en `node_modules/next/dist/docs/01-app/` (`Link`, Server vs Client Components, `metadata`). Cada paso deja la app compilando y ejecutable.

1. Portar el CSS de la landing (`HOME PAGE`, `ACTIVITY`, `PRICING`) a `app/globals.css`, sin duplicar reglas ni `@keyframes` ya presentes (`blink`, `pulse-led`, `fadeIn`, `pulse`). Añadir `@media (prefers-reduced-motion: reduce)` que fuerce `.reveal` visible. Verificar con `npm run build`.
2. Crear `lib/home-data.ts` con `FEATURES`, `HOME_STATS`, `RECENT_SCORES` y `TOP_PLAYERS`.
3. Crear `app/biblioteca/page.tsx` con el hero y `<Library />` que hoy están en `app/page.tsx`. Cambiar a `/biblioteca` los enlaces de Biblioteca en `components/nav.tsx` (escritorio y móvil), "VOLVER AL VAULT" en `app/juegos/[id]/page.tsx`, `app/not-found.tsx` y `components/game-player.tsx`, "VOLVER A LA BIBLIOTECA" en `components/hall-of-fame.tsx` y los dos `router.push("/")` de `components/auth-form.tsx`. En `nav.tsx`, `inLibrary` pasa a `/biblioteca`, `/juegos*` y `/jugar*`.
4. Crear los componentes presentacionales (Server Components, sin estado): `components/home/floating-silhouettes.tsx`, `components/home/feature-icon.tsx` y `components/home/mini-card.tsx` (un `<Link>` a `/juegos/[id]`, en lugar del `onClick` de la referencia).
5. Crear `components/home/reveal-observer.tsx` (`"use client"`, renderiza `null`): en un `useEffect` observa todos los `.reveal` y les añade `in` al entrar en pantalla (umbral 0.12), y desconecta al desmontar.
6. Reemplazar `app/page.tsx` por la Home: las 6 secciones con `<Link>` de `next/link` y las clases del CSS portado, más `<RevealObserver />`. Añadir "Inicio" al nav (escritorio y móvil) con activo solo en `/`.

---

## Acceptance criteria

- [ ] `npm run build` termina sin errores de TypeScript.
- [ ] `npm run lint` termina sin errores.
- [ ] La consola del navegador no muestra errores ni warnings de hidratación en `/` y `/biblioteca`.
- [ ] `/` muestra el título en 3 líneas "EL ARCADE" / "CLÁSICO ESTÁ" / "DE VUELTA" y 8 siluetas flotantes.
- [ ] "EXPLORAR JUEGOS" lleva a `/biblioteca` y "CREAR CUENTA" lleva a `/acceso`.
- [ ] La sección `// 01` muestra exactamente 4 tarjetas: JUEGOS CLÁSICOS, 100% GRATIS, LADDER BOARDS, SIEMPRE CRECIENDO.
- [ ] La sección `// 02` muestra 6 mini-tarjetas con las portadas de los 6 primeros juegos de `GAMES`; hacer clic en una lleva a `/juegos/[id]` de ese juego.
- [ ] "VER TODOS LOS JUEGOS →" lleva a `/biblioteca`.
- [ ] El bloque de stats muestra "12+", "MILES" y "GLOBAL".
- [ ] El ticker muestra 7 filas y la primera es "NEONFOX ▸ Caída +184.220 hace 2 min".
- [ ] El top muestra 5 filas; la primera es "#01 NEONFOX 312.840" con el estilo oro (`top1`).
- [ ] "VER SALÓN →" lleva a `/salon`.
- [ ] La tarjeta de precios muestra "$0 / SIEMPRE", 6 ítems con ✔, el sello "FREE PLAY" y 3 preguntas frecuentes.
- [ ] "EMPEZAR GRATIS →" lleva a `/acceso` y "INSERTAR MONEDA →" lleva a `/biblioteca`.
- [ ] Las secciones con `.reveal` empiezan ocultas y reciben la clase `in` al hacer scroll hasta ellas.
- [ ] Con `prefers-reduced-motion: reduce`, todas las secciones `.reveal` son visibles sin hacer scroll.
- [ ] `/biblioteca` muestra el mismo hero, buscador, chips y 8 tarjetas que mostraba `/` antes de este spec.
- [ ] En el nav, "Inicio" está activo solo en `/`; "Biblioteca" está activo en `/biblioteca`, `/juegos/*` y `/jugar/*`; "Salón de la Fama" sigue activo en `/salon`.
- [ ] "VOLVER AL VAULT" (detalle, reproductor, 404) y "VOLVER A LA BIBLIOTECA" (salón) llevan a `/biblioteca`.
- [ ] Enviar el formulario de `/acceso` redirige a `/biblioteca`.
- [ ] El logo del nav lleva a `/`.
- [ ] A 375 px de ancho no hay scroll horizontal en `/`, el menú móvil abre y cierra, y el menú incluye "Inicio".
- [ ] `app/page.tsx` no contiene `"use client"`; solo `reveal-observer.tsx` es Client Component entre los archivos nuevos.
- [ ] No queda ninguna referencia a `React.createElement`, `window.Home` ni `navigate(` en el código nuevo.

---

## Decisions

- **Sí:** Home en `/` y Biblioteca en `/biblioteca`. La landing es la puerta de entrada y el flujo coincide con la referencia. Se descarta `/inicio` para la landing porque la dejaría fuera de la URL principal, y se descarta eliminar la Biblioteca porque se perdería el buscador y los filtros.
- **Sí:** redirigir a `/biblioteca` tras iniciar sesión, para conservar el comportamiento de SPEC 01 (el usuario aterrizaba en la Biblioteca). Se descarta `/` porque devolvería al usuario a una landing de marketing justo después de entrar.
- **Sí:** "VOLVER AL VAULT" apunta a `/biblioteca`, porque en esas pantallas "vault" significa el catálogo de juegos.
- **Sí:** solo la Home en este spec; "Acerca de" y Contacto van en otro. Mantiene el spec en una sola pantalla y evita añadir un enlace de nav que apunte a una ruta inexistente.
- **Sí:** datos mock literales en `lib/home-data.ts`. Se descarta derivarlos de `GAMES` y `seededScores`: cambiaría los textos de la referencia y no aporta valor mientras no exista backend.
- **Sí:** el stat "12+ JUEGOS" se conserva aunque el catálogo tiene 8. Es copy de marketing de la referencia ("Y CONTANDO").
- **Sí:** Server Components por defecto; solo `RevealObserver` lleva `"use client"`. Se descarta un wrapper `Reveal` por sección: obligaría a marcar como cliente cada sección o a envolverlas una por una.
- **Sí:** `MiniCard` como `<Link>` y no como `div` con `onClick`. Da navegación nativa, prefetch y accesibilidad por teclado.
- **Sí:** reutilizar las clases CSS de la referencia en `app/globals.css`, igual que SPEC 01. Se descarta reescribir con utilidades Tailwind por riesgo de divergir del diseño.
- **Sí:** respetar `prefers-reduced-motion` mostrando todo el contenido `.reveal`. Es un añadido sobre la referencia, que lo oculta hasta que el observer actúa.
- **No:** portar el CSS del gamepad. No lo usa ninguna pantalla de este spec.
- **No:** `generateStaticParams` ni `metadata` propia para `/`: se mantiene la de `app/layout.tsx`.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `.reveal` deja las secciones con `opacity: 0` si el observer no corre (JS deshabilitado, fallo de hidratación) | Solo `RevealObserver` depende de JS; `prefers-reduced-motion` las muestra siempre. Criterio de aceptación explícito para el observer. |
| Reglas duplicadas o en conflicto al pegar el CSS (`@keyframes pulse-led`, `fadeIn`, `blink` ya existen) | El paso 1 pide revisar `globals.css` antes de pegar y copiar solo lo que falte. |
| Quedan enlaces a `/` pensando en la Biblioteca | El paso 3 lista los 8 puntos conocidos; verificar con `grep -rn 'href="/"\|push("/")' app components`. |
| Los criterios de SPEC 01 que dicen "`/` muestra 8 tarjetas" dejan de cumplirse | Quedan superados por los criterios de `/biblioteca` de este spec. SPEC 01 no se edita porque ya está implementado. |
| `.hero-scroll` (`bottom: -20px`) y `.pc-stamp` (`top/right: -18px`) sobresalen de su contenedor y pueden provocar scroll horizontal en móvil | `body` ya tiene `overflow-x: hidden` y `.home-hero` tiene `overflow: hidden`; el criterio de 375 px lo comprueba. |
| `toLocaleString("es-ES")` distinto entre servidor y cliente | Mismo locale explícito en ambos, igual que SPEC 01; el criterio de hidratación lo detecta. |

---

## What is **not** in this spec

- Página "Acerca de", formulario de contacto y su enlace en el nav.
- CSS o componentes del gamepad.
- Datos reales o derivados del catálogo para el ticker, el top y los stats.
- Ticker con actualización en vivo.
- Planes, pagos o cualquier lógica de precios.
- Cambios al diseño visual de la referencia.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propio spec.

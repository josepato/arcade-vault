import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "120px 24px" }}>
      <div className="pixel neon-magenta" style={{ fontSize: 28, marginBottom: 16 }}>404</div>
      <div className="pixel neon-cyan" style={{ fontSize: 14, marginBottom: 16 }}>NIVEL NO ENCONTRADO</div>
      <p style={{ color: "var(--ink-dim)", marginBottom: 32 }}>
        La página que buscas no existe o fue retirada del Vault.
      </p>
      <Link href="/" className="btn lg">VOLVER AL VAULT</Link>
    </div>
  );
}

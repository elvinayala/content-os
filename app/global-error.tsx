"use client";

// Última red de seguridad de TODO el portal (reemplaza el layout raíz si algo
// falla muy arriba). Debe traer su propio <html>/<body>.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14100e",
          color: "#f5f0ea",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>
            El portal tuvo un problema
          </h2>
          <p style={{ opacity: 0.7, fontSize: "0.9rem", marginBottom: "1.25rem" }}>
            Probá recargar. Tus datos están a salvo.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#c2643a",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.55rem 1.1rem",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}

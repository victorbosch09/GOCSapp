"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root error boundary]", error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          background: "#0a0a0a",
          color: "#fafafa",
          textAlign: "center",
          padding: "1rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div>
          <p style={{ fontSize: "2.5rem", fontWeight: 700, color: "#dc2626", margin: 0 }}>
            FALLA CRÍTICA
          </p>
          <h1 style={{ marginTop: "0.5rem", fontSize: "1.25rem" }}>
            La aplicación no pudo iniciar
          </h1>
          <p style={{ marginTop: "0.5rem", maxWidth: "24rem", fontSize: "0.875rem", opacity: 0.7 }}>
            El equipo técnico fue notificado. Intentá recargar la página.
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", opacity: 0.5 }}>
              Ref: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={() => reset()}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            border: "1px solid #dc2626",
            background: "transparent",
            color: "#fafafa",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}

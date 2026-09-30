"use client";

import { useState } from "react";

// En el iPhone la app instalada puede no heredar la sesión de Safari: aquí se pega el link personal y entra.
export function PegarLink() {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState(false);
  const entrar = () => {
    const k = (() => {
      try {
        return new URL(texto.trim()).searchParams.get("k");
      } catch {
        return /^[0-9a-f-]{36}\.\d+\.[0-9a-f]{32}$/.test(texto.trim()) ? texto.trim() : null;
      }
    })();
    if (!k) return setError(true);
    window.location.href = `/cliente/entrar?k=${encodeURIComponent(k)}`;
  };
  return (
    <div className="flex w-full flex-col gap-2">
      <input
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setError(false);
        }}
        placeholder="Pega aquí tu link personal"
        className="h-12 rounded-full border border-border bg-card px-5 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      {error ? <p className="text-xs text-destructive">Ese no parece tu link. Cópialo completo del mensaje que te mandamos.</p> : null}
      <button onClick={entrar} disabled={!texto.trim()} className="h-12 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
        Entrar
      </button>
    </div>
  );
}

"use client";

import { useId } from "react";

import { type Casilla, ENTIDAD_LEGAL, RUTAS_LEGALES, type TipoConsentimiento } from "@/lib/consentimientos/reglas";

// Casillas legales reutilizables (skill legal-sitio-web, punto 4): una por consentimiento, ninguna marcada
// por defecto, cada una con su enlace. Las de términos y privacidad son obligatorias; las de marketing,
// nunca. El servidor vuelve a validar y guarda el texto que él tiene (lib/consentimientos), no el de aquí.
// Toma el color de `--consentimiento-acento` (si no, el del texto): sirve en /f/, el Portal y la app de clientes.

/** El texto de la casilla con su parte enlazada (abre en otra pestaña para no perder lo que lleva llenado). */
function TextoCasilla({ c }: { c: Casilla }) {
  const e = c.enlace;
  const i = e ? c.texto.indexOf(e.texto) : -1;
  if (!e || i < 0) return <>{c.texto}</>;
  return (
    <>
      {c.texto.slice(0, i)}
      <a href={e.href} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
        {e.texto}
        <span className="sr-only"> (abre en otra pestaña)</span>
      </a>
      {c.texto.slice(i + e.texto.length)}
    </>
  );
}

export function CasillasConsentimiento({
  casillas,
  aceptadas,
  onCambio,
  error,
  className,
}: {
  casillas: Casilla[];
  aceptadas: readonly TipoConsentimiento[];
  onCambio: (aceptadas: TipoConsentimiento[]) => void;
  /** Mensaje si intentó seguir sin las obligatorias. */
  error?: string | null;
  className?: string;
}) {
  const base = useId();
  if (!casillas.length) return null;
  const marcadas = new Set(aceptadas);
  const cambiar = (t: TipoConsentimiento, on: boolean) => onCambio(casillas.map((c) => c.tipo).filter((x) => (x === t ? on : marcadas.has(x))));
  return (
    <fieldset className={`flex flex-col gap-3 text-sm leading-snug ${className ?? ""}`} aria-describedby={error ? `${base}-error` : undefined}>
      <legend className="sr-only">Consentimientos</legend>
      {casillas.map((c) => {
        const id = `${base}-${c.tipo}`;
        return (
          <div key={c.tipo} className="flex items-start gap-3">
            <input
              id={id}
              type="checkbox"
              checked={marcadas.has(c.tipo)}
              onChange={(e) => cambiar(c.tipo, e.target.checked)}
              required={c.obligatoria}
              // Nombre completo aunque el lector de pantalla salte el enlace de adentro del label.
              aria-label={`${c.texto}${c.obligatoria ? " (obligatoria)" : " (opcional)"}`}
              aria-invalid={!!error && c.obligatoria && !marcadas.has(c.tipo)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ accentColor: "var(--consentimiento-acento, currentColor)", outlineColor: "var(--consentimiento-acento, currentColor)" }}
            />
            <label htmlFor={id} className="cursor-pointer">
              <TextoCasilla c={c} />
              {c.obligatoria ? (
                <span aria-hidden="true" style={{ color: "var(--consentimiento-acento, currentColor)" }}>
                  {" "}
                  *
                </span>
              ) : (
                <span className="opacity-70"> (opcional)</span>
              )}
            </label>
          </div>
        );
      })}
      {error ? (
        <p id={`${base}-error`} role="alert" className="flex w-fit items-center gap-2 rounded-md bg-[#ff5a4e]/15 px-3 py-1.5 text-sm text-[#e5483d]">
          ⚠ {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Pie con los enlaces legales (el contenido de cada página lo publica la sesión dueña de /terminos, /privacidad…). */
export function PieLegal({ className }: { className?: string }) {
  const enlaces: [string, string][] = [
    ["Términos", RUTAS_LEGALES.terminos],
    ["Privacidad", RUTAS_LEGALES.privacidad],
    ["Cookies", RUTAS_LEGALES.cookies],
    ["Accesibilidad", RUTAS_LEGALES.accesibilidad],
  ];
  return (
    <nav aria-label="Información legal" className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${className ?? ""}`}>
      <span>© {new Date().getFullYear()} {ENTIDAD_LEGAL}</span>
      {enlaces.map(([t, href]) => (
        <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline focus-visible:underline">
          {t}
        </a>
      ))}
    </nav>
  );
}

// Ficha del lead · bloque "Seguimiento" (embudo SEGUIMIENTO de Lis, 20/oct/2026): lo que dejó la
// llamada con el closer — de Fathom (lib/leads/seguimiento.ts) o del Excel de Lis. Solo lectura: lo
// nuevo que Lis averigüe va como nota en el historial.

interface DatosSeguimiento {
  fuente?: string;
  url?: string | null;
  fecha?: string | null;
  closer?: string | null;
  setter?: string | null;
  servicios?: string[];
  objecion?: string | null;
  temperatura?: string | null;
  feedback?: string | null;
  proximoPaso?: string | null;
  presion?: boolean;
  notasLis?: string | null;
  razon?: string | null;
  facturacionMensual?: number | null;
  descartado?: boolean;
  prioridad?: "super" | "alta" | null;
  prioridadPor?: string | null;
  productoTexto?: string | null;
  trato?: string | null;
  ofertaIncorrecta?: string | null;
  llamadas?: { fathom: number; fecha: string | null; closer: string | null; url: string | null; temperatura: string | null }[];
}

const TEMP: Record<string, { txt: string; cls: string }> = {
  caliente: { txt: "Caliente", cls: "bg-red-100 text-red-700" },
  tibio: { txt: "Tibio", cls: "bg-amber-100 text-amber-800" },
  frio: { txt: "Frío", cls: "bg-sky-100 text-sky-700" },
};

function fechaCorta(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function SeguimientoLead({ datos }: { datos: unknown }) {
  if (!datos || typeof datos !== "object") return null;
  const s = datos as DatosSeguimiento;
  const temp = s.temperatura ? TEMP[s.temperatura] : null;
  const llamada = [fechaCorta(s.fecha), s.closer && `con ${s.closer}`, s.setter && `setter ${s.setter}`].filter(Boolean).join(" · ");
  const filas: [string, string | null | undefined][] = [
    ["Por qué no cerró", s.razon ? `${s.razon}${s.descartado ? " (dijo que definitivamente no)" : ""}` : null],
    ["Factura al mes", s.facturacionMensual ? `~$${s.facturacionMensual.toLocaleString("en-US")}` : null],
    ["Servicio", s.servicios?.length ? s.servicios.join(" + ") : null],
    ["Objeción", s.objecion ? `${s.objecion}${s.presion ? " · se sintió presionado" : ""}` : null],
    ["Feedback", s.feedback],
    ["Próximo paso", s.proximoPaso],
    ["Notas de Lis", s.notasLis],
  ];
  return (
    <section className="grid gap-2 rounded-md border border-dashed p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold uppercase tracking-wider text-muted-foreground">Seguimiento</h3>
        {temp && <span className={`rounded-full px-2 py-0.5 font-semibold ${temp.cls}`}>{temp.txt}</span>}
      </div>
      {s.prioridad === "super" ? (
        <p className="rounded-md bg-red-600 px-2 py-1 font-bold text-white">🔥 SÚPER PRIORITARIO{s.prioridadPor ? `: ${s.prioridadPor}` : ""}</p>
      ) : s.prioridad === "alta" ? (
        <p className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-800">⭐ Alta intención{s.prioridadPor ? `: ${s.prioridadPor}` : ""}</p>
      ) : null}
      {s.productoTexto && (
        <div className="rounded-md bg-emerald-50 px-2 py-1.5 text-emerald-900">
          <p className="font-semibold">Qué ofrecerle: {s.productoTexto}</p>
          {s.trato && <p className="mt-0.5">{s.trato}</p>}
        </div>
      )}
      {s.ofertaIncorrecta && <p className="rounded-md bg-orange-50 px-2 py-1 text-orange-800">⚠️ {s.ofertaIncorrecta}</p>}
      {llamada && <p className="text-muted-foreground">Llamada {llamada}</p>}
      <dl className="grid gap-1.5">
        {filas
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="grid gap-0.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="whitespace-pre-line break-words text-foreground">{v}</dd>
            </div>
          ))}
      </dl>
      {(s.llamadas?.length ?? 0) > 1 ? (
        <div className="grid gap-1">
          <p className="text-muted-foreground">{s.llamadas!.length} llamadas (lo de arriba es de la última)</p>
          <ol className="grid gap-0.5">
            {s.llamadas!.map((l, i) => (
              <li key={l.fathom} className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground">{i + 1}.</span>
                <span>{[fechaCorta(l.fecha), l.closer && `con ${l.closer}`].filter(Boolean).join(" · ") || "Llamada"}</span>
                {l.temperatura && TEMP[l.temperatura] && <span className={`rounded-full px-1.5 text-[10px] font-semibold ${TEMP[l.temperatura].cls}`}>{TEMP[l.temperatura].txt}</span>}
                {l.url && /^https:\/\//.test(l.url) && (
                  <a href={l.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    Fathom
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        s.url && /^https:\/\//.test(s.url) && (
          <a href={s.url} target="_blank" rel="noreferrer" className="justify-self-start text-primary hover:underline">
            Ver la llamada en Fathom
          </a>
        )
      )}
    </section>
  );
}

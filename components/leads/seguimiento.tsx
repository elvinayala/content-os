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
      {s.url && /^https:\/\//.test(s.url) && (
        <a href={s.url} target="_blank" rel="noreferrer" className="justify-self-start text-primary hover:underline">
          Ver la llamada en Fathom
        </a>
      )}
    </section>
  );
}

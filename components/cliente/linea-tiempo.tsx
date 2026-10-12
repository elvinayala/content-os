import type { EntradaBitacora } from "@/lib/clientes-app/bitacora-reglas";
import { cn } from "@/lib/utils";

const mes = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { month: "long", year: "numeric" });
const dia = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "short" });

/** "Lo que hemos hecho por ti": por mes, lo más nuevo arriba. */
export function LineaTiempo({ entradas, max }: { entradas: EntradaBitacora[]; max?: number }) {
  const lista = max ? entradas.slice(0, max) : entradas;
  const meses: { mes: string; items: EntradaBitacora[] }[] = [];
  for (const e of lista) {
    const m = mes(e.fecha);
    const ult = meses.at(-1);
    if (ult?.mes === m) ult.items.push(e);
    else meses.push({ mes: m, items: [e] });
  }
  return (
    <div className="flex flex-col gap-4">
      {meses.map((m) => (
        <div key={m.mes} className="flex flex-col gap-2">
          {!max ? <p className="ceja first-letter:uppercase">{m.mes}</p> : null}
          <ol className="relative flex flex-col gap-3 border-l border-border/70 pl-5">
            {m.items.map((e, i) => (
              <li key={`${e.fecha}-${i}`} className="relative">
                <span className={cn("absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-background", e.tipo === "entrega" ? "bg-primary" : "bg-foreground/70")} />
                <p className="text-[11px] text-muted-foreground">{dia(e.fecha)}</p>
                <p className="text-sm leading-snug">{e.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

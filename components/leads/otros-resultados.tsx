import { Search } from "lucide-react";
import Link from "next/link";

export interface ResultadoOtro {
  id: string;
  nombre: string;
  telefono: string | null;
  estado: string;
  embudo: string;
  etapa: string | null;
}

const tel = (t: string | null) => {
  const d = (t ?? "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : null;
};

// La búsqueda filtra el embudo abierto; esto enseña lo que coincide en los DEMÁS embudos de la marca.
export function OtrosResultados({ marcaSlug, q, resultados }: { marcaSlug: string; q: string; resultados: ResultadoOtro[] }) {
  if (!q.trim() || !resultados.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b bg-amber-50/60 px-4 py-2 text-xs">
      <span className="flex items-center gap-1 font-medium text-amber-900">
        <Search className="size-3.5" /> También en otros embudos:
      </span>
      {resultados.map((r) => (
        <Link
          key={r.id}
          href={`/pulse/leads/${marcaSlug}/${r.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-background px-2.5 py-1 transition hover:border-amber-300 hover:shadow-sm"
        >
          <span className="font-medium">{r.nombre}</span>
          {tel(r.telefono) ? <span className="text-muted-foreground tabular-nums">{tel(r.telefono)}</span> : null}
          <span className="text-muted-foreground">
            · {r.embudo}
            {r.etapa ? ` → ${r.etapa}` : ""}
            {r.estado !== "abierto" ? ` (${r.estado})` : ""}
          </span>
        </Link>
      ))}
    </div>
  );
}

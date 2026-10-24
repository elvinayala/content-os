import { Esqueleto, EsqueletoEncabezado, Hueso } from "@/components/ritmo/esqueleto";

// Calendario del equipo: el mes (7 columnas) + la lista de quién está fuera.
export default function CargandoCalendario() {
  return (
    <Esqueleto>
      <EsqueletoEncabezado />
      <section className="panel flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="size-9 rounded-full bg-white/[0.05]" />
          <Hueso className="h-5 w-36 rounded-md bg-white/[0.08]" />
          <div className="size-9 rounded-full bg-white/[0.05]" />
        </div>
        <div className="hidden grid-cols-7 gap-1 md:grid">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="min-h-24 rounded-xl bg-white/[0.02] ring-1 ring-border/50" />
          ))}
        </div>
        <div className="flex flex-col divide-y divide-border/60">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <Hueso className="h-5 w-20" />
              <Hueso className="h-3.5 flex-1 bg-white/[0.08]" />
              <Hueso className="h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
    </Esqueleto>
  );
}

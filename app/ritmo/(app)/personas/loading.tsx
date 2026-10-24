import { Esqueleto, EsqueletoEncabezado, EsqueletoTarjetas, Hueso } from "@/components/ritmo/esqueleto";

// Personas (RR.HH.): 4 tarjetas de resumen + la grilla de fichas.
export default function CargandoPersonas() {
  return (
    <Esqueleto>
      <EsqueletoEncabezado />
      <EsqueletoTarjetas />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="panel flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 shrink-0 rounded-full bg-white/[0.07]" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Hueso className="h-3.5 w-32 bg-white/[0.08]" />
                <Hueso className="h-2.5 w-20 bg-white/[0.05]" />
              </div>
            </div>
            <Hueso className="h-1.5 w-full" />
            <div className="flex gap-2">
              <Hueso className="h-5 w-16" />
              <Hueso className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    </Esqueleto>
  );
}

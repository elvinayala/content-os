import { Esqueleto, EsqueletoEncabezado, EsqueletoFila, EsqueletoTarjetas, Hueso } from "@/components/ritmo/esqueleto";

// Equipo: filtros + 5 tarjetas + una lista por departamento (misma forma que la pantalla final).
export default function CargandoEquipo() {
  return (
    <Esqueleto>
      <div className="flex flex-col gap-4">
        <EsqueletoEncabezado />
        <div className="flex gap-2">
          <Hueso className="h-8 w-48" />
          <Hueso className="h-8 w-40" />
        </div>
      </div>
      <EsqueletoTarjetas n={5} className="md:grid-cols-5" />
      {[5, 3].map((n, i) => (
        <section key={i} className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <Hueso className="h-3.5 w-28 bg-white/[0.08]" />
            <Hueso className="h-3 w-16" />
          </div>
          <div className="divide-y">
            {Array.from({ length: n }, (_, j) => (
              <EsqueletoFila key={j} />
            ))}
          </div>
        </section>
      ))}
    </Esqueleto>
  );
}

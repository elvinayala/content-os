import { Esqueleto, EsqueletoEncabezado, EsqueletoFila, Hueso } from "@/components/ritmo/esqueleto";

// Ranking: selector del mes + una tarjeta por persona.
export default function CargandoRanking() {
  return (
    <Esqueleto>
      <EsqueletoEncabezado />
      <div className="flex gap-2">
        <Hueso className="h-8 w-32" />
        <Hueso className="h-8 w-24" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="panel p-1">
            <EsqueletoFila />
          </div>
        ))}
      </div>
    </Esqueleto>
  );
}

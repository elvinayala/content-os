import { Esqueleto, EsqueletoEncabezado, Hueso } from "@/components/ritmo/esqueleto";

// Noticias: filtros + la lista de publicaciones.
export default function CargandoNoticias() {
  return (
    <Esqueleto className="mx-auto w-full max-w-2xl gap-5">
      <EsqueletoEncabezado />
      <Hueso className="h-8 w-56" />
      <div className="panel divide-y divide-border/60 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 p-4">
            <Hueso className="h-2.5 w-24 bg-white/[0.05]" />
            <Hueso className="h-4 w-3/4 bg-white/[0.08]" />
            <Hueso className="h-3 w-full" />
            <Hueso className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </Esqueleto>
  );
}

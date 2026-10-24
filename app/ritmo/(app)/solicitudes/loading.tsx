import { Esqueleto, EsqueletoEncabezado, Hueso } from "@/components/ritmo/esqueleto";

// Solicitudes: el formulario de pedir + las tarjetas de solicitudes.
export default function CargandoSolicitudes() {
  return (
    <Esqueleto className="mx-auto w-full max-w-3xl">
      <EsqueletoEncabezado />
      <div className="panel flex flex-col gap-3 p-5">
        <Hueso className="h-4 w-40 bg-white/[0.08]" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-11 rounded-lg bg-white/[0.04]" />
          <div className="h-11 rounded-lg bg-white/[0.04]" />
        </div>
        <div className="h-20 rounded-lg bg-white/[0.04]" />
        <div className="h-12 rounded-full bg-white/[0.06]" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="panel flex flex-col gap-2 p-4">
          <Hueso className="h-3.5 w-48 bg-white/[0.08]" />
          <Hueso className="h-3 w-64 max-w-full" />
        </div>
      ))}
    </Esqueleto>
  );
}

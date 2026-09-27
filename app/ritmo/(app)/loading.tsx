// Mientras el servidor arma la pestaña: esqueleto inmediato (sin esto el clic parecía no hacer nada).
// Además, con loading.tsx Next precarga el marco de cada pestaña del menú (prefetch hasta este borde).
export default function Cargando() {
  return (
    <div className="flex animate-pulse flex-col gap-6 motion-reduce:animate-none" aria-busy="true" aria-label="Cargando">
      <div className="flex flex-col gap-2">
        <div className="h-3 w-40 rounded-full bg-white/[0.06]" />
        <div className="h-8 w-56 rounded-lg bg-white/[0.08]" />
        <div className="h-3 w-80 max-w-full rounded-full bg-white/[0.05]" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel h-24" />
        ))}
      </div>
      <div className="panel h-64" />
    </div>
  );
}

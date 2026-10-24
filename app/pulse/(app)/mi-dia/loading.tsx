// Mientras carga Mi día: título y grupos de pendientes en esqueleto (misma forma que la lista real).
export default function CargandoMiDia() {
  return (
    <div className="carga-tardia fondo-malla min-h-svh" aria-busy="true" aria-label="Cargando Mi día">
      <div className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <div className="esqueleto size-5" />
        <div className="esqueleto h-4 w-16" />
      </div>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="esqueleto h-3 w-40" />
            <div className="esqueleto h-8 w-36" />
            <div className="esqueleto h-3.5 w-72 max-w-full" />
          </div>
          <div className="esqueleto h-8 w-52" />
        </div>
        {[4, 3].map((n, g) => (
          <div key={g} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="esqueleto size-7 rounded-lg" />
              <div className="esqueleto h-4 w-44" />
            </div>
            <div className="overflow-hidden rounded-xl border bg-white">
              {Array.from({ length: n }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-b px-3 py-3 last:border-b-0">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="esqueleto h-3.5" style={{ width: `${30 + ((i * 11 + g * 7) % 25)}%` }} />
                    <div className="esqueleto h-3 w-1/3" />
                  </div>
                  <div className="esqueleto h-8 w-24" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

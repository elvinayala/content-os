// Mientras carga la lista de clientes: pestañas, buscador y filas en esqueleto (misma forma que la lista real).
export default function CargandoClientes() {
  return (
    <div className="carga-tardia fondo-malla min-h-svh" aria-busy="true" aria-label="Cargando clientes">
      <div className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <div className="esqueleto size-5" />
        <div className="esqueleto h-4 w-16" />
        <div className="esqueleto h-4 w-28" />
      </div>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-2">
          <div className="esqueleto h-8 w-56" />
          <div className="esqueleto h-3.5 w-72 max-w-full" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="esqueleto h-10 w-full sm:w-[28rem]" />
          <div className="esqueleto h-9 w-full sm:w-64" />
        </div>
        <div className="superficie overflow-hidden">
          <div className="border-b px-5 py-3">
            <div className="esqueleto h-3 w-1/3" />
          </div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b px-5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_90px_90px]">
              <div className="flex flex-col gap-1.5">
                <div className="esqueleto h-3.5" style={{ width: `${45 + ((i * 13) % 35)}%` }} />
                <div className="esqueleto h-3 w-1/3" />
              </div>
              <div className="esqueleto h-3 w-24" />
              <div className="esqueleto hidden h-3 w-14 sm:block" />
              <div className="esqueleto ml-auto hidden h-3 w-12 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

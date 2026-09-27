// Mientras carga cualquier pantalla de Pulse: esqueletos suaves en vez de una pantalla en blanco.
export default function CargandoPulse() {
  return (
    <div className="fondo-malla min-h-svh">
      <div className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <div className="esqueleto h-5 w-5" />
        <div className="esqueleto h-4 w-32" />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-2">
          <div className="esqueleto h-3 w-40" />
          <div className="esqueleto h-8 w-72" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="esqueleto h-24" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div className="esqueleto h-80" />
          <div className="esqueleto h-80" />
        </div>
      </div>
    </div>
  );
}

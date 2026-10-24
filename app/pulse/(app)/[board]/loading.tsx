// Mientras carga un tablero: esqueleto con la forma de la tabla (cabecera, barra, columnas, grupos y filas),
// así no salta el layout cuando llegan los datos. `carga-tardia` lo esconde si el tablero llega en < 150 ms.
const COLUMNAS = [140, 160, 130, 150, 120, 140];
const GRUPOS = [6, 4, 3];

export default function CargandoTablero() {
  return (
    <div className="carga-tardia flex h-svh flex-col" aria-busy="true" aria-label="Cargando tablero">
      {/* cabecera del tablero */}
      <div className="vidrio flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <div className="esqueleto size-5" />
        <div className="esqueleto size-8 rounded-lg" />
        <div className="esqueleto h-5 w-44" />
        <div className="ml-auto flex items-center gap-2">
          <div className="esqueleto h-8 w-8 rounded-full" />
          <div className="esqueleto h-8 w-24" />
        </div>
      </div>
      {/* barra de vistas, búsqueda y filtros */}
      <div className="vidrio flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <div className="esqueleto h-7 w-40" />
        <div className="esqueleto h-8 w-32" />
        <div className="esqueleto h-8 w-44" />
        <div className="esqueleto hidden h-8 w-20 sm:block" />
        <div className="esqueleto ml-auto hidden h-8 w-24 sm:block" />
      </div>
      {/* tabla */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-9 items-center border-b">
          <div className="w-9 shrink-0" />
          <div className="flex w-[300px] shrink-0 justify-center">
            <div className="esqueleto h-3 w-20" />
          </div>
          {COLUMNAS.map((w, i) => (
            <div key={i} className="flex shrink-0 justify-center" style={{ width: w }}>
              <div className="esqueleto h-3 w-16" />
            </div>
          ))}
        </div>
        {GRUPOS.map((filas, g) => (
          <div key={g} className="mb-5">
            <div className="flex h-10 items-center gap-2 px-3">
              <div className="esqueleto size-4" />
              <div className="esqueleto h-4 w-36" />
            </div>
            {Array.from({ length: filas }).map((_, i) => (
              <div key={i} className="flex h-9 items-center border-b border-[var(--pulse-linea)]" style={{ borderLeft: "3px solid #e6e6ea" }}>
                <div className="flex w-9 shrink-0 justify-center">
                  <div className="esqueleto size-4 rounded-sm" />
                </div>
                <div className="w-[300px] shrink-0 px-3">
                  <div className="esqueleto h-3.5" style={{ width: `${55 + ((i * 17 + g * 11) % 35)}%` }} />
                </div>
                {COLUMNAS.map((w, c) => (
                  <div key={c} className="shrink-0 px-2" style={{ width: w }}>
                    <div className={c === 0 ? "esqueleto h-6 rounded-sm" : "esqueleto h-3"} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

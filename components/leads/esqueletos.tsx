// Esqueletos de carga de Leads (los usan los loading.tsx de /pulse/leads/[marca]/…). Tienen la misma forma que la
// pantalla real (cabecera h-12, barra de vistas y filtros, columnas o tabla) para que no salte el layout.
// `carga-tardia` en el envoltorio: si la pantalla llega en < 150 ms, no se ven (sin parpadeo).

function Marco({ children, etiqueta }: { children: React.ReactNode; etiqueta: string }) {
  return (
    <div className="carga-tardia flex h-svh flex-col bg-background" aria-busy="true" aria-label={etiqueta}>
      <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
        <div className="esqueleto size-5" />
        <div className="esqueleto h-4 w-14" />
        <div className="esqueleto h-4 w-20" />
      </div>
      {children}
    </div>
  );
}

function Barra() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2.5">
      <div className="esqueleto h-8 w-32" />
      <div className="esqueleto h-8 w-16" />
      <div className="esqueleto h-8 w-40" />
      <div className="esqueleto hidden h-8 w-28 sm:block" />
      <div className="esqueleto hidden h-8 w-28 sm:block" />
    </div>
  );
}

const TARJETAS = [4, 3, 5, 2, 3, 1];

export function EsqueletoEmbudo() {
  return (
    <Marco etiqueta="Cargando embudo">
      <Barra />
      <div className="flex min-h-0 flex-1 flex-col bg-[#f6f7f9]">
        <div className="flex items-center gap-4 px-4 py-2.5">
          <div className="esqueleto h-4 w-36" />
          <div className="esqueleto h-3 w-24" />
          <div className="esqueleto h-3 w-28" />
        </div>
        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden px-4">
          {TARJETAS.map((n, i) => (
            <div key={i} className="flex w-[272px] shrink-0 flex-col gap-2 rounded-xl bg-[#eceef1]/70 p-1.5">
              <div className="rounded-lg bg-background px-3 py-2.5">
                <div className="esqueleto h-4 w-28" />
              </div>
              {Array.from({ length: n }).map((_, k) => (
                <div key={k} className="flex items-start gap-2.5 rounded-lg border border-black/[0.06] bg-background p-3">
                  <div className="esqueleto size-8 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="esqueleto h-3.5" style={{ width: `${60 + ((i * 13 + k * 7) % 30)}%` }} />
                    <div className="esqueleto h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Marco>
  );
}

export function EsqueletoLista() {
  return (
    <Marco etiqueta="Cargando lista de leads">
      <Barra />
      <div className="flex gap-1 px-4 py-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="esqueleto h-6 w-20 rounded-full" />
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4">
        <div className="flex gap-3 border-b py-2.5">
          {[20, 14, 22, 12, 10, 8].map((w, i) => (
            <div key={i} className="esqueleto h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b py-3">
            <div className="esqueleto h-3.5" style={{ width: `${14 + ((i * 7) % 8)}%` }} />
            <div className="esqueleto h-3 w-[14%]" />
            <div className="esqueleto h-3 w-[22%]" />
            <div className="esqueleto h-3 w-[12%]" />
            <div className="esqueleto h-3 w-[10%]" />
            <div className="esqueleto h-3 w-[8%]" />
          </div>
        ))}
      </div>
    </Marco>
  );
}

export function EsqueletoActividades() {
  return (
    <Marco etiqueta="Cargando actividades">
      <Barra />
      <div className="min-h-0 flex-1 overflow-hidden bg-muted/30">
        <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-6">
          {[3, 4, 2].map((n, g) => (
            <div key={g} className="flex flex-col gap-2">
              <div className="esqueleto h-3 w-24" />
              <div className="divide-y rounded-lg border bg-background">
                {Array.from({ length: n }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3">
                    <div className="esqueleto size-4 rounded-sm" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="esqueleto h-3.5 w-2/5" />
                      <div className="esqueleto h-3 w-1/4" />
                    </div>
                    <div className="esqueleto h-3 w-14" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Marco>
  );
}

export function EsqueletoDetalle() {
  return (
    <Marco etiqueta="Cargando lead">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="esqueleto mt-1 size-7" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="esqueleto h-6 w-56" />
            <div className="esqueleto h-3.5 w-80 max-w-full" />
          </div>
          <div className="esqueleto h-8 w-24" />
          <div className="esqueleto h-8 w-24" />
        </div>
        <div className="esqueleto mt-4 h-7 w-full" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="esqueleto h-3 w-20" />
                <div className="esqueleto h-8" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border">
              <div className="flex gap-4 border-b px-4 py-2.5">
                <div className="esqueleto h-4 w-20" />
                <div className="esqueleto h-4 w-14" />
                <div className="esqueleto h-4 w-24" />
              </div>
              <div className="p-3">
                <div className="esqueleto h-20" />
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
              <div className="esqueleto h-3 w-20" />
              {[60, 45, 70, 50].map((w, i) => (
                <div key={i} className={i % 2 ? "flex justify-end" : "flex"}>
                  <div className="esqueleto h-12" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Marco>
  );
}

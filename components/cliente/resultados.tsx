import type { AnuncioTop, ResultadosCliente } from "@/lib/clientes-app/resultados";
import type { Numeros } from "@/lib/clientes-app/resultados-reglas";

// Piezas de Resultados (server components, sin JS en el cliente).
export const dinero = (n: number | null, moneda = "USD", dec = 2) => (n == null ? "—" : new Intl.NumberFormat("es-PR", { style: "currency", currency: moneda, maximumFractionDigits: dec, minimumFractionDigits: dec }).format(n));
export const entero = (n: number | null) => (n == null ? "—" : new Intl.NumberFormat("es-PR").format(Math.round(n)));

export function Dato({ titulo, valor, detalle, destacado = false }: { titulo: string; valor: string; detalle?: string; destacado?: boolean }) {
  return (
    <div className={destacado ? "panel border-primary/40 bg-primary/[0.07] p-4" : "panel p-4"}>
      <p className="ceja">{titulo}</p>
      <p className={`lu-titulo mt-1 text-2xl font-semibold ${destacado ? "text-primary" : ""}`}>{valor}</p>
      {detalle ? <p className="mt-0.5 text-[11px] text-muted-foreground">{detalle}</p> : null}
    </div>
  );
}

export function detalleResultados(t: Numeros) {
  const partes = [t.leads ? `${entero(t.leads)} ${t.leads === 1 ? "lead" : "leads"}` : "", t.mensajes ? `${entero(t.mensajes)} ${t.mensajes === 1 ? "conversación" : "conversaciones"}` : ""].filter(Boolean);
  return partes.join(" · ") || "Leads y conversaciones";
}

/** Barras por día: inversión (gris) y resultados (amarillo), escaladas cada una a su máximo. */
export function GraficoDiario({ serie }: { serie: ResultadosCliente["serie"] }) {
  if (serie.length < 2) return null;
  const maxI = Math.max(...serie.map((d) => d.inversion), 1);
  const maxR = Math.max(...serie.map((d) => d.resultados), 1);
  const w = 100 / serie.length;
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="ceja">Día a día</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-muted-foreground/40" /> Inversión
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> Resultados
          </span>
        </div>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-32 w-full">
        {serie.map((d, i) => (
          <g key={d.fecha}>
            <rect x={i * w + w * 0.12} width={w * 0.34} y={40 - (d.inversion / maxI) * 38} height={(d.inversion / maxI) * 38} rx="0.6" fill="rgb(163 163 163 / 35%)" />
            <rect x={i * w + w * 0.52} width={w * 0.34} y={40 - (d.resultados / maxR) * 38} height={(d.resultados / maxR) * 38} rx="0.6" fill="#f5ce1a" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{new Date(`${serie[0].fecha}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "short" })}</span>
        <span>{new Date(`${serie.at(-1)!.fecha}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );
}

export function Anuncio({ a, moneda }: { a: AnuncioTop; moneda: string }) {
  return (
    <div className="panel flex items-center gap-3 p-3">
      {a.miniatura ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.miniatura} alt="" className="size-16 shrink-0 rounded-xl object-cover" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="size-16 shrink-0 rounded-xl bg-muted" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{a.nombre}</p>
        <p className="text-xs text-muted-foreground">
          {a.numeros.resultados ? `${entero(a.numeros.resultados)} resultados · ${dinero(a.numeros.costoResultado, moneda)} c/u` : `${entero(a.numeros.ventas)} ventas`}
        </p>
        <p className="text-[11px] text-muted-foreground">Inversión {dinero(a.numeros.inversion, moneda)}</p>
      </div>
    </div>
  );
}

/** Inicio: los últimos 7 días en una tarjeta (si hay cuenta y hubo inversión). */
export async function SemanaNumeros({ cuenta }: { cuenta: string | null }) {
  if (!cuenta) return null;
  const { resultadosCliente } = await import("@/lib/clientes-app/resultados");
  const r = await resultadosCliente(cuenta, "7d");
  const t = r.totales;
  if (r.estado !== "ok" || !t?.inversion) return null;
  return (
    <a href="/cliente/resultados" className="panel group flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="ceja">Tu semana en números</p>
        <span className="text-xs text-primary">Ver resultados →</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="lu-titulo text-2xl font-semibold text-primary">{entero(t.resultados)}</p>
          <p className="text-[11px] text-muted-foreground">resultados</p>
        </div>
        <div>
          <p className="lu-titulo text-2xl font-semibold">{dinero(t.costoResultado, r.moneda)}</p>
          <p className="text-[11px] text-muted-foreground">por resultado</p>
        </div>
        <div>
          <p className="lu-titulo text-2xl font-semibold">{dinero(t.inversion, r.moneda, 0)}</p>
          <p className="text-[11px] text-muted-foreground">invertido</p>
        </div>
      </div>
    </a>
  );
}

import { redirect } from "next/navigation";

import { BotonesDecision, QuitarEquipo } from "@/components/ritmo/seguridad";
import { modoSeguridad, panelSeguridad } from "@/lib/desempeno/seguridad";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seguridad" };

const fecha = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// RR.HH. (y la dirección): autoriza computadoras, redes nuevas y ponches manuales.
export default async function SeguridadPage() {
  const u = await usuarioRitmo();
  if (!u?.maestro) redirect("/ritmo");
  const { equipos, manuales } = await panelSeguridad();
  const modo = modoSeguridad();
  const pendEquipos = equipos.filter((e) => e.estado === "pendiente");
  const pendRedes = equipos.filter((e) => e.estado === "aprobado" && e.redPendiente);
  const pendManuales = manuales.filter((m) => m.estado === "pendiente");
  const activos = equipos.filter((e) => e.estado === "aprobado");
  const total = pendEquipos.length + pendRedes.length + pendManuales.length;
  const fila = "panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <p className="ceja">RR.HH.</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Seguridad del ponche</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Cada persona poncha solo desde su computadora de trabajo y desde su red de internet. La primera computadora queda aprobada al registrarla; una segunda, un cambio, una red nueva o un ponche manual los autorizas aquí.
          {modo !== "on" ? <b className="ml-1 text-amber-300">Modo actual: {modo === "aviso" ? "solo aviso (no bloquea)" : "apagado"}.</b> : null}
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Por decidir {total ? <span className="ml-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-300">{total}</span> : null}</h2>
        {!total ? <div className="panel p-5 text-center text-sm text-muted-foreground">Nada pendiente. 👌</div> : null}
        {pendManuales.map((m) => (
          <div key={m.id} className={fila}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                🕐 {m.persona} · ponche manual de <b>{m.tipo}</b> · {fecha(m.hora)}
              </p>
              <p className="text-xs text-muted-foreground">“{m.motivo}” · pedido desde {m.agente ?? "—"}</p>
            </div>
            <BotonesDecision id={m.id} tipo="manual" />
          </div>
        ))}
        {pendEquipos.map((e) => (
          <div key={e.id} className={fila}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                💻 {e.persona} · {e.reemplaza ? "computadora nueva (reemplaza la anterior)" : "segunda computadora"}: <b>{e.nombre}</b>
              </p>
              <p className="text-xs text-muted-foreground">
                {e.agente ?? "—"} · “{e.motivo ?? "sin motivo"}” · {fecha(e.creado)}
              </p>
            </div>
            <BotonesDecision id={e.id} tipo="equipo" />
          </div>
        ))}
        {pendRedes.map((e) => (
          <div key={`r-${e.id}`} className={fila}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                🌐 {e.persona} intentó ponchar desde <b>{e.nombre}</b> en otra red (internet)
              </p>
              <p className="text-xs text-muted-foreground">Autorízala si es su nueva red de trabajo (cambio de proveedor, mudanza). Si no, recházala.</p>
            </div>
            <BotonesDecision id={e.id} tipo="red" />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Computadoras autorizadas ({activos.length})</h2>
        <div className="panel divide-y divide-border/50 overflow-hidden">
          {activos.length ? (
            activos.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-40 truncate font-medium">{e.persona}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {e.nombre} · {e.agente} · {e.redes} {e.redes === 1 ? "red" : "redes"}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">{e.ultimoUso ? `usada ${fecha(e.ultimoUso)}` : "sin usar"}</span>
                <QuitarEquipo id={e.id} />
              </div>
            ))
          ) : (
            <p className="p-5 text-center text-sm text-muted-foreground">Nadie ha registrado su computadora todavía.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Ponches manuales recientes</h2>
        <div className="panel divide-y divide-border/50 overflow-hidden">
          {manuales.filter((m) => m.estado !== "pendiente").slice(0, 20).map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-2 text-xs">
              <span className={cn("rounded-full px-2 py-0.5", m.estado === "aprobada" ? "bg-primary/10 text-primary" : "bg-red-400/10 text-red-300")}>{m.estado}</span>
              <span className="font-medium">{m.persona}</span>
              <span className="text-muted-foreground">
                {m.tipo} · {fecha(m.hora)} · “{m.motivo}”
              </span>
            </div>
          ))}
          {!manuales.some((m) => m.estado !== "pendiente") ? <p className="p-4 text-center text-xs text-muted-foreground">Todavía no hay.</p> : null}
        </div>
      </section>
    </div>
  );
}

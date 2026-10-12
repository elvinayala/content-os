import { Suspense } from "react";

import { Entregables } from "@/components/cliente/entregables";
import { LineaTiempo } from "@/components/cliente/linea-tiempo";
import { BotonSlack } from "@/components/cliente/piezas";
import { bitacoraCliente } from "@/lib/clientes-app/bitacora";
import { entradasDeEntregas, lineaDeTiempo } from "@/lib/clientes-app/bitacora-reglas";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { listarEntregas, type Entrega } from "@/lib/clientes-app/entregas";
import { visorActual } from "@/lib/clientes-app/sesion";

export const metadata = { title: "Trabajo" };

// Lo que el cliente no tiene en Slack (Elvin, 30/sep): todo el trabajo hecho para él, en orden, y sus entregables.
export default async function TrabajoPage() {
  const v = await visorActual();
  if (!v) return null;
  const f = await fichaCliente(v.itemId);
  if (!f) return null;
  const entregas = await listarEntregas(v.itemId).catch(() => [] as Entrega[]);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="ceja">Trabajo</p>
        <h1 className="lu-titulo mt-1 text-2xl font-semibold">Lo que hemos hecho por ti</h1>
        <p className="text-sm text-muted-foreground">Cada campaña, cada creativo y cada entrega para {f.negocio}.</p>
      </header>

      <Suspense fallback={<div className="panel h-40 animate-pulse" />}>
        <Bitacora itemId={v.itemId} entregas={entregas} equipo={v.modo === "equipo"} />
      </Suspense>

      <Entregables entregas={entregas} equipo={v.modo === "equipo"} />

      <BotonSlack url={f.slackUrl} />
    </div>
  );
}

async function Bitacora({ itemId, entregas, equipo }: { itemId: string; entregas: Entrega[]; equipo: boolean }) {
  const campanas = await bitacoraCliente(itemId).catch(() => []);
  const todo = lineaDeTiempo(campanas, entradasDeEntregas(entregas));
  if (!todo.length)
    return <p className="panel p-5 text-sm text-muted-foreground">Aquí vas a ver cada campaña que lanzamos y cada creativo que te entregamos.</p>;
  return (
    <section className="panel flex flex-col gap-3 p-5">
      {equipo ? <p className="text-[11px] text-muted-foreground">Sale de la columna «Campaigns Level Up» de su ficha, reescrita para el cliente (sin iniciales, montos ni notas internas). Si algo no debe verlo, edítalo en Pulse.</p> : null}
      <LineaTiempo entradas={todo} />
    </section>
  );
}

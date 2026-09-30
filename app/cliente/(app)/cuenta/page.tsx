import { FileText } from "lucide-react";

import { AppMovil, type ConfigApp } from "@/components/app-movil";
import { BotonSlack, PersonaFila } from "@/components/cliente/piezas";
import { linkCliente } from "@/lib/clientes-app/acceso";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { fechaCorta } from "@/lib/clientes-app/formato";
import { CLIENTE_APP } from "@/lib/clientes-app/config";
import { visorActual } from "@/lib/clientes-app/sesion";

export const metadata = { title: "Mi cuenta" };

export default async function CuentaCliente() {
  const v = await visorActual();
  if (!v) return null;
  const f = await fichaCliente(v.itemId);
  if (!f) return null;
  const cfg: ConfigApp = { ...CLIENTE_APP, link: v.modo === "cliente" ? await linkCliente(v.itemId, v.version) : null };
  const datos = [
    ["Negocio", f.negocio],
    ["Servicio", f.servicio],
    ["Plan", f.plan],
    ["Con nosotros desde", fechaCorta(f.inicio)],
    ["Ubicación", f.ubicacion],
  ].filter(([, x]) => x) as [string, string][];
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="ceja">Mi cuenta</p>
        <h1 className="lu-titulo mt-1 text-2xl font-semibold">{f.negocio}</h1>
      </header>

      <section className="panel divide-y divide-border/60">
        {datos.map(([k, x]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-right font-medium">{x}</span>
          </div>
        ))}
        {f.acuerdo ? (
          <a href="/cliente/acuerdo" target="_blank" className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-white/[0.03]">
            <span className="text-muted-foreground">Acuerdo firmado</span>
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <FileText className="size-4" /> Ver PDF
            </span>
          </a>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="lu-titulo text-base font-semibold">Tu equipo</h2>
        {f.equipo.length ? (
          <div className="panel flex flex-col gap-4 p-4">
            {f.equipo.map((p) => (
              <PersonaFila key={`${p.rol}-${p.nombre}`} p={p} conAgenda />
            ))}
          </div>
        ) : (
          <p className="panel px-4 py-3 text-sm text-muted-foreground">Estamos asignando a tu equipo. Te avisamos por Slack.</p>
        )}
        <BotonSlack url={f.slackUrl} grande />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="lu-titulo text-base font-semibold">La app en tu teléfono</h2>
        {v.modo === "cliente" ? (
          <AppMovil clave={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} cfg={cfg} />
        ) : (
          <p className="panel px-4 py-3 text-sm text-muted-foreground">Vista previa del equipo: el cliente instala la app y activa sus avisos desde su teléfono.</p>
        )}
      </section>
    </div>
  );
}

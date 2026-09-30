import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { AppMovil } from "@/components/app-movil";
import { BotonSlack, EtapaCliente, PersonaFila } from "@/components/cliente/piezas";
import { SemanaNumeros } from "@/components/cliente/resultados";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { fechaLarga, hoyPR } from "@/lib/clientes-app/formato";
import { CLIENTE_APP } from "@/lib/clientes-app/config";
import { visorActual } from "@/lib/clientes-app/sesion";

export const metadata = { title: "Inicio" };

function saludo() {
  const h = Number(new Date().toLocaleString("en-US", { timeZone: "America/Puerto_Rico", hour: "numeric", hour12: false }));
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
}

export default async function InicioCliente() {
  const v = await visorActual();
  if (!v) return null;
  const f = await fichaCliente(v.itemId);
  if (!f) return null;
  const hoy = hoyPR();
  const proximo = f.proximoReporte && f.proximoReporte >= hoy ? f.proximoReporte : null;
  const primerNombre = f.contacto.split(/\s+/)[0];
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="ceja">{fechaLarga(hoy)}</p>
        <h1 className="lu-titulo mt-1 text-2xl font-semibold">
          {saludo()}, <span className="text-primary">{primerNombre}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{f.negocio}</p>
      </header>

      {v.modo === "cliente" ? <AppMovil clave={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} cfg={CLIENTE_APP} tarjeta /> : null}

      <EtapaCliente etapa={f.etapa} />

      <Suspense fallback={f.cuentaAnuncios ? <div className="panel h-32 animate-pulse" /> : null}>
        <SemanaNumeros cuenta={f.cuentaAnuncios} />
      </Suspense>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="panel flex items-center gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
            <CalendarClock className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="ceja">Tu próximo reporte</p>
            <p className="text-sm font-medium first-letter:uppercase">{proximo ? fechaLarga(proximo) : "Te avisamos cuando esté listo"}</p>
            {f.ultimoReporte ? <p className="text-[11px] text-muted-foreground">Último: {fechaLarga(f.ultimoReporte)}</p> : null}
          </div>
        </div>
        {f.equipo.length ? (
          <Link href="/cliente/cuenta" className="panel group flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <p className="ceja">Tu equipo</p>
              <ChevronRight className="size-4 text-muted-foreground transition group-hover:text-foreground" />
            </div>
            {f.equipo.slice(0, 2).map((p) => (
              <PersonaFila key={`${p.rol}-${p.nombre}`} p={p} />
            ))}
          </Link>
        ) : null}
      </section>

      <BotonSlack url={f.slackUrl} grande />
      <p className="text-center text-[11px] text-muted-foreground">Solicitudes, cambios y soporte: por el canal de Slack de tu negocio.</p>
    </div>
  );
}

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { NavRitmo } from "@/components/ritmo/nav";
import { vacantesNuevas } from "@/lib/desempeno/carreras";
import { fichaPendiente, leerFicha } from "@/lib/desempeno/fichas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { pendientesDe } from "@/lib/desempeno/solicitudes";
import { esSoloRitmo, tipoAcceso } from "@/lib/pulse/auth";
import { leerPerfiles } from "@/lib/desempeno/datos";
import { veArena } from "@/lib/ventas/datos";

export const dynamic = "force-dynamic";

// Espacios de Slack de cada empresa (ids verificados con auth.test el 28/sep).
const SLACK = {
  level_up: { nombre: "Slack", equipo: "T07V7MUDA9H", web: "https://levelupmediaespacio.slack.com" },
  ai_borinquen: { nombre: "Slack AIB", equipo: "T09LARF90H3", web: "https://aiborinquen.slack.com" },
};

export default async function RitmoAppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const u = await usuarioRitmo();
  if (!u) redirect("/ritmo/entrar");
  // Vista maestra (salarios, documentos, canal ético): segundo paso obligatorio.
  if (u.falta2fa) redirect("/ritmo/verificar");
  // Vista maestra (Equipo, Personas, Ajustes): Elvin, Carilin, Aure y RR.HH. (Yaileen).
  const maestro = u.maestro;
  // Todo empleado nuevo completa su ficha antes de usar Ritmo.
  // Todo en paralelo (antes iba uno detrás del otro y cada pestaña esperaba la suma).
  const [ficha, pendientes, nuevas, arena] = await Promise.all([leerFicha(u.id).catch(() => null), pendientesDe(u).catch(() => 0), vacantesNuevas().catch(() => 0), veArena(u).catch(() => false)]);
  if (!maestro && fichaPendiente(ficha)) redirect("/ritmo/bienvenida");
  // Botón para volver a Pulse (o a Leads, el equipo de ventas). En ritmo.levelupmediapr.net es otro dominio: link completo.
  const pulse = await (async () => {
    if (u.rol === "miembro" && (await esSoloRitmo(u.id))) return null;
    const soloLeads = (await tipoAcceso(u.id, u.rol)) === "solo_leads";
    const host = (await headers()).get("host") ?? "";
    const base = host.startsWith("ritmo.") || host.startsWith("ritmo-") ? process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app" : "";
    // Leads tiene su propio dominio (leads.levelupmediapr.net) cuando LEADS_URL está puesto.
    return soloLeads ? { href: `${process.env.LEADS_URL || base}/pulse/leads`, nombre: "Leads" } : { href: `${base}/pulse`, nombre: "Pulse" };
  })().catch(() => null);
  // Puente a Slack: el espacio de su empresa; la dirección, los dos.
  const empresa = await leerPerfiles(false).then((ps) => ps.find((p) => p.userId === u.id)?.empresa ?? null).catch(() => null);
  const slack = u.rol === "admin" || u.rol === "editor" ? [{ ...SLACK.level_up, nombre: "Slack LU" }, SLACK.ai_borinquen] : [empresa === "ai_borinquen" ? { ...SLACK.ai_borinquen, nombre: "Slack" } : SLACK.level_up];
  return (
    <>
      <NavRitmo nombre={u.nombre} equipo={maestro} ajustes={maestro} miFicha={ficha ? u.id : null} pendientes={pendientes} vacantesNuevas={nuevas} agentes={maestro && (u.rol === "admin" || u.rol === "editor")} arena={arena} pulse={pulse} slack={slack} />
      <main className="entrada mx-auto w-full max-w-5xl px-4 pt-6 pb-32 sm:px-6 md:pb-16">{children}</main>
      <footer className="estado-linea mx-auto hidden w-full max-w-5xl items-center gap-3 px-6 pb-8 md:flex">
        <span>Ritmo</span>
        <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span>{maestro ? "Vista maestra · verificación en dos pasos" : "Sesión protegida"}</span>
        <span>·</span>
        <span>Hora de Puerto Rico</span>
      </footer>
    </>
  );
}

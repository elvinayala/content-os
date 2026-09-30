import { Smartphone } from "lucide-react";

import { AppMovil } from "@/components/ritmo/app-movil";
import { suscripcionesDe } from "@/lib/push/enviar";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi app" };

// Ritmo como app en el teléfono (sin App Store ni Play Store) + sus notificaciones.
export default async function MiAppPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  const telefonos = await suscripcionesDe(u.id).catch(() => []);
  const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pt-2">
      <header>
        <p className="ceja">Configuración</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Smartphone className="size-6 text-primary" /> Ritmo en tu teléfono
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Tenla como una app más (sin App Store ni Play Store) y recibe los avisos: solicitudes, recordatorio de salida, RR.HH. y el equipo.</p>
      </header>

      <AppMovil clave={clave} />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Dónde te llegan los avisos</h2>
        {telefonos.length ? (
          <ul className="panel divide-y divide-border/50">
            {telefonos.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>{t.dispositivo ?? "Teléfono"}</span>
                <span className="text-[11px] text-muted-foreground">{t.ultimoOkAt ? `último aviso ${t.ultimoOkAt.toLocaleDateString("es-PR", { day: "numeric", month: "short", timeZone: "America/Puerto_Rico" })}` : `activo desde ${t.creadoAt.toLocaleDateString("es-PR", { day: "numeric", month: "short", timeZone: "America/Puerto_Rico" })}`}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel px-4 py-3 text-sm text-muted-foreground">Todavía en ningún teléfono. Los avisos te siguen llegando por Slack.</p>
        )}
        <p className="text-[11px] text-muted-foreground">Por seguridad, la notificación solo dice qué pasó; los detalles se ven al abrir Ritmo con tu clave.</p>
      </section>
    </div>
  );
}

import { ShieldCheck } from "lucide-react";

import type { leerEventos } from "@/lib/pulse/seguridad";

const NOMBRE: Record<string, string> = {
  login_ok: "Inicio de sesión",
  login_fallido: "Intento fallido",
  login_bloqueado: "Cuenta bloqueada",
  login_limite_ip: "Límite por IP",
  logout: "Cierre de sesión",
  clave_cambiada: "Clave cambiada",
  usuario_creado: "Usuario creado",
  rol_cambiado: "Rol cambiado",
  usuario_desactivado: "Usuario desactivado",
  usuario_activado: "Usuario activado",
  acceso_tablero: "Acceso a tablero",
  tablero_eliminado: "Tablero eliminado",
};
const ROJO = new Set(["login_fallido", "login_bloqueado", "login_limite_ip", "tablero_eliminado", "usuario_desactivado"]);

export function EventosSeguridad({ eventos }: { eventos: Awaited<ReturnType<typeof leerEventos>> }) {
  return (
    <section className="mt-8 flex flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck className="size-4 text-primary" /> Actividad de seguridad
        </h2>
        <p className="text-sm text-muted-foreground">Últimos inicios de sesión, intentos fallidos, bloqueos y cambios de claves, roles y accesos. Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.</p>
      </div>
      <div className="overflow-hidden rounded-xl border">
        {eventos.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Todavía no hay eventos.</p> : null}
        <ul className="divide-y">
          {eventos.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 text-sm">
              <span className="w-36 shrink-0 tabular-nums text-xs text-muted-foreground">
                {new Date(e.at).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className={`w-40 shrink-0 font-medium ${ROJO.has(e.tipo) ? "text-destructive" : ""}`}>{NOMBRE[e.tipo] ?? e.tipo}</span>
              <span className="min-w-0 truncate">{e.email ?? "—"}</span>
              {e.detalle ? <span className="text-xs text-muted-foreground">{e.detalle}</span> : null}
              {e.ip ? <span className="ml-auto font-mono text-[11px] text-muted-foreground">{e.ip}</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { Kanban, Lock } from "lucide-react";
import { redirect } from "next/navigation";

import { loginPulseAction } from "@/app/pulse/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usuarioActual } from "@/lib/pulse/auth";

export const metadata = { title: "Leads · Equipo de ventas" };

const VERDE = "#08a742";

// Página pública: el embudo del panel es ilustrativo, nunca datos reales.
const COLUMNAS: { titulo: string; color: string; tarjetas: number[] }[] = [
  { titulo: "Nuevo", color: "#34d399", tarjetas: [62, 48, 70] },
  { titulo: "Contactado", color: "#60a5fa", tarjetas: [54, 66] },
  { titulo: "Llamada agendada", color: "#fbbf24", tarjetas: [58, 44] },
  { titulo: "Ganado", color: "#a3e635", tarjetas: [50] },
];

// Entrada del equipo de ventas (28/sep, Elvin: "un login aparte… que entren directo a Leads sin pasar por Pulse").
// Mismas cuentas; después de entrar cae en /pulse/leads y, si es de ventas, nunca ve los tableros de clientes.
export default async function EntradaVentas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error && (await usuarioActual())) redirect("/pulse/leads");
  return (
    <div className="pulse grid min-h-svh w-full bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[10px] text-white shadow-md shadow-emerald-700/25" style={{ background: VERDE }}>
            <Kanban className="size-[18px]" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Leads</span>
          <span className="ml-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Ventas</span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-[30px] leading-tight font-semibold tracking-[-0.02em]">Tu embudo te espera</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">Entra con tu correo y tu clave del equipo de ventas.</p>

          <form action={loginPulseAction} className="mt-8 flex flex-col gap-4">
            <input type="hidden" name="desde" value="/pulse/leads" />
            <input type="hidden" name="puerta" value="ventas" />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" name="email" placeholder="tu@correo.com" autoComplete="username email" autoFocus required className="h-11 focus-visible:border-[#08a742] focus-visible:ring-[#08a742]/25" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" name="password" autoComplete="current-password" required className="h-11 focus-visible:border-[#08a742] focus-visible:ring-[#08a742]/25" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
              <input type="checkbox" name="recordar" value="1" defaultChecked className="size-4 accent-[#08a742]" />
              Mantener la sesión abierta en este equipo
            </label>
            {error ? (
              <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
                {error === "bloqueado" ? "Demasiados intentos. Espera 15 minutos y vuelve a intentar." : error === "limite" ? "Demasiadas solicitudes desde tu conexión. Intenta en un minuto." : "E-mail o contraseña incorrectos."}
              </p>
            ) : null}
            <Button type="submit" className="mt-1 h-11 w-full text-[15px] text-white shadow-md shadow-emerald-700/20 hover:brightness-95" style={{ background: VERDE }}>
              Entrar a Leads
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
            <p>¿No tienes clave o se te olvidó? Pídesela a Yaileen (RR.HH.).</p>
            <p className="inline-flex items-center gap-1.5">
              <Lock className="size-3" /> Conexión segura · solo para el equipo de EA Market
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/80">© {new Date().getFullYear()} EA Market LLC · Level Up Media · AI Borinquen</p>
      </div>

      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-[#07140d] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 45% at 85% 8%, rgb(8 167 66 / 0.45), transparent 70%), radial-gradient(45% 40% at 5% 95%, rgb(52 211 153 / 0.18), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)" }}
        />

        <div className="relative">
          <p className="text-xs font-medium tracking-[0.18em] text-emerald-200/60 uppercase">Equipo de ventas · EA Market</p>
          <h2 className="mt-4 max-w-md text-4xl leading-tight font-semibold tracking-[-0.02em] text-white">Cada conversación es una venta en camino.</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">WhatsApp, citas y seguimientos en un solo embudo, para que ningún lead se quede sin contestar.</p>
        </div>

        {/* Embudo ilustrativo */}
        <div className="relative mt-10">
          <div className="absolute -top-4 right-6 z-10 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-[#0b2416]/90 px-3 py-1.5 text-[11px] font-medium text-emerald-100 shadow-lg backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Lead nuevo por WhatsApp
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-1.5 pb-3">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {COLUMNAS.map((col) => (
                <div key={col.titulo} className="flex min-w-0 flex-col gap-2 rounded-xl bg-white/[0.03] p-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: col.color }} />
                    <span className="truncate text-[10px] font-medium text-white/60">{col.titulo}</span>
                  </div>
                  {col.tarjetas.map((ancho, i) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-white/[0.06] p-2" style={{ borderLeft: `2px solid ${col.color}` }}>
                      <div className="h-2 rounded bg-white/25" style={{ width: `${ancho}%` }} />
                      <div className="mt-1.5 h-1.5 rounded bg-white/10" style={{ width: `${ancho - 18}%` }} />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="size-3.5 rounded-full bg-white/10" />
                        <span className="size-1.5 rounded-full" style={{ background: i === 0 ? "#34d399" : "rgb(255 255 255 / 0.2)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

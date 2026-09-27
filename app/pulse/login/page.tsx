import { redirect } from "next/navigation";

import { loginPulseAction } from "@/app/pulse/login/actions";
import { PulseLogo } from "@/components/pulse/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usuarioActual } from "@/lib/pulse/auth";
import { NOMBRE_APP, SUBTITULO_APP } from "@/lib/pulse/types";

export const metadata = { title: `Entrar · ${NOMBRE_APP}` };

// Entrada en pantalla dividida: el formulario a la izquierda y la marca a la derecha. La vista del
// producto es ilustrativa (página pública: nunca datos reales).
export default async function PulseLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; desde?: string }> }) {
  const { error, desde } = await searchParams;
  if (!error && (await usuarioActual())) redirect(desde?.startsWith("/pulse") ? desde : "/pulse");
  return (
    <div className="grid min-h-svh w-full bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <PulseLogo size={30} />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">{NOMBRE_APP}</span>
          <span className="ml-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{SUBTITULO_APP}</span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-[28px] font-semibold">Bienvenido de vuelta</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">Entra al sistema operativo de EA Market.</p>

          <form action={loginPulseAction} className="mt-8 flex flex-col gap-4">
            <input type="hidden" name="desde" value={desde ?? ""} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail de trabajo</Label>
              <Input id="email" type="email" name="email" placeholder="tu@levelupmediapr.net" autoComplete="username email" autoFocus required className="h-11" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" name="password" autoComplete="current-password" required className="h-11" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
              <input type="checkbox" name="recordar" value="1" defaultChecked className="size-4 accent-primary" />
              Mantener la sesión abierta en este equipo (90 días)
            </label>
            {error ? (
              <p className="rounded-lg bg-destructive/8 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
                {error === "bloqueado" ? "Demasiados intentos. Espera 15 minutos y vuelve a intentar." : error === "limite" ? "Demasiadas solicitudes desde tu conexión. Intenta en un minuto." : "E-mail o contraseña incorrectos."}
              </p>
            ) : null}
            <Button type="submit" className="mt-1 h-11 w-full text-[15px]">
              Entrar
            </Button>
          </form>
          <p className="mt-6 text-xs text-muted-foreground">¿No tienes acceso o se te olvidó la contraseña? Pídeselo a tu supervisor o a RR.HH.</p>
        </div>

        <p className="text-[11px] text-muted-foreground/80">© {new Date().getFullYear()} EA Market LLC · Level Up Media · AI Borinquen</p>
      </div>

      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-[#111114] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 80% 10%, oklch(0.62 0.15 40 / 0.35), transparent 70%), radial-gradient(50% 40% at 10% 90%, oklch(0.55 0.12 260 / 0.28), transparent 70%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)" }}
        />
        <div className="relative">
          <p className="text-xs font-medium tracking-[0.18em] text-white/50 uppercase">El sistema operativo de EA Market</p>
          <h2 className="mt-4 max-w-md text-4xl leading-tight font-semibold text-white">Cada cliente. Cada paso. Un solo lugar.</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">Clientes, leads, procesos y equipo conectados en tiempo real, para que nada se quede sin atender.</p>
        </div>

        {/* Vista ilustrativa del producto */}
        <div className="relative mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-1.5 pb-3">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["Activos", "Onboarding", "Nuevos"].map((t, i) => (
              <div key={t} className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                <p className="text-[10px] text-white/45">{t}</p>
                <div className="mt-2 h-4 rounded bg-white/20" style={{ width: `${[70, 45, 55][i]}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-white/[0.03]">
            {[
              ["Cliente activo", "#00c875"],
              ["Onboarding", "#fdab3d"],
              ["Estrategia", "#579bfc"],
              ["Cliente activo", "#00c875"],
            ].map(([t, c], i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <span className="size-6 rounded-full bg-white/10" />
                <span className="h-2.5 flex-1 rounded bg-white/15" style={{ maxWidth: `${[38, 52, 30, 44][i]}%` }} />
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium" style={{ background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
                  <span className="size-1.5 rounded-full" style={{ background: c }} />
                  {t}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

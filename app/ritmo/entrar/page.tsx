import { redirect } from "next/navigation";

import { loginPulseAction } from "@/app/pulse/login/actions";
import { RitmoLogo } from "@/components/ritmo/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usuarioActual } from "@/lib/pulse/auth";

export const metadata = { title: "Entrar" };

const ERRORES: Record<string, string> = {
  "1": "E-mail o clave incorrectos.",
  bloqueado: "Demasiados intentos. Espera 15 minutos.",
  limite: "Demasiados intentos seguidos. Espera un minuto.",
};

// Entrada a Ritmo con la misma cuenta de Pulse (la sesión la maneja loginPulseAction).
export default async function EntrarRitmo({ searchParams }: { searchParams: Promise<{ error?: string; desde?: string }> }) {
  const { error, desde } = await searchParams;
  const destino = desde?.startsWith("/ritmo") ? desde : "/ritmo";
  if (!error && (await usuarioActual())) redirect(destino);
  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="panel w-full max-w-sm p-7">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <RitmoLogo size={56} className="drop-shadow-[0_0_22px_oklch(0.79_0.13_42/0.35)]" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ritmo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tu día de trabajo, en un toque.</p>
          </div>
        </div>
        <form action={loginPulseAction} className="flex flex-col gap-4">
          <input type="hidden" name="desde" value={destino} />
          <input type="hidden" name="recordar" value="1" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" name="email" placeholder="tu@levelupmediapr.net" autoComplete="username email" className="h-12" autoFocus required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Clave</Label>
            <Input id="password" type="password" name="password" autoComplete="current-password" className="h-12" required />
          </div>
          {error ? <p className="text-sm text-red-400">{ERRORES[error] ?? "No se pudo entrar."}</p> : null}
          <Button type="submit" className="mt-2 h-12 rounded-full text-base font-semibold">Entrar</Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">Es la misma cuenta de Pulse. Si no tienes clave, pídesela a Carilin.</p>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";

import { PulseLogo } from "@/components/pulse/logo";

import { loginPulseAction } from "@/app/pulse/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usuarioActual } from "@/lib/pulse/auth";
import { NOMBRE_APP, SUBTITULO_APP } from "@/lib/pulse/types";

export const metadata = { title: `Entrar · ${NOMBRE_APP}` };

export default async function PulseLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; desde?: string }>;
}) {
  const { error, desde } = await searchParams;
  if (!error && (await usuarioActual())) redirect(desde?.startsWith("/pulse") ? desde : "/pulse");
  return (
    <div className="fondo-malla flex min-h-svh w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm border-white/70 bg-white/85 shadow-2xl shadow-primary/10 backdrop-blur-md">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <PulseLogo size={44} className="drop-shadow-[0_8px_18px_rgba(200,86,45,0.4)]" />
            <div className="leading-none">
              <h1 className="text-xl font-semibold tracking-[-0.02em]">{NOMBRE_APP}</h1>
              <p className="mt-1 text-[10px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{SUBTITULO_APP} · CRM de clientes</p>
            </div>
          </div>

          <form action={loginPulseAction} className="flex flex-col gap-3">
            <input type="hidden" name="desde" value={desde ?? ""} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" name="email" placeholder="tu@levelupmediapr.net" autoFocus required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" name="password" required />
            </div>
            {error ? (
              <p className="text-sm text-destructive">
                {error === "bloqueado" ? "Demasiados intentos. Esperá 15 minutos y volvé a probar." : error === "limite" ? "Demasiadas solicitudes desde tu conexión. Probá en un minuto." : "E-mail o contraseña incorrectos."}
              </p>
            ) : null}
            <Button type="submit" className="mt-1 w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

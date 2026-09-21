import { Activity } from "lucide-react";
import { redirect } from "next/navigation";

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
      <Card className="w-full max-w-sm border-white/60 shadow-xl shadow-primary/10">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <div className="logo-pulse flex size-10 items-center justify-center rounded-xl text-white">
              <Activity className="size-5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-semibold">{NOMBRE_APP}</h1>
              <p className="text-xs text-muted-foreground">{SUBTITULO_APP} · CRM de clientes</p>
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
            {error ? <p className="text-sm text-destructive">E-mail o contraseña incorrectos.</p> : null}
            <Button type="submit" className="mt-1 w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { Kanban } from "lucide-react";
import { redirect } from "next/navigation";

import { loginPulseAction } from "@/app/pulse/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usuarioActual } from "@/lib/pulse/auth";

export const metadata = { title: "Leads · Equipo de ventas" };

// Entrada del equipo de ventas (28/sep, Elvin: "un login aparte… que entren directo a Leads sin pasar por Pulse").
// Mismas cuentas; después de entrar cae en /pulse/leads y, si es de ventas, nunca ve los tableros de clientes.
export default async function EntradaVentas({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error && (await usuarioActual())) redirect("/pulse/leads");
  return (
    <div className="pulse fondo-malla flex min-h-svh items-center justify-center bg-background px-5 py-10 text-foreground">
      <div className="superficie w-full max-w-sm p-7">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#08a742] text-white shadow-lg shadow-emerald-600/20">
            <Kanban className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="text-sm text-muted-foreground">Entrada del equipo de ventas de EA Market.</p>
        </div>
        <form action={loginPulseAction} className="flex flex-col gap-4">
          <input type="hidden" name="desde" value="/pulse/leads" />
          <input type="hidden" name="puerta" value="ventas" />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" name="email" autoComplete="username email" autoFocus required className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" name="password" autoComplete="current-password" required className="h-11" />
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
          <Button type="submit" className="h-11 bg-[#08a742] text-[15px] text-white hover:bg-[#07923a]">
            Entrar a Leads
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">¿No tienes clave o se te olvidó? Pídesela a Yaileen (RR.HH.).</p>
      </div>
    </div>
  );
}

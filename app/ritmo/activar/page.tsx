import Link from "next/link";

import { activarAction } from "@/app/ritmo/activar/actions";
import { RitmoLogo } from "@/components/ritmo/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verificarLink } from "@/lib/desempeno/acceso";

import { BotonActivar } from "./boton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Crear tu clave" };

const ERRORES: Record<string, string> = {
  corta: "La clave debe tener al menos 8 caracteres.",
  distintas: "Las dos claves no coinciden.",
  limite: "Demasiados intentos. Espera un minuto.",
};

// La persona llega con el link que le mandó Carilin/Aure/Elvin y crea su propia clave.
export default async function ActivarPage({ searchParams }: { searchParams: Promise<{ t?: string; error?: string; d?: string }> }) {
  const { t, error, d } = await searchParams;
  // d=leads: link para el equipo comercial → la misma cuenta de Pulse, pero al terminar va a Leads.
  const leads = d === "leads";
  const u = await verificarLink(t);
  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="panel w-full max-w-sm p-7">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <RitmoLogo size={52} />
          {u ? (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Hola, <span className="texto-ritmo">{u.nombre.split(" ")[0]}</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Crea tu clave para entrar a {leads ? "Leads (Pulse)" : "Ritmo"}. Tu e-mail es {u.email}.</p>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Este link ya se usó o venció</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Si ya creaste tu clave, entra con tu correo y esa clave. Si todavía no la has creado, pídele un link nuevo a RR.HH. (Yaileen).
              </p>
            </div>
          )}
        </div>
        {u ? (
          <form action={activarAction} className="flex flex-col gap-4">
            <input type="hidden" name="t" value={t} />
            {leads && <input type="hidden" name="d" value="leads" />}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clave">Clave nueva (mínimo 8)</Label>
              <Input id="clave" name="clave" type="password" autoComplete="new-password" minLength={8} className="h-12" required autoFocus />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="otra">Repítela</Label>
              <Input id="otra" name="otra" type="password" autoComplete="new-password" minLength={8} className="h-12" required />
            </div>
            {error && ERRORES[error] ? <p className="text-sm text-red-400">{ERRORES[error]}</p> : null}
            <BotonActivar texto={leads ? "Entrar a Leads" : "Entrar a Ritmo"} />
          </form>
        ) : (
          // Sirve una sola vez: quien ya creó la clave (o tocó dos veces, o la creó dentro de WhatsApp y volvió a abrir el link) entra por aquí.
          <Link href={leads ? "/pulse/login" : "/ritmo/entrar"} className="flex h-12 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            Ya tengo mi clave: entrar
          </Link>
        )}
      </div>
    </div>
  );
}

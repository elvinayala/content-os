import { redirect } from "next/navigation";

import { logoutPulseAction } from "@/app/pulse/login/actions";
import { FormCodigoPulse } from "@/components/pulse/form-codigo";
import { PulseLogo } from "@/components/pulse/logo";
import { estadoDosPasos } from "@/lib/desempeno/dos-pasos";
import { segundoPasoPendiente, usuarioActual } from "@/lib/pulse/auth";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Verificación · ${NOMBRE_APP}` };

// Segundo candado de Pulse (28/sep): código de Google/Microsoft Authenticator. La primera vez se escanea el QR (si ya lo
// configuraste en Ritmo, es el mismo: solo escribe el código). El navegador queda recordado 30 días.
export default async function VerificarPulse() {
  const u = await usuarioActual();
  if (!u) redirect("/pulse/login");
  if (!(await segundoPasoPendiente(u))) redirect("/pulse");
  const estado = await estadoDosPasos(u.id, u.email);
  return (
    <div className="fondo-malla flex min-h-svh items-center justify-center px-5 py-10">
      <div className="superficie w-full max-w-sm p-7">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <PulseLogo size={40} />
          <h1 className="text-xl font-semibold">Verificación en dos pasos</h1>
          <p className="text-sm text-muted-foreground">
            {estado.configurada
              ? "Escribe el código de 6 números que ves ahora en tu app autenticadora (la misma de Ritmo)."
              : "Pulse guarda información confidencial de la empresa, así que tu cuenta lleva un segundo candado. Se configura una sola vez."}
          </p>
        </div>
        {!estado.configurada ? (
          <ol className="mb-6 flex flex-col gap-4 text-sm">
            <li>
              <b>1.</b> Instala <b>Google Authenticator</b> o <b>Microsoft Authenticator</b> en tu teléfono (gratis).
            </li>
            <li className="flex flex-col gap-3">
              <span>
                <b>2.</b> En la app, toca <b>“+”</b> y escanea este código:
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={estado.qr} alt="Código QR para la app autenticadora" width={200} height={200} className="self-center rounded-xl border bg-white p-2" />
              <span className="text-xs text-muted-foreground">
                ¿No puedes escanear? Escribe esta clave en la app: <span className="break-all font-mono text-foreground">{estado.clave}</span>
              </span>
            </li>
            <li>
              <b>3.</b> Escribe aquí el código de 6 números que te sale:
            </li>
          </ol>
        ) : null}
        <FormCodigoPulse destino="/pulse" />
        <p className="mt-5 text-center text-xs text-muted-foreground">¿Perdiste el teléfono? Pídele a Elvin que te reinicie la verificación.</p>
        <form action={logoutPulseAction} className="mt-2 text-center">
          <button type="submit" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
            Salir
          </button>
        </form>
      </div>
    </div>
  );
}

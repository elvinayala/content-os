import { redirect } from "next/navigation";

import { salirDeRitmoAction } from "@/app/ritmo/actions";
import { RitmoLogo } from "@/components/ritmo/logo";
import { FormCodigo } from "@/components/ritmo/verificar";
import { estadoDosPasos } from "@/lib/desempeno/dos-pasos";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verificación" };

// Segundo paso de la vista maestra: la primera vez se escanea el QR con una app autenticadora; después, solo
// el código de 6 números. El dispositivo queda recordado 30 días.
export default async function VerificarPage() {
  const u = await usuarioRitmo();
  if (!u) redirect("/ritmo/entrar");
  if (!u.falta2fa) redirect("/ritmo");
  const estado = await estadoDosPasos(u.id, u.email);
  return (
    <div className="flex min-h-svh items-center justify-center px-5 py-10">
      <div className="panel w-full max-w-sm p-7">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <RitmoLogo size={48} />
          <h1 className="text-xl font-semibold tracking-tight">Verificación en dos pasos</h1>
          <p className="text-sm text-muted-foreground">
            {estado.configurada
              ? "Escribe el código de 6 números que ves ahora en tu app autenticadora."
              : "Tú ves salarios, documentos y reportes del equipo, así que tu cuenta lleva un segundo candado. Se configura una sola vez."}
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
              <img src={estado.qr} alt="Código QR para la app autenticadora" width={200} height={200} className="self-center rounded-xl bg-white p-2" />
              <span className="text-xs text-muted-foreground">
                ¿No puedes escanear? Escribe esta clave en la app: <span className="num break-all text-foreground">{estado.clave}</span>
              </span>
            </li>
            <li>
              <b>3.</b> Escribe aquí el código de 6 números que te sale:
            </li>
          </ol>
        ) : null}
        <FormCodigo />
        <p className="mt-5 text-center text-xs text-muted-foreground">Este dispositivo queda recordado 30 días. ¿Perdiste el teléfono? Avísale a Elvin o a Nico para reiniciarla.</p>
        <form action={salirDeRitmoAction} className="mt-3 text-center">
          <button type="submit" className="text-xs text-muted-foreground underline-offset-4 hover:underline">Salir</button>
        </form>
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import { RegistrarApp, type ConfigApp } from "@/components/app-movil";
import { NavCliente } from "@/components/cliente/nav";
import { AceptarLegalCliente } from "@/components/cliente/aceptar-legal";
import { EnlacesLegales } from "@/components/legal/documento";
import { aceptoVersion } from "@/lib/legal/consentimiento";
import { LEGAL } from "@/lib/legal/versiones";
import { COOKIE_CLIENTE, linkCliente, verificarCookieCliente } from "@/lib/clientes-app/acceso";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { CLIENTE_APP } from "@/lib/clientes-app/config";
import { visorActual } from "@/lib/clientes-app/sesion";

export const dynamic = "force-dynamic";

// La app de Level Up para el cliente (en el teléfono, sin App Store). Todo lo que se muestra sale de SU ficha.
export default async function AppClienteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const v = await visorActual();
  // Tenía sesión pero su link se cambió o se desactivó: al candado con el aviso de "link vencido".
  if (!v) redirect((await verificarCookieCliente((await cookies()).get(COOKIE_CLIENTE)?.value)) ? "/cliente/acceso?link=vencido" : "/cliente/acceso");
  const f = await fichaCliente(v.itemId);
  if (!f) redirect("/cliente/acceso");
  if (f.etapa === "baja" && v.modo === "cliente")
    return (
      <main className="mx-auto flex min-h-svh max-w-sm flex-col items-center justify-center gap-4 px-6 text-center">
        <Image src="/marcas/level-up-icon-dark.png" alt="Level Up Media" width={72} height={62} />
        <h1 className="lu-titulo text-xl font-semibold">Tu cuenta no está activa</h1>
        <p className="text-sm text-muted-foreground">Si quieres volver a trabajar con nosotros, escríbenos y te ayudamos a retomar.</p>
      </main>
    );
  // Términos y privacidad (24/oct/2026): la primera vez, o si sube la versión, el cliente los acepta con dos casillas.
  // Si la tabla del registro no está (migración 0045 sin aplicar), aceptoVersion da null y NO se bloquea la app.
  if (v.modo === "cliente") {
    const persona = `cliente:${v.itemId}`;
    const [t, p] = await Promise.all([aceptoVersion(persona, "terminos_app", LEGAL.terminos.version), aceptoVersion(persona, "privacidad_app", LEGAL.privacidad.version)]);
    if (t === false || p === false) return <AceptarLegalCliente negocio={f.negocio} />;
  }
  const cfg: ConfigApp = { ...CLIENTE_APP, link: v.modo === "cliente" ? await linkCliente(v.itemId, v.version) : null };
  return (
    <>
      {v.modo === "cliente" ? <RegistrarApp cfg={cfg} /> : null}
      {v.modo === "equipo" ? (
        <div className="bg-primary px-4 py-1.5 text-center text-xs font-semibold text-primary-foreground" style={{ paddingTop: "calc(env(safe-area-inset-top) + 6px)" }}>
          Vista previa del equipo · así ve {f.negocio} su app
        </div>
      ) : null}
      <NavCliente negocio={f.negocio} />
      <main className="mx-auto w-full max-w-3xl px-4 pt-5 pb-32 md:pb-16">
        {children}
        <EnlacesLegales que={["terminos", "privacidad", "cookies"]} className="mt-14" />
      </main>
    </>
  );
}

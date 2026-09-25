import { redirect } from "next/navigation";

import { FormBienvenida } from "@/components/ritmo/bienvenida";
import { RitmoLogo } from "@/components/ritmo/logo";
import { contarArchivos, fichaPendiente, leerFicha } from "@/lib/desempeno/fichas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bienvenida" };

// Primer paso de todo empleado nuevo (después de firmar contrato): completar su ficha. Hasta que la
// termine, el layout de Ritmo lo trae aquí.
export default async function BienvenidaPage() {
  const u = await usuarioRitmo();
  if (!u) redirect("/ritmo/entrar");
  const ficha = await leerFicha(u.id);
  if (!fichaPendiente(ficha)) redirect("/ritmo");
  const [ids, contratos] = await Promise.all([contarArchivos(u.id, "identificacion"), contarArchivos(u.id, "contrato")]);
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <RitmoLogo size={52} />
        <h1 className="text-2xl font-semibold tracking-tight">
          ¡Te damos la bienvenida, <span className="texto-ritmo">{u.nombre.split(" ")[0]}</span>!
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">Antes de empezar, completa tu ficha. Toma 3 minutos y solo la ven tú y Recursos Humanos.</p>
      </div>
      <FormBienvenida userId={u.id} tieneFoto={!!ficha!.fotoPath} ids={ids} contratos={contratos} />
    </div>
  );
}

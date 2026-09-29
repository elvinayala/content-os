import { redirect } from "next/navigation";

import { FormBienvenida } from "@/components/ritmo/bienvenida";
import { RitmoLogo } from "@/components/ritmo/logo";
import { faltantesFicha, listaHumana } from "@/lib/desempeno/ficha-completa";
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
  if (!ficha) redirect("/ritmo");
  const [ids, contratos] = await Promise.all([contarArchivos(u.id, "identificacion"), contarArchivos(u.id, "contrato")]);
  // Nuevo (sin teléfono) o con la ficha a medias: aquí completa lo que falta (Elvin, 28/sep).
  const nuevo = fichaPendiente(ficha);
  const faltan = faltantesFicha(ficha, { identificacion: ids, contrato: contratos });
  if (!nuevo && !faltan.length) redirect("/ritmo");
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <RitmoLogo size={52} />
        <h1 className="text-2xl font-semibold tracking-tight">
          {nuevo ? "¡Te damos la bienvenida, " : "Completemos tu ficha, "}
          <span className="texto-ritmo">{u.nombre.split(" ")[0]}</span>
          {nuevo ? "!" : ""}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {nuevo ? "Antes de empezar, completa tu ficha." : `Te falta: ${listaHumana(faltan)}.`} Toma 3 minutos y solo la ven tú y Recursos Humanos.
        </p>
      </div>
      <FormBienvenida
        userId={u.id}
        tieneFoto={!!ficha.fotoPath}
        ids={ids}
        contratos={contratos}
        inicial={{ telefono: ficha.telefono ?? "", telefonoAlterno: ficha.telefonoAlterno ?? "", ciudad: ficha.ciudad ?? "", pais: ficha.pais ?? "", documentoTipo: ficha.documentoTipo ?? "", documentoNumero: ficha.documentoNumero ?? "", contactoEmergencia: ficha.contactoEmergencia ?? "" }}
      />
    </div>
  );
}

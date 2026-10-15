import { redirect } from "next/navigation";

import { Cuentas } from "@/components/ritmo/cuentas";
import { accesoCuentas, cuentasEncendidas, cumplimientoEstrategas, listarCasos } from "@/lib/desempeno/optimizaciones";
import { cumplimiento } from "@/lib/desempeno/optimizaciones-reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cuentas" };

// Cuentas por optimizar (15/oct, Elvin): lo que pidió la revisión de Max por cliente. El estratega marca cada punto
// (ejecutado, o por qué no); la dirección de tráfico (María del Carmen, Juan Diego, Carilin) ve todo, cierra la cuenta
// cuando ya está bien y le pide más optimización. En vista previa solo lo ve Elvin.
export default async function CuentasPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  const rol = await accesoCuentas(u);
  if (!rol) redirect("/ritmo");
  const vistaPrevia = !cuentasEncendidas();
  const casos = await listarCasos({ estrategaId: rol === "estratega" ? u.id : undefined, conSimulacion: vistaPrevia });
  const resumen = rol !== "direccion" ? [] : vistaPrevia ? cumplimiento(casos.map((c) => ({ ...c, simulacion: false }))) : await cumplimientoEstrategas(30);
  return <Cuentas casos={casos} rol={rol} yo={u.id} vistaPrevia={vistaPrevia} resumen={resumen} />;
}

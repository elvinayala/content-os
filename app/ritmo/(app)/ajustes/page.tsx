import { redirect } from "next/navigation";

import { Ajustes } from "@/components/ritmo/ajustes";
import { CambiosPendientes } from "@/components/ritmo/cambios-pendientes";
import { DosPasosAdmin } from "@/components/ritmo/dos-pasos-admin";
import { estaBloqueado } from "@/lib/desempeno/acceso";
import { describirCambios, listarCambios } from "@/lib/desempeno/cambios";
import { actorRitmo, columnasProduccion, leerMetas, leerPerfiles } from "@/lib/desempeno/datos";
import { desempenoDosPasos } from "@/lib/desempeno/schema";
import { esMaestro, PUESTOS } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { db } from "@/lib/pulse/db";
import { listarUsuarios } from "@/lib/pulse/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes" };

// Vista maestra: perfiles (puesto, líder, horario), metas y tablero Producción. Elvin además ve la
// verificación en dos pasos de la vista maestra y puede reiniciarla.
export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const u = await usuarioRitmo();
  if (!u?.maestro) redirect("/ritmo");
  const [usuarios, perfiles, metas, prod, pendientes] = await Promise.all([listarUsuarios(), leerPerfiles(false), leerMetas(), columnasProduccion(), listarCambios("pendiente").catch(() => [])]);
  const lineas = await describirCambios(pendientes).catch(() => ({}) as Record<string, string[]>);
  const cambios = pendientes.map((c) => ({
    id: c.id,
    persona: c.persona,
    propuso: c.propuso,
    lineas: lineas[c.id] ?? [],
    cuando: c.createdAt.toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
  }));
  let dosPasos: { id: string; nombre: string; activada: boolean }[] | null = null;
  if (u.rol === "admin") {
    const d = await db();
    const filas = await d.select({ userId: desempenoDosPasos.userId, activadoAt: desempenoDosPasos.activadoAt }).from(desempenoDosPasos);
    dosPasos = usuarios
      .filter((x) => x.activo && esMaestro(actorRitmo(x)))
      .map((x) => ({ id: x.id, nombre: x.nombre, activada: !!filas.find((f) => f.userId === x.id)?.activadoAt }));
  }
  return (
    <div className="flex flex-col gap-6">
      <Ajustes
        arriba={<CambiosPendientes cambios={cambios} decide={u.rol === "admin"} />}
        usuarios={usuarios.filter((x) => x.activo && !x.email.endsWith("@pulse.sistema") && !estaBloqueado(x.email)).map((x) => ({ id: x.id, nombre: x.nombre, email: x.email }))}
        perfiles={perfiles}
        metas={metas}
        produccion={!!prod}
        buscar={q ?? ""}
        gestorPulse={u.maestro}
        puestos={PUESTOS.map((p) => ({ id: p.id, nombre: p.nombre, departamento: p.departamento, nuevo: p.id.startsWith("p_") }))}
      />
      {dosPasos ? <DosPasosAdmin gente={dosPasos} /> : null}
    </div>
  );
}

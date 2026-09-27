import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { MiViajeDelAnio, NuevoPlan, TarjetaPlan, ViajeDireccion } from "@/components/ritmo/viajes";
import { fichaCompleta } from "@/lib/desempeno/fichas";
import { diasYHoras } from "@/lib/desempeno/rrhh";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { elegibilidadAnio, misPlanes, programaDelAnio } from "@/lib/desempeno/viajes";
import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Viajes" };

// Viajes: planifica tus vacaciones (y pídelas en un toque) + el viaje del año que la empresa regala por mérito.
export default async function ViajesPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  // Oculto al equipo por ahora (Elvin, 27/sep): solo lo ve él mientras lo decide.
  if (!u.maestro || u.rol !== "admin") redirect("/ritmo");
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
  const anio = Number(hoy.slice(0, 4));
  const direccion = u.maestro && (u.rol === "admin" || u.rol === "editor");
  const [planes, ficha, programa] = await Promise.all([misPlanes(u.id), fichaCompleta(u.id).catch(() => null), programaDelAnio(anio)]);
  const anuncio = programa?.anuncio ?? `${anio}-12-15`;
  // El empleado solo recibe su propia fila (armarPanel respeta permisos); la dirección, la de todos.
  const eleg = programa || direccion ? await elegibilidadAnio(u, anio, anuncio).catch(() => []) : [];
  const mia = eleg.find((x) => x.userId === u.id)?.e ?? null;
  let ganador: string | null = null;
  if (programa?.ganadorId) {
    const d = await db();
    const [g] = await d.select({ nombre: pulseUsers.nombre }).from(pulseUsers).where(eq(pulseUsers.id, programa.ganadorId));
    ganador = g?.nombre ?? null;
  }
  const s = ficha?.saldos;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <p className="ceja">Viajes</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Tus próximas vacaciones</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Planifica a dónde quieres ir —cerca, dentro de tu país o afuera— y cuando tengas las fechas, pídelas en un toque.
          {s ? (
            <>
              {" "}Tienes <b className="text-foreground">{diasYHoras(s.vacaciones.disponibles, s.horasDia)}</b> de vacaciones
              {s.puedeSolicitar ? "." : `; se piden a partir del ${new Date(`${s.fechaDoceMeses}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric" })}.`}
            </>
          ) : null}
        </p>
      </div>

      {programa ? <MiViajeDelAnio anio={anio} premio={programa.premio} anuncio={programa.anuncio} ganador={ganador} e={mia} /> : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Mis viajes</h2>
        {planes.map((p) => (
          <TarjetaPlan key={p.id} hoy={hoy} puedePedir={!!s?.puedeSolicitar} p={{ id: p.id, tipo: p.tipo, destino: p.destino, desde: p.desde, hasta: p.hasta, presupuestoUsd: p.presupuestoUsd, notas: p.notas, pedida: !!p.solicitudId }} />
        ))}
        <NuevoPlan />
      </section>

      {direccion ? <ViajeDireccion anio={anio} programa={programa ? { premio: programa.premio, topeUsd: programa.topeUsd, anuncio: programa.anuncio, nota: programa.nota } : null} ganadorId={programa?.ganadorId ?? null} candidatos={eleg.map((x) => ({ userId: x.userId, nombre: x.nombre, puesto: x.puesto, e: x.e }))} /> : null}
    </div>
  );
}

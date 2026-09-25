import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { NuevaSolicitud, TarjetaSolicitud, type SolicitudUI } from "@/components/ritmo/solicitudes";
import { fichaCompleta } from "@/lib/desempeno/fichas";
import { puedeDecidir, TIPOS_SOLICITUD } from "@/lib/desempeno/rrhh";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { solicitudesPara } from "@/lib/desempeno/solicitudes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Solicitudes" };

// Pedir algo a RR.HH. (día libre, vacaciones, permiso, carta u otra petición) → supervisor aprueba → RR.HH. firma.
export default async function SolicitudesPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  const [todas, ficha] = await Promise.all([solicitudesPara(u), fichaCompleta(u.id).catch(() => null)]);
  const s = ficha?.saldos;
  const saldo = s ? `Tienes ${s.vacaciones.disponibles} días de vacaciones acumulados${s.puedeSolicitar ? "" : ` (las vacaciones se piden a partir del ${new Date(`${s.fechaDoceMeses}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric" })}; un día libre antes de eso se descuenta de lo acumulado o va sin paga)`}.` : null;
  const ui = (x: (typeof todas)[number]): SolicitudUI => ({
    id: x.id,
    nombre: x.nombre,
    tipo: x.tipo,
    desde: x.desde,
    hasta: x.hasta,
    dias: x.dias,
    detalle: x.detalle,
    estado: x.estado,
    supervisorNombre: x.supervisorNombre,
    supervisorAt: x.supervisorAt?.toISOString() ?? null,
    supervisorNota: x.supervisorNota,
    rrhhNombre: x.rrhhNombre,
    rrhhAt: x.rrhhAt?.toISOString() ?? null,
    rrhhNota: x.rrhhNota,
    createdAt: x.createdAt.toISOString(),
    mia: x.userId === u.id,
    meToca: puedeDecidir(x, u),
    quienDecide: x.estado === "supervisor" ? "tu supervisor" : "RR.HH.",
  });
  const porDecidir = todas.filter((x) => puedeDecidir(x, u)).map(ui);
  const mias = todas.filter((x) => x.userId === u.id).map(ui);
  const resto = u.maestro ? todas.filter((x) => x.userId !== u.id && !puedeDecidir(x, u)).map(ui) : todas.filter((x) => x.userId !== u.id && !puedeDecidir(x, u)).map(ui);
  const tipos = TIPOS_SOLICITUD.map((t) => ({ id: t.id, nombre: t.nombre, conFechas: t.conFechas }));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Solicitudes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Días libres, vacaciones, permisos, cartas o cualquier petición a Recursos Humanos.</p>
      </div>

      {porDecidir.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[color:var(--coral)]">Te toca decidir ({porDecidir.length})</h2>
          {porDecidir.map((x) => (
            <TarjetaSolicitud key={x.id} s={x} tipos={tipos} />
          ))}
        </section>
      ) : null}

      <NuevaSolicitud tipos={tipos} saldo={saldo} />

      {mias.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Mis solicitudes</h2>
          {mias.map((x) => (
            <TarjetaSolicitud key={x.id} s={x} tipos={tipos} />
          ))}
        </section>
      ) : null}

      {resto.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">{u.maestro ? "Todas las del equipo" : "De tu equipo"}</h2>
          {resto.slice(0, 50).map((x) => (
            <TarjetaSolicitud key={x.id} s={x} tipos={tipos} />
          ))}
        </section>
      ) : null}

      <Link href="/ritmo/etica" className="panel flex items-center gap-3 p-4 text-sm transition hover:border-[color:var(--coral)]/40">
        <ShieldCheck className="size-5 shrink-0 text-[color:var(--coral)]" />
        <span>
          <b>¿Viste algo antiético?</b> <span className="text-muted-foreground">Usa el canal ético: privado, puede ser anónimo y solo lo lee Elvin.</span>
        </span>
      </Link>
    </div>
  );
}

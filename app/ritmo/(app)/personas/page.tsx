import { CalendarHeart, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AvatarRitmo } from "@/components/ritmo/avatar";
import { CrearFicha } from "@/components/ritmo/crear-ficha";
import { NuevoEmpleado } from "@/components/ritmo/nuevo-empleado";
import { EmpresaBadge, FiltroEmpresa } from "@/components/ritmo/piezas";
import { fichaPendiente, resumenPersonas } from "@/lib/desempeno/fichas";
import { PUESTOS, puestoPorId } from "@/lib/desempeno/reglas";
import { listarUsuarios } from "@/lib/pulse/repo";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Personas" };

// Fichas de RR.HH.: solo operaciones con sueldo fijo. Las ve la vista maestra (Elvin, Carilin, Aure, Yaileen).
export default async function PersonasPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e: empresa } = await searchParams;
  const u = await usuarioRitmo();
  if (!u) return null;
  if (!u.maestro) redirect(`/ritmo/personas/${u.id}`);
  const [todos, usuarios] = await Promise.all([resumenPersonas(), listarUsuarios()]);
  const gente = todos.filter((g) => !empresa || g.perfil.empresa === empresa);
  const con = gente.filter((g) => g.ficha);
  const sin = gente.filter((g) => !g.ficha && g.perfil.activo);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Recursos Humanos</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Personas</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">La ficha de cada empleado de operaciones con sueldo fijo: contacto, documentos, entrenamientos, vacaciones y nómina.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <NuevoEmpleado puestos={PUESTOS.map((p) => ({ id: p.id, nombre: p.nombre }))} supervisores={usuarios.filter((x) => x.activo && !x.email.endsWith("@pulse.sistema")).map((x) => ({ id: x.id, nombre: x.nombre }))} />
          <FiltroEmpresa actual={empresa} href={(e) => (e ? `/ritmo/personas?e=${e}` : "/ritmo/personas")} />
        </div>
      </div>

      {con.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {con.map(({ perfil, ficha, saldos }) => (
            <Link key={perfil.userId} href={`/ritmo/personas/${perfil.userId}`} className="panel group flex flex-col gap-3 p-4 transition hover:border-primary/40">
              <div className="flex items-center gap-3">
                <AvatarRitmo userId={perfil.userId} nombre={perfil.nombre} foto={ficha!.fotoPath} size={52} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{perfil.nombre}</p>
                  <EmpresaBadge empresa={perfil.empresa} />
                  <p className="truncate text-xs text-muted-foreground">{puestoPorId(perfil.puesto)?.nombre ?? perfil.puesto}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{[ficha!.ciudad, ficha!.pais].filter(Boolean).join(", ") || "Sin ubicación"}</span>
                <span className="flex items-center gap-1.5"><Phone className="size-3.5" />{ficha!.telefono || "Sin teléfono"} · {perfil.email}</span>
              </div>
              {fichaPendiente(ficha) ? (
                <span className="self-start rounded-full bg-sky-400/10 px-2.5 py-1 text-xs text-sky-300">Nuevo · falta que complete su ficha</span>
              ) : saldos?.puedeSolicitar && saldos.vacaciones.disponibles >= 1 ? (
                <span className="flex items-center gap-1.5 self-start rounded-full bg-[color:var(--coral)]/15 px-2.5 py-1 text-xs text-[color:var(--coral)]">
                  <CalendarHeart className="size-3.5" /> Puede pedir vacaciones · {saldos.vacaciones.disponibles} días
                </span>
              ) : !perfil.fechaIngreso || !ficha!.salarioMensual ? (
                <span className="self-start rounded-full bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300">Ficha incompleta</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Todavía no hay fichas. Créalas abajo para cada empleado de operaciones con sueldo fijo.</p>
      )}

      {sin.length ? (
        <section className="panel p-4">
          <h2 className="text-sm font-semibold">Sin ficha</h2>
          <p className="mb-3 text-xs text-muted-foreground">Tienen perfil de ponche pero no ficha. Crea la ficha solo si es de operaciones y cobra sueldo fijo.</p>
          <ul className="divide-y divide-border">
            {sin.map(({ perfil }) => (
              <li key={perfil.userId} className="flex items-center gap-3 py-2">
                <AvatarRitmo userId={perfil.userId} nombre={perfil.nombre} foto={null} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm">{perfil.nombre} <span className="text-muted-foreground">· {puestoPorId(perfil.puesto)?.nombre}</span></span>
                <CrearFicha userId={perfil.userId} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

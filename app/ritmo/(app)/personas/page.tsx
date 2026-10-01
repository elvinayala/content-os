import { CalendarHeart, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { diasYHoras } from "@/lib/desempeno/rrhh";

import { AvatarRitmo } from "@/components/ritmo/avatar";
import { CrearFicha } from "@/components/ritmo/crear-ficha";
import { NuevoEmpleado } from "@/components/ritmo/nuevo-empleado";
import { EmpresaBadge, FiltroEmpresa } from "@/components/ritmo/piezas";
import { estaBloqueado } from "@/lib/desempeno/acceso";
import { conteoDocumentos, fichaPendiente, resumenPersonas } from "@/lib/desempeno/fichas";
import { faltantesFicha } from "@/lib/desempeno/ficha-completa";
import { TarjetaLista, type PersonaLista } from "@/components/ritmo/tarjeta-lista";
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
  const [todos, usuarios, docs] = await Promise.all([resumenPersonas(), listarUsuarios(), conteoDocumentos().catch(() => new Map<string, { identificacion: number; contrato: number }>())]);
  const gente = todos.filter((g) => !empresa || g.perfil.empresa === empresa);
  const con = gente.filter((g) => g.ficha);
  const sin = gente.filter((g) => !g.ficha && g.perfil.activo);
  // Resumen que se abre (30/sep, Elvin: "que le dé clic y me diga cuáles son").
  const activos = gente.filter((g) => g.perfil.activo);
  const fila = (g: (typeof gente)[number], extra?: Partial<PersonaLista>): PersonaLista => ({ id: g.perfil.userId, nombre: g.perfil.nombre, href: `/ritmo/personas/${g.perfil.userId}`, ...extra });
  const conFaltas = activos.filter((g) => g.ficha).map((g) => ({ g, falta: faltantesFicha(g.ficha, docs.get(g.perfil.userId) ?? { identificacion: 0, contrato: 0 }) }));
  const completas = conFaltas.filter((x) => !x.falta.length);
  const incompletas = conFaltas.filter((x) => x.falta.length);
  const vacaciones = activos.filter((g) => g.saldos?.puedeSolicitar && g.saldos.vacaciones.disponibles >= 1);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="ceja">Recursos Humanos</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Personas</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">La ficha de cada empleado de operaciones con sueldo fijo: contacto, documentos, entrenamientos, vacaciones y nómina.</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <NuevoEmpleado puestos={PUESTOS.map((p) => ({ id: p.id, nombre: p.nombre }))} supervisores={usuarios.filter((x) => x.activo && !x.email.endsWith("@pulse.sistema") && !estaBloqueado(x.email)).map((x) => ({ id: x.id, nombre: x.nombre }))} />
          <FiltroEmpresa actual={empresa} href={(e) => (e ? `/ritmo/personas?e=${e}` : "/ritmo/personas")} />
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <TarjetaLista titulo="Fichas completas" valor={`${completas.length}/${activos.length}`} detalle="Con todos sus datos y documentos" grupos={[{ gente: completas.map((x) => fila(x.g)) }]} vacio="Nadie tiene la ficha completa todavía." />
        <TarjetaLista titulo="Les falta algo" valor={incompletas.length} detalle="Datos o documentos pendientes" tono={incompletas.length ? "ambar" : undefined} grupos={[{ gente: incompletas.map((x) => fila(x.g, { nota: `${x.falta.length}`, detalle: `Falta: ${x.falta.join(", ")}` })) }]} vacio="Todos tienen la ficha completa. 👌" />
        <TarjetaLista titulo="Sin ficha" valor={sin.length} detalle="Activos sin ficha creada" tono={sin.length ? "rojo" : undefined} grupos={[{ gente: sin.map((g) => fila(g, { href: "/ritmo/personas#sin-ficha" })) }]} vacio="Todos tienen ficha." />
        <TarjetaLista titulo="Vacaciones" valor={vacaciones.length} detalle="Ya pueden pedirlas" grupos={[{ gente: vacaciones.map((g) => fila(g, { nota: `${g.saldos!.vacaciones.disponibles} días` })) }]} vacio="Nadie cumple todavía los 12 meses." />
      </section>

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
                  <CalendarHeart className="size-3.5" /> Puede pedir vacaciones · {diasYHoras(saldos.vacaciones.disponibles, saldos.horasDia)}
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
        <section id="sin-ficha" className="panel scroll-mt-20 p-4">
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

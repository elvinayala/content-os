import { BadgeDollarSign, Briefcase, Handshake, Rocket } from "lucide-react";

import { GestionCasos, MisCasos, NuevaVacante, TarjetaVacante, type PostulacionUI, type VacanteUI } from "@/components/ritmo/carreras";
import { listarVacantes, misPostulaciones, todasLasPostulaciones } from "@/lib/desempeno/carreras";
import { BONO_REFERIDO, esNueva } from "@/lib/desempeno/carreras-reglas";
import { EMPRESAS } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Carreras" };

// Vacantes internas: cuando surge una oportunidad, RR.HH. la publica aquí. El equipo aplica para crecer
// o cambiar de puesto, o refiere a alguien (bono si se contrata y completa el onboarding).
export default async function CarrerasPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  const [vacantes, mias, todas] = await Promise.all([listarVacantes(u.maestro), misPostulaciones(u.id), u.maestro ? todasLasPostulaciones() : Promise.resolve(null)]);

  const caso = (x: Awaited<ReturnType<typeof misPostulaciones>>[number] & { persona?: string }): PostulacionUI => ({
    id: x.id,
    vacante: x.vacante,
    tipo: x.tipo,
    persona: x.persona,
    candidatoNombre: x.candidatoNombre,
    candidatoEmail: u.maestro ? x.candidatoEmail : null,
    candidatoTelefono: u.maestro ? x.candidatoTelefono : null,
    relacion: x.relacion,
    motivo: x.motivo,
    enlace: x.enlace,
    estado: x.estado,
    notaRrhh: u.maestro ? x.notaRrhh : null,
    bono: x.bono,
    bonoMes: x.bonoMes,
    bonoPagado: !!x.bonoAjusteId,
    createdAt: x.createdAt.toISOString(),
  });
  const vui = (v: (typeof vacantes)[number]): VacanteUI => ({
    id: v.id,
    titulo: v.titulo,
    empresa: v.empresa,
    departamento: v.departamento,
    modalidad: v.modalidad,
    ubicacion: v.ubicacion,
    descripcion: v.descripcion,
    requisitos: v.requisitos,
    salario: v.salario,
    bonoReferido: v.bonoReferido,
    estado: v.estado,
    createdAt: v.createdAt.toISOString(),
    nueva: esNueva(v.createdAt),
    yaAplico: mias.some((m) => m.vacanteId === v.id && m.tipo === "interna" && m.estado !== "retirada"),
    internas: todas?.filter((t) => t.vacanteId === v.id && t.tipo === "interna").length,
    referidos: todas?.filter((t) => t.vacanteId === v.id && t.tipo === "referido").length,
  });
  const abiertas = vacantes.filter((v) => v.estado === "abierta");
  const otras = vacantes.filter((v) => v.estado !== "abierta");
  const pendientes = todas?.filter((t) => !["contratado", "onboarding_completo", "descartada", "retirada"].includes(t.estado)).length ?? 0;
  const bonoMax = Math.max(BONO_REFERIDO, ...abiertas.map((v) => v.bonoReferido));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ceja">Oportunidades</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Carreras</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Cuando surge una oportunidad, la publicamos aquí primero. Aplica para crecer o cambiar de puesto, o refiere a alguien que conozcas.</p>
        </div>
        {u.maestro ? <NuevaVacante empresas={EMPRESAS.map((e) => ({ id: e.id, nombre: e.nombre }))} /> : null}
      </div>

      <section className="panel hud-esquinas grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-[color:var(--coral)]/12 text-[color:var(--coral)] ring-1 ring-[color:var(--coral)]/30">
          <BadgeDollarSign className="size-7" />
        </div>
        <div>
          <p className="font-semibold">
            Refiere y gana <span className="texto-ritmo num">US${bonoMax}</span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Si la persona que refieres se contrata y completa su onboarding, te damos el bono en tu próxima nómina. Tú también puedes aplicar: crecer adentro es parte del plan.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1"><Handshake className="size-3.5" /> 1 · Refieres</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1"><Rocket className="size-3.5" /> 2 · Se contrata</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1"><BadgeDollarSign className="size-3.5" /> 3 · Completa onboarding = bono</span>
          </div>
        </div>
      </section>

      {u.maestro && todas?.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[color:var(--coral)]">Aplicaciones y referidos {pendientes ? `(${pendientes} por mover)` : ""}</h2>
          <GestionCasos casos={todas.map(caso)} />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Vacantes abiertas {abiertas.length ? `(${abiertas.length})` : ""}</h2>
        {abiertas.length ? (
          abiertas.map((v) => <TarjetaVacante key={v.id} v={vui(v)} maestro={u.maestro} />)
        ) : (
          <div className="panel flex flex-col items-center gap-2 p-10 text-center">
            <Briefcase className="size-8 text-muted-foreground" />
            <p className="font-medium">No hay vacantes abiertas en este momento</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {u.maestro ? "Publica una con “Publicar vacante”: le aparece al instante a todo el equipo." : "Cuando surja una oportunidad aparece aquí primero. Vuelve pronto."}
            </p>
          </div>
        )}
      </section>

      {!u.maestro && mias.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Mis aplicaciones y referidos</h2>
          <MisCasos casos={mias.map(caso)} />
        </section>
      ) : null}

      {u.maestro && otras.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Pausadas y cerradas</h2>
          {otras.map((v) => (
            <TarjetaVacante key={v.id} v={vui(v)} maestro />
          ))}
        </section>
      ) : null}
    </div>
  );
}

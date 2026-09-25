import { ArrowLeft, CalendarHeart, Mail, MapPin, Phone, PhoneForwarded, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AvatarRitmo } from "@/components/ritmo/avatar";
import { Ajustes, Ausencias, Documentos, FormDatos } from "@/components/ritmo/ficha";
import { BotonSubir } from "@/components/ritmo/subir";
import { cargosAusencias, usd } from "@/lib/desempeno/rrhh";
import { CATEGORIAS, fichaCompleta } from "@/lib/desempeno/fichas";
import { puestoPorId } from "@/lib/desempeno/reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ficha" };

const CONTRATO: Record<string, string> = { contratista: "Contratista", nomina: "Nómina", eor: "EOR" };
const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-PR", { day: "numeric", month: "long", year: "numeric" });
const mesLargo = (m: string) => new Date(`${m}-15T12:00:00`).toLocaleDateString("es-PR", { month: "long", year: "numeric" });

function Seccion({ titulo, extra, children }: { titulo: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  const { id } = await params;
  if (!u.maestro && u.id !== id) notFound();
  const f = await fichaCompleta(id);
  if (!f) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center text-sm text-muted-foreground">
        {u.id === id ? "Todavía no tienes ficha. RR.HH. la crea para los empleados de operaciones con sueldo fijo." : "Esta persona no tiene ficha todavía."}
      </div>
    );
  }
  const { perfil, ficha, saldos, nomina } = f;
  const s = saldos;
  const cargos = perfil.fechaIngreso ? cargosAusencias(perfil.fechaIngreso, f.ausencias.map((a) => ({ id: a.id, tipo: a.tipo as never, desde: a.desde, hasta: a.hasta, dias: a.dias, certificado: a.certificado }))) : [];
  const puesto = puestoPorId(perfil.puesto);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {u.maestro ? (
        <Link href="/ritmo/personas" className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Personas
        </Link>
      ) : null}

      <section className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-2">
          <AvatarRitmo userId={perfil.userId} nombre={perfil.nombre} foto={ficha.fotoPath} size={96} />
          <BotonSubir userId={perfil.userId} categoria="foto" texto={ficha.fotoPath ? "Cambiar foto" : "Subir foto"} accept="image/*" className="h-7 text-xs" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{perfil.nombre}</h1>
          <p className="text-sm text-muted-foreground">
            {puesto?.nombre} · {puesto?.departamento} · {CONTRATO[perfil.tipoContrato] ?? perfil.tipoContrato}
          </p>
          <div className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            <span className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{perfil.email}</span>
            <span className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{ficha.telefono || "—"}</span>
            <span className="flex items-center gap-2"><PhoneForwarded className="size-4 text-muted-foreground" />{ficha.telefonoAlterno || "—"}</span>
            <span className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{[ficha.ciudad, ficha.pais].filter(Boolean).join(", ") || "—"}</span>
            <span className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" />{ficha.documentoTipo ? `${ficha.documentoTipo} ${ficha.documentoNumero ?? ""}` : "Documento: —"}</span>
            <span className="flex items-center gap-2"><CalendarHeart className="size-4 text-muted-foreground" />{perfil.fechaIngreso ? `Desde el ${fecha(perfil.fechaIngreso)}` : "Fecha de ingreso: —"}</span>
          </div>
        </div>
      </section>

      {s?.puedeSolicitar && s.vacaciones.disponibles >= 1 ? (
        <div className="rounded-2xl border border-[color:var(--coral)]/40 bg-[color:var(--coral)]/10 px-4 py-3 text-sm">
          <b>{u.id === id ? "Ya puedes solicitar tus vacaciones." : `${perfil.nombre.split(" ")[0]} ya puede solicitar vacaciones.`}</b> Cumplió 12 meses el {fecha(s.fechaDoceMeses)} y tiene{" "}
          <b>{s.vacaciones.disponibles} días</b> ({Math.round(s.vacaciones.disponibles * s.horasDia)} h) acumulados.
        </div>
      ) : null}

      <Seccion titulo="Tiempo libre">
        {s ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Saldo titulo="Vacaciones" valor={s.vacaciones.disponibles} horas={s.horasDia} detalle={`${s.vacaciones.acumuladas} acumulados · ${s.vacaciones.usadas} usados${s.puedeSolicitar ? "" : ` · se solicitan desde el ${fecha(s.fechaDoceMeses)}`}`} />
            <Saldo titulo="Enfermedad (este año)" valor={s.enfermedad.disponibles} horas={s.horasDia} detalle={`de ${s.enfermedad.cupo} · con certificado médico`} />
            <Saldo titulo="Maternidad" valor={s.maternidad} horas={s.horasDia} detalle="por evento" />
          </div>
        ) : (
          <p className="mb-4 text-sm text-amber-300">Falta la fecha de ingreso (en Ajustes → persona) para calcular vacaciones.</p>
        )}
        <Ausencias
          userId={perfil.userId}
          maestro={u.maestro}
          lista={f.ausencias.map((a) => ({ id: a.id, tipo: a.tipo, desde: a.desde, hasta: a.hasta, dias: a.dias, certificado: a.certificado, nota: a.nota, cargo: cargos.find((c) => c.id === a.id)?.cargo ?? null }))}
        />
      </Seccion>

      <Seccion titulo={`Nómina · ${mesLargo(nomina.mes)}`} extra={<span className="num text-xl font-semibold texto-ritmo">{usd(nomina.total)}</span>}>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span>Salario mensual</span><span className="num">{ficha.salarioMensual !== null ? usd(nomina.base) : "—"}</span></div>
          <Ajustes userId={perfil.userId} mes={nomina.mes} maestro={u.maestro} lista={f.ajustes.map((a) => ({ id: a.id, concepto: a.concepto, monto: a.monto }))} />
          {nomina.diasSinPaga ? (
            <div className="flex justify-between text-red-300"><span>{nomina.diasSinPaga} días sin paga</span><span className="num">−{usd(nomina.descuentoSinPaga)}</span></div>
          ) : null}
          <p className="pt-1 text-xs text-muted-foreground">Estimado de lo que debería cobrar el próximo mes, en dólares. RR.HH. confirma el pago final.</p>
        </div>
      </Seccion>

      <Seccion titulo="Documentos y entrenamiento">
        <Documentos
          userId={perfil.userId}
          maestro={u.maestro}
          categorias={CATEGORIAS.map((c) => ({ id: c.id, nombre: c.nombre }))}
          archivos={f.archivos.map((a) => ({ id: a.id, categoria: a.categoria, nombre: a.nombre, mime: a.mime, bytes: a.bytes, createdAt: a.createdAt.toISOString() }))}
        />
      </Seccion>

      {u.maestro ? (
        <Seccion titulo="Datos de RR.HH.">
          <FormDatos d={ficha} />
        </Seccion>
      ) : null}
    </div>
  );
}

function Saldo({ titulo, valor, horas, detalle }: { titulo: string; valor: number; horas: number; detalle: string }) {
  return (
    <div className="rounded-xl border border-border bg-white/[0.02] p-3">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="num mt-1 text-2xl font-semibold">
        {valor} <span className="text-sm font-normal text-muted-foreground">días · {Math.round(valor * horas)} h</span>
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p>
    </div>
  );
}

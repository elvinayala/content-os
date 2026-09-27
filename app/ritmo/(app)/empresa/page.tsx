import Link from "next/link";

import { Directorio, NuevoItemEmpresa, TarjetaEmpresa } from "@/components/ritmo/empresa";
import { contenidoEmpresa, directorio, empresaDe } from "@/lib/desempeno/empresa";
import { SECCIONES, type SeccionEmpresa } from "@/lib/desempeno/empresa-reglas";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Empresa" };

// Lo que un empleado necesita al entrar: quiénes somos, el equipo, recursos, políticas y preguntas.
export default async function EmpresaPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const u = await usuarioRitmo();
  if (!u) return null;
  const { s } = await searchParams;
  const seccion = (SECCIONES.find((x) => x.id === s)?.id ?? "nosotros") as SeccionEmpresa;
  const v = { empresa: await empresaDe(u.id), maestro: u.maestro };
  const [items, personas] = await Promise.all([seccion === "equipo" ? Promise.resolve([]) : contenidoEmpresa(v), seccion === "equipo" ? directorio(v) : Promise.resolve([])]);
  const deSeccion = items.filter((i) => i.seccion === seccion);
  const chip = (activo: boolean) => cn("rounded-full px-3 py-1.5 transition", activo ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="ceja">Bienvenido</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">La empresa</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">Quiénes somos, quién es quién en el equipo, las políticas y dónde encontrar lo que necesitas.</p>
        </div>
        {u.maestro && seccion !== "equipo" ? <NuevoItemEmpresa seccion={seccion} /> : null}
      </div>

      <div className="flex w-fit max-w-full flex-wrap gap-1 rounded-full border border-border bg-card/60 p-1 text-xs">
        {SECCIONES.map((x) => (
          <Link key={x.id} href={x.id === "nosotros" ? "/ritmo/empresa" : `/ritmo/empresa?s=${x.id}`} className={chip(seccion === x.id)}>
            {x.emoji} {x.nombre}
          </Link>
        ))}
      </div>

      {seccion === "equipo" ? (
        <Directorio personas={personas} maestro={u.maestro} yo={u.id} />
      ) : deSeccion.length ? (
        <div className="flex flex-col gap-3">
          {deSeccion.map((it) => (
            <TarjetaEmpresa key={it.id} it={it} maestro={u.maestro} />
          ))}
        </div>
      ) : (
        <div className="panel p-6 text-center text-sm text-muted-foreground">Todavía no hay nada aquí.</div>
      )}
      {u.maestro && seccion !== "equipo" ? (
        <p className="text-[11px] text-muted-foreground">Ves todo porque eres parte de la dirección: los borradores y lo de cada empresa. Cada empleado ve lo publicado para todos y lo de su empresa.</p>
      ) : null}
    </div>
  );
}

import "server-only";

import { notFound, redirect } from "next/navigation";

import { usuarioActual } from "@/lib/pulse/auth";

import { accesoLeads, asegurarSemilla, etapasDe, listarEmbudos, marcasConAcceso, usuariosActivos } from "./repo";
import { MARCAS, slugDeMarca } from "./reglas";

/** Todo lo que necesita cualquier pantalla de Leads de una marca: acceso, embudos, etapas, gente. */
export async function contextoLeads(marcaSlug: string, sp: Record<string, string | string[] | undefined>) {
  const u = await usuarioActual();
  if (!u) redirect("/pulse/login");
  const m = MARCAS[marcaSlug];
  if (!m) notFound();
  const acceso = await accesoLeads(u, m.marca);
  if (!acceso.puede) redirect("/pulse/leads");
  await asegurarSemilla(m.marca);
  const [embudos, usuarios, marcas] = await Promise.all([listarEmbudos(m.marca), usuariosActivos(), marcasConAcceso(u)]);
  const pedido = typeof sp.embudo === "string" ? sp.embudo : undefined;
  const embudo = embudos.find((e) => e.id === pedido) ?? embudos[0];
  const etapas = embudo ? await etapasDe(embudo.id) : [];
  // "Solo mis leads": el filtro de dueño queda fijo en la persona.
  const dueno = acceso.alcance === "mios" ? u.id : typeof sp.dueno === "string" ? sp.dueno : null;
  const q = typeof sp.q === "string" ? sp.q : "";
  return {
    u,
    m,
    alcance: acceso.alcance,
    embudos,
    embudo,
    etapas,
    usuarios,
    marcas: marcas.map((x) => ({ slug: slugDeMarca(x), nombre: MARCAS[slugDeMarca(x)].nombre })),
    dueno,
    q,
    puedeEditar: u.rol === "admin" || u.rol === "editor",
  };
}

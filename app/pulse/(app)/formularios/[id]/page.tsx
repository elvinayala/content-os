import { notFound, redirect } from "next/navigation";

import { EditorFormulario } from "@/components/formularios/editor";
import { formularioPorId, listarFormularios } from "@/lib/formularios/repo";
import { puedeFormularios } from "@/lib/formularios/reglas";
import { usuarioActual } from "@/lib/pulse/auth";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Editar formulario · ${NOMBRE_APP}` };

export default async function EditarFormularioPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioActual();
  if (!u || !puedeFormularios(u, process.env.FORMULARIOS_ACCESO || undefined)) redirect("/pulse");
  const { id } = await params;
  const f = await formularioPorId(id);
  if (!f || f.archivado) notFound();
  const total = (await listarFormularios()).find((x) => x.id === id)?.total ?? 0;
  return (
    <EditorFormulario
      inicial={{ id: f.id, titulo: f.titulo, slug: f.slug, marca: f.marca, apariencia: f.apariencia, config: f.config, accion: f.accion, activo: f.activo, total }}
    />
  );
}

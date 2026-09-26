import { notFound, redirect } from "next/navigation";

import { RespuestasFormulario } from "@/components/formularios/respuestas";
import { formularioPorId, respuestasDe } from "@/lib/formularios/repo";
import { linkPublico, puedeFormularios, texto } from "@/lib/formularios/reglas";
import { usuarioActual } from "@/lib/pulse/auth";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: `Respuestas · ${NOMBRE_APP}` };

export default async function RespuestasPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await usuarioActual();
  if (!u || !puedeFormularios(u, process.env.FORMULARIOS_ACCESO || undefined)) redirect("/pulse");
  const { id } = await params;
  const f = await formularioPorId(id);
  if (!f) notFound();
  const rs = await respuestasDe(id, 500);
  const titulos = new Map(f.config.preguntas.map((p) => [p.id, p.titulo]));
  return (
    <RespuestasFormulario
      formulario={{ id: f.id, titulo: f.titulo, link: linkPublico(f), esAdmin: u.rol === "admin" }}
      respuestas={rs.map((r) => {
        const orden = [...f.config.preguntas.map((p) => p.id), ...r.preguntas.map((p) => p.id).filter((x) => !titulos.has(x))];
        const viejos = new Map(r.preguntas.map((p) => [p.id, p.titulo]));
        return {
          id: r.id,
          fecha: r.createdAt.toISOString(),
          origen: r.origen,
          resultado: r.resultado,
          pares: orden.filter((k) => texto(r.respuestas[k])).map((k) => ({ pregunta: titulos.get(k) ?? viejos.get(k) ?? k, respuesta: texto(r.respuestas[k]) })),
        };
      })}
    />
  );
}

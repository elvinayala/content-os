import { redirect } from "next/navigation";

import { Ajustes } from "@/components/ritmo/ajustes";
import { columnasProduccion, leerMetas, leerPerfiles } from "@/lib/desempeno/datos";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { listarUsuarios } from "@/lib/pulse/repo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes" };

// Solo admin y editoras (Carilin, Aure): perfiles (puesto, líder, horario), metas y tablero Producción.
export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const u = await usuarioRitmo();
  if (!u?.maestro) redirect("/ritmo");
  const [usuarios, perfiles, metas, prod] = await Promise.all([listarUsuarios(), leerPerfiles(false), leerMetas(), columnasProduccion()]);
  return (
    <Ajustes
      usuarios={usuarios.filter((x) => x.activo && !x.email.endsWith("@pulse.sistema")).map((x) => ({ id: x.id, nombre: x.nombre, email: x.email }))}
      perfiles={perfiles}
      metas={metas}
      produccion={!!prod}
      buscar={q ?? ""}
    />
  );
}

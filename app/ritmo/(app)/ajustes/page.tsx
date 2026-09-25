import { redirect } from "next/navigation";

import { Ajustes } from "@/components/ritmo/ajustes";
import { columnasProduccion, leerMetas, leerPerfiles } from "@/lib/desempeno/datos";
import { usuarioActual } from "@/lib/pulse/auth";
import { listarUsuarios } from "@/lib/pulse/repo";
import { puedeGestionarUsuarios } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes" };

// Solo admin y editoras (Carilin, Aure): perfiles (puesto, líder, horario), metas y tablero Producción.
export default async function AjustesPage() {
  const u = await usuarioActual();
  if (!u || !puedeGestionarUsuarios(u.rol)) redirect("/ritmo");
  const [usuarios, perfiles, metas, prod] = await Promise.all([listarUsuarios(), leerPerfiles(false), leerMetas(), columnasProduccion()]);
  return (
    <Ajustes
      usuarios={usuarios.filter((x) => x.activo && !x.email.endsWith("@pulse.sistema")).map((x) => ({ id: x.id, nombre: x.nombre, email: x.email }))}
      perfiles={perfiles}
      metas={metas}
      produccion={!!prod}
    />
  );
}

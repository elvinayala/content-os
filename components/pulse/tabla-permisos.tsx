import { Check, Minus } from "lucide-react";

import { poderes } from "@/lib/pulse/permisos";
import type { RolUsuario } from "@/lib/pulse/types";

const FILAS: { etiqueta: string; leer: (r: RolUsuario) => boolean | string }[] = [
  { etiqueta: "Ver y editar los tableros", leer: (r) => poderes(r).editarDatos },
  { etiqueta: "Agregar personas y darles clave", leer: (r) => poderes(r).agregarUsuarios },
  { etiqueta: "Roles que puede asignar", leer: (r) => poderes(r).rolesQuePuedeAsignar.join(", ") || "—" },
  { etiqueta: "Eliminar elementos de golpe", leer: (r) => (poderes(r).topeBorradoItems === null ? "sin límite" : `hasta ${poderes(r).topeBorradoItems}`) },
  { etiqueta: "Exportar o sacar datos de Pulse", leer: (r) => poderes(r).exportarDatos },
  { etiqueta: "Elegir quién entra a un tablero privado", leer: (r) => poderes(r).administrarAccesoTableros },
  { etiqueta: "Eliminar un tablero completo", leer: (r) => poderes(r).eliminarTablero },
  { etiqueta: "Ver esta actividad de seguridad", leer: (r) => poderes(r).verRegistroSeguridad },
];

const ROLES: RolUsuario[] = ["admin", "editor", "miembro"];

// Quién puede qué, leído de lib/pulse/permisos.ts (la misma fuente que aplica el servidor).
export function TablaPermisos() {
  return (
    <section className="mt-8 flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Qué puede hacer cada rol</h2>
        <p className="text-sm text-muted-foreground">Pulse no tiene exportación de datos: nadie puede bajarse la base. Las descargas de archivos y los borrados grandes quedan registrados abajo.</p>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Poder</th>
              {ROLES.map((r) => (
                <th key={r} className="px-3 py-2 text-center font-medium">
                  {r === "admin" ? "Admin" : r === "editor" ? "Editor" : "Miembro"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {FILAS.map((f) => (
              <tr key={f.etiqueta}>
                <td className="px-3 py-2">{f.etiqueta}</td>
                {ROLES.map((r) => {
                  const v = f.leer(r);
                  return (
                    <td key={r} className="px-3 py-2 text-center">
                      {typeof v === "string" ? (
                        <span className="text-xs text-muted-foreground">{v}</span>
                      ) : v ? (
                        <Check className="mx-auto size-4 text-[#00c875]" />
                      ) : (
                        <Minus className="mx-auto size-4 text-muted-foreground/50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import "server-only";

import { eq } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseUsers } from "../pulse/schema";
import { linkDeAcceso } from "./acceso";
import { evento, guardarPerfil, perfilDe } from "./datos";
import { guardarFicha } from "./fichas";

// Alta de empleado nuevo (al firmar contrato): RR.HH. lo registra (empresa, puesto, supervisor, ingreso,
// salario) y le manda el link de bienvenida; la persona crea su clave y llena su ficha. La empresa la
// pone RR.HH.: al empleado nunca se le pregunta.
export async function altaEmpleado(
  p: { nombre: string; email: string; empresa: string; puesto: string; liderId: string | null; fechaIngreso: string; salarioMensual: number | null },
  actorId: string,
  base: string,
): Promise<{ url: string; vence: string }> {
  const d = await db();
  const email = p.email.trim().toLowerCase();
  let [u] = await d.select().from(pulseUsers).where(eq(pulseUsers.email, email));
  if (u && u.rol !== "miembro") throw new Error("Ese correo es de un admin o editora");
  if (u && (await perfilDe(u.id))) throw new Error("Esa persona ya está en Ritmo: búscala en Ajustes");
  if (!u) [u] = await d.insert(pulseUsers).values({ email, nombre: p.nombre.trim(), rol: "miembro" }).returning();
  else await d.update(pulseUsers).set({ activo: true, nombre: p.nombre.trim() }).where(eq(pulseUsers.id, u.id));
  await guardarPerfil({ userId: u.id, puesto: p.puesto, empresa: p.empresa, liderId: p.liderId, horaEntrada: "09:00", horaSalida: "18:00", diasLaborables: [1, 2, 3, 4, 5], tipoContrato: "contratista", fechaIngreso: p.fechaIngreso, activo: true }, actorId);
  await guardarFicha({ userId: u.id, telefono: null, telefonoAlterno: null, ciudad: null, pais: null, documentoTipo: null, documentoNumero: null, salarioMensual: p.salarioMensual, notas: null, contactoEmergencia: null }, actorId);
  await evento({ userId: u.id, actorId, tipo: "alta_empleado", datos: { empresa: p.empresa, puesto: p.puesto } });
  return linkDeAcceso(u.id, base);
}

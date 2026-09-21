import "server-only";

import { cookies } from "next/headers";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";

import { COOKIE_PORTAL, verificarAccesoPortal } from "./acceso";

// Quién está mirando el portal (para las server actions y las páginas):
//  - "closer": cookie CEO (Elvin, Juan David, el setter) → puede todo.
//  - "cliente": cookie del portal para ESE slug → puede probar, mover leads y pedir cambios.
//  - null: nadie (el proxy ya redirigió, pero las actions lo vuelven a chequear).
export async function quienMira(slug: string): Promise<"closer" | "cliente" | null> {
  const jar = await cookies();
  if (await sesionValida(jar.get(COOKIE_SESION)?.value)) return "closer";
  const acc = await verificarAccesoPortal(jar.get(COOKIE_PORTAL)?.value);
  return acc?.slug === slug ? "cliente" : null;
}

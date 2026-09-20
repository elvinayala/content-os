import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { EmailsSnapshot } from "@/lib/types";

// Lee data/emails.json — el resumen de lo importante de las 3 cuentas de correo
// (elvin@levelupmediapr.net, aiborinquen@gmail.com, info@levelupmediapr.net) que
// arma el /brief-ceo con el MCP de Gmail. Si no existe, devuelve vacío.
const ARCHIVO = path.join(process.cwd(), "data", "emails.json");

const ORDEN = { urgente: 0, cliente: 1, venta: 2, finanzas: 3, operativo: 4, personal: 5, otro: 6 };

export async function leerEmails(): Promise<EmailsSnapshot> {
  try {
    const raw = await fs.readFile(ARCHIVO, "utf-8");
    const snap = JSON.parse(raw) as EmailsSnapshot;
    snap.emails.sort(
      (a, b) =>
        (ORDEN[a.categoria] ?? 9) - (ORDEN[b.categoria] ?? 9) ||
        b.fecha.localeCompare(a.fecha),
    );
    return snap;
  } catch {
    return {
      actualizadoEl: new Date().toISOString(),
      cuentas: [],
      emails: [],
    };
  }
}

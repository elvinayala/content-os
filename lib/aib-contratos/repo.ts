import "server-only";

import crypto from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { db } from "../pulse/db";
import { pulseBoards } from "../pulse/schema";
import { filasDe } from "../pulse/storage";
import type { UsuarioPulse } from "../pulse/types";
import { codigoDe, type DatosCliente, type Oferta } from "./documento";

// Contratos de AI Borinquen (9/oct/2026). Tabla chica en SQL directo, como los puestos de Ritmo: se crea sola la
// primera vez y queda protegida por la papelera universal. Separada de todo lo de Level Up (nunca se mezclan).

export interface ContratoAib {
  id: number; codigo: string; token: string;
  estado: "pendiente" | "firmado" | "anulado";
  oferta: Oferta;
  emitido: { en: string; por: string; porId: string | null; porEmail: string | null; prueba?: boolean }; // prueba = no avisa a nadie
  abierto: { en: string; ip: string } | null;
  firmado: { en: string; ip: string; ua: string; datos: DatosCliente; hashContenido: string; hashPdf: string } | null;
  pdfRuta: string | null;
  anulado: { en: string; por: string } | null;
}

let lista = false;
async function d() {
  const x = await db();
  if (!lista) {
    await x.execute(sql`CREATE TABLE IF NOT EXISTS aib_contratos (
      id serial PRIMARY KEY,
      token text NOT NULL UNIQUE,
      estado text NOT NULL DEFAULT 'pendiente',
      oferta jsonb NOT NULL,
      emitido jsonb NOT NULL,
      abierto jsonb,
      firmado jsonb,
      pdf_ruta text,
      anulado jsonb,
      creado_el timestamptz NOT NULL DEFAULT now()
    )`);
    await x.execute(sql`SELECT pulse_papelera_proteger()`).catch(() => null);
    lista = true;
  }
  return x;
}

type Fila = { id: number; token: string; estado: ContratoAib["estado"]; oferta: Oferta; emitido: ContratoAib["emitido"]; abierto: ContratoAib["abierto"]; firmado: ContratoAib["firmado"]; pdf_ruta: string | null; anulado: ContratoAib["anulado"] };
const aContrato = (f: Fila): ContratoAib => ({ id: f.id, codigo: codigoDe(f.id), token: f.token, estado: f.estado, oferta: f.oferta, emitido: f.emitido, abierto: f.abierto, firmado: f.firmado, pdfRuta: f.pdf_ruta, anulado: f.anulado });

/** Quién puede hacer contratos de AIB: quien ve el tablero AI BORINQUEN en Pulse (Elvin, Aure, Carilin y su equipo). */
export async function puedeContratosAib(u: UsuarioPulse): Promise<boolean> {
  const x = await db();
  const [b] = await x.select({ id: pulseBoards.id }).from(pulseBoards).where(eq(pulseBoards.slug, "ai-borinquen"));
  if (!b) return u.rol === "admin";
  const { puedeVerBoard } = await import("../pulse/repo");
  return puedeVerBoard(u, b.id);
}

export async function crearContrato(oferta: Oferta, u: UsuarioPulse): Promise<ContratoAib> {
  const x = await d();
  const token = crypto.randomBytes(18).toString("base64url");
  const emitido = { en: new Date().toISOString(), por: u.nombre, porId: u.id, porEmail: u.email };
  const r = filasDe<Fila>(await x.execute(sql`INSERT INTO aib_contratos (token, oferta, emitido) VALUES (${token}, ${JSON.stringify(oferta)}::jsonb, ${JSON.stringify(emitido)}::jsonb) RETURNING *`));
  return aContrato(r[0]);
}

export async function listarContratos(): Promise<ContratoAib[]> {
  const x = await d();
  return filasDe<Fila>(await x.execute(sql`SELECT * FROM aib_contratos ORDER BY id DESC LIMIT 300`)).map(aContrato);
}

export async function contratoPorId(id: number): Promise<ContratoAib | null> {
  const x = await d();
  const [f] = filasDe<Fila>(await x.execute(sql`SELECT * FROM aib_contratos WHERE id = ${id}`));
  return f ? aContrato(f) : null;
}

export async function contratoPorToken(token: string): Promise<ContratoAib | null> {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
  const x = await d();
  const [f] = filasDe<Fila>(await x.execute(sql`SELECT * FROM aib_contratos WHERE token = ${token}`));
  return f ? aContrato(f) : null;
}

/** Primera vez que el cliente abre su link (queda en el certificado). */
export async function marcarAbierto(c: ContratoAib, ip: string) {
  if (c.abierto || c.estado !== "pendiente") return;
  const x = await d();
  await x.execute(sql`UPDATE aib_contratos SET abierto = ${JSON.stringify({ en: new Date().toISOString(), ip })}::jsonb WHERE id = ${c.id} AND abierto IS NULL`);
}

/** Guarda la firma solo si sigue pendiente (dos envíos a la vez no firman dos veces). */
export async function guardarFirma(id: number, firmado: NonNullable<ContratoAib["firmado"]>, pdfRuta: string): Promise<boolean> {
  const x = await d();
  const r = filasDe<{ id: number }>(await x.execute(sql`UPDATE aib_contratos SET estado = 'firmado', firmado = ${JSON.stringify(firmado)}::jsonb, pdf_ruta = ${pdfRuta} WHERE id = ${id} AND estado = 'pendiente' RETURNING id`));
  return r.length > 0;
}

export async function anularContrato(id: number, u: UsuarioPulse): Promise<boolean> {
  const x = await d();
  const r = filasDe<{ id: number }>(await x.execute(sql`UPDATE aib_contratos SET estado = 'anulado', anulado = ${JSON.stringify({ en: new Date().toISOString(), por: u.nombre })}::jsonb WHERE id = ${id} AND estado = 'pendiente' RETURNING id`));
  return r.length > 0;
}

export function baseUrl(host: string | null): string {
  const env = process.env.AIB_CONTRATOS_URL || process.env.CONTENT_OS_URL;
  if (env) return env.replace(/\/$/, "");
  // Nunca el host de Leads/Ritmo/app: ahí el proxy manda todo a su app y el link no abriría.
  return host?.startsWith("localhost") ? `http://${host}` : "https://content-os-chi-seven.vercel.app";
}

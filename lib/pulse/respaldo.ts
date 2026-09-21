import "server-only";

import { createClient } from "@supabase/supabase-js";

import { db } from "./db";
import { pulseActivity, pulseBoardMembers, pulseBoards, pulseColumns, pulseFiles, pulseGroups, pulseItems, pulseUsers } from "./schema";

const BUCKET = "pulse";
const CARPETA = "respaldos";
const CONSERVAR = 30;

// Respaldo lógico completo de Pulse en un JSON dentro del bucket privado. Sin claves: los
// password_hash no viajan. Se corre por Vercel Cron (api/cron/pulse-respaldo) una vez al día.
export async function respaldarPulse(): Promise<{ ok: boolean; archivo?: string; bytes?: number; error?: string }> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: "Sin Supabase configurado" };
  try {
    const d = await db();
    const [usuarios, boards, miembros, columns, groups, items, activity, files] = await Promise.all([
      d.select({ id: pulseUsers.id, email: pulseUsers.email, nombre: pulseUsers.nombre, rol: pulseUsers.rol, activo: pulseUsers.activo, color: pulseUsers.color, mondayId: pulseUsers.mondayId }).from(pulseUsers),
      d.select().from(pulseBoards),
      d.select().from(pulseBoardMembers),
      d.select().from(pulseColumns),
      d.select().from(pulseGroups),
      d.select().from(pulseItems),
      d.select().from(pulseActivity),
      d.select().from(pulseFiles),
    ]);
    const cuerpo = JSON.stringify({ generadoEl: new Date().toISOString(), usuarios, boards, miembros, columns, groups, items, activity, files });
    const fecha = new Date().toISOString().slice(0, 10);
    const archivo = `${CARPETA}/${fecha}.json`;
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await sb.storage.from(BUCKET).upload(archivo, Buffer.from(cuerpo), { contentType: "application/json", upsert: true });
    if (error) return { ok: false, error: error.message };
    // Rotación: conservar los últimos CONSERVAR.
    const { data: lista } = await sb.storage.from(BUCKET).list(CARPETA, { limit: 200, sortBy: { column: "name", order: "desc" } });
    const viejos = (lista ?? []).slice(CONSERVAR).map((f) => `${CARPETA}/${f.name}`);
    if (viejos.length) await sb.storage.from(BUCKET).remove(viejos);
    return { ok: true, archivo, bytes: cuerpo.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Google Calendar por plomero. Cada plomero tiene su calendar_id en data/territorios.json
 * y lo comparte con la cuenta de servicio. Sin credenciales → modo simulado (devuelve
 * ventanas libres genéricas) para poder probar el agente sin Google.
 */
import { google, calendar_v3 } from "googleapis";
import { config } from "../config.js";
import { territorios } from "../prompt.js";

let cal: calendar_v3.Calendar | null = null;
function cliente(): calendar_v3.Calendar | null {
  if (!config.tiene.calendario()) return null;
  if (cal) return cal;
  const creds = JSON.parse(config.google.serviceAccountJson);
  const auth = new google.auth.JWT({ email: creds.client_email, key: creds.private_key, scopes: ["https://www.googleapis.com/auth/calendar"] });
  cal = google.calendar({ version: "v3", auth });
  return cal;
}

export function plomeroDeTerritorio(territorioId: string) {
  const t = territorios.territorios.find((x) => x.id === territorioId) as any;
  return t?.plomeros?.[0] as { id: string; nombre: string; calendar_id: string; whatsapp: string } | undefined;
}

/** Ventanas de 2 h con formato "HH:MM-HH:MM" → [inicioISO, finISO] en la zona de PR. */
function ventanaAIso(fechaYmd: string, ventana: string): [string, string] {
  const [a, b] = ventana.split("-");
  // Puerto Rico es UTC-4 todo el año (AST, sin horario de verano).
  return [`${fechaYmd}T${a}:00-04:00`, `${fechaYmd}T${b}:00-04:00`];
}

export async function ventanasLibres(territorioId: string, fechaYmd: string, emergencia = false): Promise<{ ventana: string; inicio: string; fin: string }[]> {
  const ventanas = (territorios as any).ventanas as string[];
  const todas = ventanas.map((v) => { const [inicio, fin] = ventanaAIso(fechaYmd, v); return { ventana: v, inicio, fin }; });
  const ahora = Date.now();
  const futuras = todas.filter((v) => new Date(v.inicio).getTime() > ahora + (emergencia ? 30 : 90) * 60_000);

  const c = cliente();
  const plomero = plomeroDeTerritorio(territorioId);
  if (!c || !plomero || plomero.calendar_id.startsWith("CAMBIAR")) return futuras; // simulado

  const fb = await c.freebusy.query({ requestBody: { timeMin: `${fechaYmd}T00:00:00-04:00`, timeMax: `${fechaYmd}T23:59:59-04:00`, items: [{ id: plomero.calendar_id }] } });
  const ocupado = fb.data.calendars?.[plomero.calendar_id]?.busy ?? [];
  return futuras.filter((v) => !ocupado.some((o) => new Date(o.start!) < new Date(v.fin) && new Date(o.end!) > new Date(v.inicio)));
}

export async function crearEvento(territorioId: string, datos: { titulo: string; descripcion: string; inicio: string; fin: string; direccion: string }): Promise<string | undefined> {
  const c = cliente();
  const plomero = plomeroDeTerritorio(territorioId);
  if (!c || !plomero || plomero.calendar_id.startsWith("CAMBIAR")) return undefined; // simulado
  const ev = await c.events.insert({
    calendarId: plomero.calendar_id,
    requestBody: { summary: datos.titulo, description: datos.descripcion, location: datos.direccion, start: { dateTime: datos.inicio, timeZone: config.zonaHoraria }, end: { dateTime: datos.fin, timeZone: config.zonaHoraria } },
  });
  return ev.data.id ?? undefined;
}

export async function borrarEvento(territorioId: string, eventoId: string) {
  const c = cliente();
  const plomero = plomeroDeTerritorio(territorioId);
  if (!c || !plomero) return;
  await c.events.delete({ calendarId: plomero.calendar_id, eventId: eventoId }).catch(() => undefined);
}

// ── Cotizadores (División Proyectos): agenda en el calendario del cotizador del territorio ──
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../almacen.js";
type Cotizador = { id: string; nombre: string; territorios: string[]; calendar_id: string; whatsapp: string; estado: string };
const cotizadoresCfg = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "cotizadores.json"), "utf8")) as { ventanas_visita: string[]; visitas_max_dia: number; cotizadores: Cotizador[] };

export function cotizadorDeTerritorio(territorioId: string): Cotizador | undefined {
  return cotizadoresCfg.cotizadores.find((c) => c.territorios.includes(territorioId));
}

export async function ventanasVisitaLibres(territorioId: string, fechaYmd: string): Promise<{ ventana: string; inicio: string; fin: string }[]> {
  const cot = cotizadorDeTerritorio(territorioId);
  if (!cot) return [];
  const todas = cotizadoresCfg.ventanas_visita.map((v) => { const [inicio, fin] = ventanaAIso(fechaYmd, v); return { ventana: v, inicio, fin }; });
  const futuras = todas.filter((v) => new Date(v.inicio).getTime() > Date.now() + 12 * 3600_000); // visitas con al menos 12 h de aviso
  const c = cliente();
  if (!c || cot.calendar_id.startsWith("CAMBIAR")) return futuras;
  const fb = await c.freebusy.query({ requestBody: { timeMin: `${fechaYmd}T00:00:00-04:00`, timeMax: `${fechaYmd}T23:59:59-04:00`, items: [{ id: cot.calendar_id }] } });
  const ocupado = fb.data.calendars?.[cot.calendar_id]?.busy ?? [];
  return futuras.filter((v) => !ocupado.some((o) => new Date(o.start!) < new Date(v.fin) && new Date(o.end!) > new Date(v.inicio)));
}

export async function crearVisitaCotizador(territorioId: string, datos: { titulo: string; descripcion: string; inicio: string; fin: string; direccion: string }): Promise<{ cotizadorId: string; eventoId?: string } | null> {
  const cot = cotizadorDeTerritorio(territorioId);
  if (!cot) return null;
  const c = cliente();
  if (!c || cot.calendar_id.startsWith("CAMBIAR")) return { cotizadorId: cot.id };
  const ev = await c.events.insert({ calendarId: cot.calendar_id, requestBody: { summary: datos.titulo, description: datos.descripcion, location: datos.direccion, start: { dateTime: datos.inicio, timeZone: config.zonaHoraria }, end: { dateTime: datos.fin, timeZone: config.zonaHoraria } } });
  return { cotizadorId: cot.id, eventoId: ev.data.id ?? undefined };
}

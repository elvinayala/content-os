/**
 * Crea los calendarios de Resuelto en la sub-cuenta de GHL (una sola vez).
 *   node scripts/ghl-calendarios.mjs            → crea los que falten
 *   node scripts/ghl-calendarios.mjs --listar   → solo lista
 *
 * Requiere en .env: GHL_TOKEN, GHL_LOCATION_ID. Necesita al menos un usuario en la
 * sub-cuenta (Settings → My Staff); toma el primero como miembro del equipo salvo que
 * se pase GHL_USER_ID. Los IDs creados se guardan en data/ghl-calendarios.json y en .env.
 */
import fs from "node:fs";
import "dotenv/config";

const T = process.env.GHL_TOKEN, L = process.env.GHL_LOCATION_ID;
if (!T || !L) throw new Error("Faltan GHL_TOKEN / GHL_LOCATION_ID en .env");
const H = { Authorization: `Bearer ${T}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 (Macintosh) Chrome/128.0" };
const api = async (m, p, body) => {
  const r = await fetch("https://services.leadconnectorhq.com" + p, { method: m, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${m} ${p} → ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
};

// Horario de Resuelto: lunes a sábado. Las ventanas de 2 h salen de slotDuration=120.
const horas = (desde, hasta) => [1, 2, 3, 4, 5, 6].map((d) => ({ daysOfTheWeek: [d], hours: [{ openHour: desde, openMinute: 0, closeHour: hasta, closeMinute: 0 }] }));

const CALENDARIOS = (userId) => [
  {
    clave: "GHL_CAL_PLOMERIA_METRO",
    body: {
      locationId: L, name: "Plomería · Metro (ventanas de 2 h)", calendarType: "event", slug: "plomeria-metro",
      description: "Trabajos de plomería en Metro Norte y Metro Oeste. Ventanas de 2 horas; el plomero avisa 30 min antes.",
      teamMembers: [{ userId, priority: 0.5 }],
      eventType: "RoundRobin_OptimizeForAvailability", eventTitle: "{{contact.name}} · Plomería",
      slotDuration: 120, slotDurationUnit: "mins", slotInterval: 120, slotIntervalUnit: "mins", slotBuffer: 0, preBuffer: 0,
      appoinmentPerSlot: 1, appoinmentPerDay: 8, allowBookingAfter: 2, allowBookingAfterUnit: "hours", allowBookingFor: 14, allowBookingForUnit: "days",
      openHours: horas(8, 17), autoConfirm: true, allowReschedule: true, allowCancellation: true, shouldSendAlertEmailsToAssignedMember: true,
      notes: "Cupos por ventana (appoinmentPerSlot) = plomeros activos en la zona. Subir cuando entre el 2º plomero.",
    },
  },
  {
    clave: "GHL_CAL_VISITA_COTIZACION",
    body: {
      locationId: L, name: "Visita de cotización · Proyectos", calendarType: "event", slug: "visita-cotizacion",
      description: "Visita del cotizador de Resuelto: mide, fotografía y presenta el precio fijo. 60 minutos.",
      teamMembers: [{ userId, priority: 0.5 }],
      eventType: "RoundRobin_OptimizeForAvailability", eventTitle: "{{contact.name}} · Visita de cotización",
      slotDuration: 60, slotDurationUnit: "mins", slotInterval: 60, slotIntervalUnit: "mins", slotBuffer: 30, preBuffer: 0,
      appoinmentPerSlot: 1, appoinmentPerDay: 4, allowBookingAfter: 24, allowBookingAfterUnit: "hours", allowBookingFor: 21, allowBookingForUnit: "days",
      openHours: horas(9, 17), autoConfirm: true, allowReschedule: true, allowCancellation: true, shouldSendAlertEmailsToAssignedMember: true,
    },
  },
  {
    clave: "GHL_CAL_ENTREVISTA",
    body: {
      locationId: L, name: "Entrevista · Plomeros y contratistas (20 min)", calendarType: "event", slug: "entrevista-resuelto",
      description: "Videollamada de 20 minutos con el candidato. Deck en kit/entrevista/.",
      teamMembers: [{ userId, priority: 0.5 }],
      eventType: "RoundRobin_OptimizeForAvailability", eventTitle: "{{contact.name}} · Entrevista Resuelto",
      slotDuration: 20, slotDurationUnit: "mins", slotInterval: 30, slotIntervalUnit: "mins", slotBuffer: 10, preBuffer: 0,
      appoinmentPerSlot: 1, appoinmentPerDay: 6, allowBookingAfter: 4, allowBookingAfterUnit: "hours", allowBookingFor: 14, allowBookingForUnit: "days",
      openHours: [1, 2, 3, 4, 5].map((d) => ({ daysOfTheWeek: [d], hours: [{ openHour: 10, openMinute: 0, closeHour: 12, closeMinute: 0 }, { openHour: 15, openMinute: 0, closeHour: 17, closeMinute: 0 }] })),
      autoConfirm: true, allowReschedule: true, allowCancellation: true, shouldSendAlertEmailsToAssignedMember: true,
    },
  },
];

const existentes = (await api("GET", `/calendars/?locationId=${L}`)).calendars ?? [];
if (process.argv.includes("--listar")) { for (const c of existentes) console.log(c.id, "·", c.name, "·", c.calendarType); process.exit(0); }

let userId = process.env.GHL_USER_ID;
if (!userId) {
  const us = (await api("GET", `/users/?locationId=${L}`)).users ?? [];
  if (!us.length) { console.error("La sub-cuenta no tiene usuarios todavía. Agrega a Elvin en Settings → My Staff y vuelve a correr."); process.exit(1); }
  userId = us[0].id; console.log("Miembro del equipo:", us[0].name, us[0].email);
}

const salida = JSON.parse(fs.existsSync("data/ghl-calendarios.json") ? fs.readFileSync("data/ghl-calendarios.json", "utf8") : "{}");
for (const { clave, body } of CALENDARIOS(userId)) {
  const ya = existentes.find((c) => c.name === body.name);
  const id = ya ? ya.id : (await api("POST", "/calendars/", body)).calendar?.id;
  console.log(ya ? "ya existía:" : "creado:", body.name, "→", id);
  salida[clave] = id;
}
fs.writeFileSync("data/ghl-calendarios.json", JSON.stringify(salida, null, 2));
const env = fs.readFileSync(".env", "utf8");
const lineas = Object.entries(salida).filter(([k]) => !env.includes(k + "=")).map(([k, v]) => `${k}=${v}`);
if (lineas.length) fs.appendFileSync(".env", "\n# Calendarios de GHL (scripts/ghl-calendarios.mjs)\n" + lineas.join("\n") + "\n");
console.log("Listo. IDs en data/ghl-calendarios.json y .env");

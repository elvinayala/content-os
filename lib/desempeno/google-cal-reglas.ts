// Google Calendar en Ritmo (28/sep/2026). Puro: tests en tests/google-cal.test.mjs.
// Elvin: "que Ritmo conecte el calendario de los empleados con su correo corporativo (Google Workspace) para que vean su
// día a día; si tienen algo, que se acuerden y lo anoten ahí mismo".

export const ALCANCES = ["openid", "email", "https://www.googleapis.com/auth/calendar.events"];

/** Hora de PR: UTC−4 todo el año (sin horario de verano). */
export const inicioDia = (dia: string) => `${dia}T00:00:00-04:00`;
export const finDia = (dia: string) => `${dia}T23:59:59-04:00`;

export interface EventoGoogle {
  id?: string;
  summary?: string;
  status?: string;
  htmlLink?: string;
  hangoutLink?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
}

export interface EventoDia {
  id: string;
  titulo: string;
  todoElDia: boolean;
  inicio: string | null; // "9:30 AM" (PR)
  fin: string | null;
  link: string | null; // Meet o el evento en Google
  lugar: string | null;
  orden: string;
}

const horaPR = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Puerto_Rico", hour: "numeric", minute: "2-digit" });

/** Eventos del día para la tarjeta de Hoy: sin cancelados ni los que la persona rechazó; los de todo el día primero. */
export function eventosDelDia(items: EventoGoogle[]): EventoDia[] {
  return items
    .filter((e) => e.status !== "cancelled" && !e.attendees?.some((a) => a.self && a.responseStatus === "declined"))
    .map((e) => {
      const todo = !!e.start?.date && !e.start?.dateTime;
      return {
        id: e.id ?? "",
        titulo: (e.summary ?? "(sin título)").trim(),
        todoElDia: todo,
        inicio: e.start?.dateTime ? horaPR(e.start.dateTime) : null,
        fin: e.end?.dateTime ? horaPR(e.end.dateTime) : null,
        link: e.hangoutLink ?? e.htmlLink ?? null,
        lugar: e.location?.trim() || null,
        orden: todo ? "0" : (e.start?.dateTime ?? "9"),
      };
    })
    .sort((a, b) => a.orden.localeCompare(b.orden));
}

export interface Anotacion {
  titulo: string;
  fecha: string; // YYYY-MM-DD
  hora?: string | null; // "14:30" (PR); sin hora = recordatorio de todo el día
  minutos?: number | null; // duración
  nota?: string | null;
}

export function errorAnotacion(a: Anotacion): string | null {
  if (!a.titulo?.trim()) return "Escribe qué quieres anotar";
  if (a.titulo.trim().length > 150) return "Máximo 150 caracteres";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.fecha)) return "Escoge la fecha";
  if (a.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(a.hora)) return "Hora inválida";
  if (a.minutos != null && (!Number.isInteger(a.minutos) || a.minutos < 5 || a.minutos > 480)) return "Duración entre 5 min y 8 horas";
  if ((a.nota ?? "").length > 1000) return "La nota es muy larga";
  return null;
}

/** Cuerpo del evento para la API de Google: con hora = bloque con aviso 10 min antes; sin hora = todo el día con aviso a las 9 AM. */
export function cuerpoEvento(a: Anotacion) {
  const base = { summary: a.titulo.trim(), description: [a.nota?.trim(), "Anotado desde Ritmo."].filter(Boolean).join("\n\n") };
  if (!a.hora) {
    const siguiente = new Date(Date.parse(`${a.fecha}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    // Todo el día: el aviso cuenta desde la medianoche del día anterior → 15 h = 9 AM de ese día.
    return { ...base, start: { date: a.fecha }, end: { date: siguiente }, reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 15 * 60 }] } };
  }
  const ini = Date.parse(`${a.fecha}T${a.hora}:00-04:00`);
  const fin = ini + (a.minutos ?? 30) * 60_000;
  const iso = (t: number) => new Date(t).toISOString();
  return { ...base, start: { dateTime: iso(ini), timeZone: "America/Puerto_Rico" }, end: { dateTime: iso(fin), timeZone: "America/Puerto_Rico" }, reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 10 }] } };
}

// Seguridad del ponche y almuerzo (27/sep/2026, Elvin). Parte pura, testeada en tests/seguridad-ponche.test.mjs.
//
// - Solo se poncha desde una COMPUTADORA de trabajo registrada y aprobada, y desde una red (IP) aprobada.
// - Una computadora por persona; una segunda (laptop + desktop) o un cambio lo aprueba RR.HH. (Yaileen).
// - Si no está en su computadora: pide un ponche manual y RR.HH. lo autoriza.
// - Almuerzo: 1 hora, la escoge cada quien entre las 11:00 AM y las 2:00 PM (hora PR).

export type MotivoBloqueo = "movil" | "sin-equipo" | "equipo-pendiente" | "equipo-revocado" | "red-nueva";

export const TEXTO_BLOQUEO: Record<MotivoBloqueo, string> = {
  movil: "Desde el teléfono no se poncha. Usa tu computadora de trabajo o pide un ponche manual.",
  "sin-equipo": "Esta computadora no está registrada. Regístrala o pide un ponche manual.",
  "equipo-pendiente": "Esta computadora está esperando que RR.HH. la apruebe. Mientras tanto, pide un ponche manual.",
  "equipo-revocado": "Esta computadora ya no está autorizada. Pídele a RR.HH. que la reactive o usa la registrada.",
  "red-nueva": "Estás en una red (internet) distinta a la aprobada. Se le pidió a RR.HH. que la apruebe; mientras tanto, pide un ponche manual.",
};

/** Teléfonos y tablets: no son equipos de trabajo para ponchar. */
export function esMovil(ua: string | null | undefined): boolean {
  const u = ua ?? "";
  return /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|webOS|BlackBerry|Opera Mini|IEMobile/i.test(u);
}

/** "Chrome · Windows", "Safari · Mac": lo que ve RR.HH. para reconocer el equipo. */
export function resumenAgente(ua: string | null | undefined): string {
  const u = ua ?? "";
  const nav = /Edg\//.test(u) ? "Edge" : /OPR\//.test(u) ? "Opera" : /Firefox\//.test(u) ? "Firefox" : /Chrome\//.test(u) ? "Chrome" : /Safari\//.test(u) ? "Safari" : "Navegador";
  const so = /Windows/.test(u) ? "Windows" : /Mac OS X|Macintosh/.test(u) ? "Mac" : /CrOS/.test(u) ? "Chromebook" : /Linux/.test(u) ? "Linux" : /Android/.test(u) ? "Android" : /iPhone|iPad/.test(u) ? "iOS" : "otro sistema";
  return `${nav} · ${so}`;
}

/** La "red" de una IP: IPv4 completa; IPv6 solo el prefijo /64 (la parte final cambia sola varias veces al día). */
export function redDe(ip: string | null | undefined): string | null {
  const x = (ip ?? "").trim().replace(/^::ffff:/i, "");
  if (!x) return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(x)) return x;
  if (!x.includes(":")) return null;
  // Expandir "::" para quedarnos con los 4 primeros grupos.
  const [izq, der] = x.split("::");
  const a = izq ? izq.split(":") : [];
  const b = der !== undefined && der !== "" ? der.split(":") : [];
  const grupos = der !== undefined ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill("0"), ...b] : a;
  return `${grupos.slice(0, 4).map((g) => (g || "0").toLowerCase().replace(/^0+(?=.)/, "")).join(":")}::/64`;
}

export interface EquipoPonche {
  estado: string; // pendiente | aprobado | revocado
  ips: string[];
}

/** ¿Puede ponchar desde aquí? */
export function decisionPonche(p: { equipo: EquipoPonche | null; ip: string | null; movil: boolean }): { ok: true } | { ok: false; motivo: MotivoBloqueo } {
  if (p.movil) return { ok: false, motivo: "movil" };
  if (!p.equipo) return { ok: false, motivo: "sin-equipo" };
  if (p.equipo.estado === "pendiente") return { ok: false, motivo: "equipo-pendiente" };
  if (p.equipo.estado !== "aprobado") return { ok: false, motivo: "equipo-revocado" };
  const red = redDe(p.ip);
  if (!red || !p.equipo.ips.includes(red)) return { ok: false, motivo: "red-nueva" };
  return { ok: true };
}

/** Registrar un equipo: el primero entra aprobado (con la red de ese momento); los demás esperan a RR.HH. */
export function estadoAlRegistrar(p: { aprobadosQueTiene: number; movil: boolean }): { error: string } | { estado: "aprobado" | "pendiente" } {
  if (p.movil) return { error: "Solo se registran computadoras (no teléfonos ni tablets)." };
  return { estado: p.aprobadosQueTiene === 0 ? "aprobado" : "pendiente" };
}

export function errorNombreEquipo(nombre: string): string | null {
  const n = (nombre ?? "").trim();
  if (n.length < 2) return "Ponle un nombre a tu equipo (ej. Laptop HP)";
  if (n.length > 60) return "Nombre de máximo 60 caracteres";
  return null;
}

// ---- Almuerzo ----

export const ALMUERZO = { desde: 11 * 60, hasta: 14 * 60, minutos: 60, tolerancia: 5 };
export const TEXTO_VENTANA_ALMUERZO = "entre las 11:00 AM y las 2:00 PM";

/** Minutos del día en hora de PR. */
export function minutosPR(fecha: Date): number {
  const [h, m] = fecha.toLocaleTimeString("en-GB", { timeZone: "America/Puerto_Rico", hour: "2-digit", minute: "2-digit", hour12: false }).split(":").map(Number);
  return (h % 24) * 60 + m;
}

/** ¿Puede salir a almorzar ahora? null = sí; si no, el porqué. */
export function errorAlmuerzo(p: { ahora: Date; yaAlmorzo: boolean; trabajando: boolean }): string | null {
  if (!p.trabajando) return "Primero marca tu entrada";
  if (p.yaAlmorzo) return "Ya tomaste tu almuerzo hoy";
  const m = minutosPR(p.ahora);
  if (m < ALMUERZO.desde || m >= ALMUERZO.hasta) return `El almuerzo se toma ${TEXTO_VENTANA_ALMUERZO}`;
  return null;
}

/** Minutos que duró el almuerzo y si se pasó de la hora (con 5 min de tolerancia). */
export function duracionAlmuerzo(salida: Date, vuelta: Date | null, ahora = new Date()): { minutos: number; largo: boolean } {
  const minutos = Math.max(0, Math.round(((vuelta ?? ahora).getTime() - salida.getTime()) / 60000));
  return { minutos, largo: minutos > ALMUERZO.minutos + ALMUERZO.tolerancia };
}

// ---- Ponche manual ----

export const MAX_DIAS_PONCHE_MANUAL = 3;

export function errorPoncheManual(p: { tipo: string; hora: Date; motivo: string; ahora: Date }): string | null {
  if (p.tipo !== "entrada" && p.tipo !== "salida") return "Escoge entrada o salida";
  if (Number.isNaN(p.hora.getTime())) return "Hora inválida";
  if (p.hora.getTime() > p.ahora.getTime() + 5 * 60000) return "No se puede pedir un ponche en el futuro";
  if (p.ahora.getTime() - p.hora.getTime() > MAX_DIAS_PONCHE_MANUAL * 86_400_000) return `Solo se puede pedir hasta ${MAX_DIAS_PONCHE_MANUAL} días atrás`;
  const m = (p.motivo ?? "").trim();
  if (m.length < 5) return "Explica brevemente por qué (ej. estaba fuera de mi computadora)";
  if (m.length > 300) return "Motivo de máximo 300 caracteres";
  return null;
}

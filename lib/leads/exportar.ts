// Exportar leads a Excel (CSV con ; y BOM), como "Exportar resultados del filtro" de Pipedrive (28/sep/2026).
// Puro: columnas, filas y quién puede (tests en tests/leads-exportar.test.mjs).

export interface FilaExport {
  id: string;
  nombre: string;
  negocio: string | null;
  telefono: string | null;
  email: string | null;
  embudo: string;
  etapa: string;
  estado: string;
  valor: number;
  dueno: string | null;
  agendoPor: string | null;
  origen: string;
  etiquetas: string[];
  datos: Record<string, unknown>;
  motivoPerdida: string | null;
  proximaActividad: Date | string | null;
  ultimoMensaje: Date | string | null;
  etapaDesde: Date | string;
  createdAt: Date | string;
  cerradoAt: Date | string | null;
}

export const COLUMNAS_EXPORT = [
  "Nombre",
  "Negocio",
  "Teléfono",
  "E-mail",
  "Embudo",
  "Etapa",
  "Estado",
  "Valor (USD)",
  "Dueño",
  "Agendó",
  "Origen",
  "Nicho",
  "Etiquetas",
  "Motivo de pérdida",
  "Próxima actividad",
  "Último mensaje",
  "Días en la etapa",
  "Creado",
  "Cerrado",
  "ID",
] as const;

const ESTADO: Record<string, string> = { abierto: "Abierto", ganado: "Ganado", perdido: "Perdido" };

/** Fecha y hora de Puerto Rico que Excel reconoce ("2026-09-28 14:05"). */
export function fechaPR(v: Date | string | null | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Puerto_Rico", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

/** Teléfono legible: 17874092812 → +1 787-409-2812 (PR/EE. UU.); otros, con + adelante. */
export function telefonoExport(t: string | null): string {
  if (!t) return "";
  const d = t.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return `+1 ${d.slice(1, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `+1 ${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d ? `+${d}` : "";
}

export function filaExport(f: FilaExport, ahora = new Date()): string[] {
  const nicho = typeof f.datos?.nicho === "string" ? f.datos.nicho : "";
  const dias = Math.max(0, Math.floor((ahora.getTime() - new Date(f.etapaDesde).getTime()) / 86_400_000));
  return [
    f.nombre,
    f.negocio ?? "",
    telefonoExport(f.telefono),
    f.email ?? "",
    f.embudo,
    f.etapa,
    ESTADO[f.estado] ?? f.estado,
    String(f.valor ?? 0),
    f.dueno ?? "",
    f.agendoPor ?? "",
    f.origen,
    nicho,
    (f.etiquetas ?? []).join(", "),
    f.motivoPerdida ?? "",
    fechaPR(f.proximaActividad),
    fechaPR(f.ultimoMensaje),
    f.estado === "abierto" ? String(dias) : "",
    fechaPR(f.createdAt),
    fechaPR(f.cerradoAt),
    f.id,
  ];
}

/** Celda de CSV para Excel en español (; como separador). Neutraliza fórmulas (=, +, -, @) para que un lead
 *  que escribió "=HYPERLINK(...)" no se ejecute al abrir el archivo. */
export function celda(v: string): string {
  let s = (v ?? "").replace(/\r?\n/g, " ").trim();
  if (/^[=+\-@]/.test(s) && !/^\+\d[\d \-]+$/.test(s)) s = `'${s}`;
  return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvLeads(filas: FilaExport[], ahora = new Date()): string {
  const lineas = [COLUMNAS_EXPORT.map((c) => celda(c)).join(";"), ...filas.map((f) => filaExport(f, ahora).map(celda).join(";"))];
  return `﻿${lineas.join("\r\n")}`;
}

/** Quién exporta: Elvin (admin) siempre; además los correos de LEADS_EXPORTAR. Sacar la base de leads fuera de
 *  Pulse es sensible (un closer que se va se lleva la lista), por eso no lo tiene todo el que ve Leads. */
export function puedeExportarLeads(u: { rol: string; email: string }, lista = ""): boolean {
  if (u.rol === "admin") return true;
  return lista.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(u.email.toLowerCase());
}

export const nombreArchivo = (marca: string, embudo: string | null, estado: string, hoy: string) =>
  `leads-${marca}-${(embudo ?? "todos").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "todos"}-${estado}-${hoy}.csv`;

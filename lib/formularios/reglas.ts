// Formularios propios (26/sep/2026): el "Typeform" de la casa. Una pregunta por pantalla, con la
// estética del onboarding de Level Up, y editable desde Pulse → Formularios sin tocar código.
// Puro (sin server-only): lo usan la página pública, el editor y el servidor. Tests en
// tests/formularios.test.mjs.

export type TipoPregunta = "texto" | "largo" | "email" | "telefono" | "numero" | "opcion" | "multiple" | "url" | "redes" | "si-no" | "escala";

export interface Pregunta {
  id: string;
  seccion?: string;
  titulo: string;
  ayuda?: string;
  tipo: TipoPregunta;
  requerida: boolean;
  opciones?: string[];
  otra?: boolean; // agrega "Otra" con texto libre
  placeholder?: string;
  /** Cómo se ve cada opción (se guarda la opción tal cual; p. ej. la etiqueta exacta del CRM). */
  etiquetas?: Record<string, string>;
  /** Solo se muestra si esta otra respuesta cumple la condición. */
  si?: { id: string; valor: string };
  /** Título de la columna en Pulse (solo para la acción "Ficha de cliente en Pulse"). */
  columna?: string;
}

export interface Bienvenida {
  etiqueta?: string;
  titulo: string;
  texto?: string;
  puntos?: string[];
  boton?: string;
}

export interface Gracias {
  titulo: string; // admite {nombre}
  texto?: string;
  boton?: { texto: string; url: string };
}

export interface ConfigFormulario {
  bienvenida: Bienvenida;
  gracias: Gracias;
  preguntas: Pregunta[];
}

export type Respuestas = Record<string, string | string[] | Record<string, string> | undefined>;

// ---------- Apariencia ----------

export interface Tema {
  nombre: string;
  fondo: string;
  texto: string;
  sutil: string;
  acento: string;
  tinta: string; // texto sobre el acento (botón)
  oscuro: boolean;
  logo?: string;
}

export const TEMAS: Record<string, Tema> = {
  "level-up": { nombre: "Level Up (negro y amarillo)", fondo: "#0b0b0b", texto: "#f5f1e8", sutil: "#a3a3a3", acento: "#f5ce1a", tinta: "#0b0b0b", oscuro: true, logo: "/marcas/level-up-logo-dark.png" },
  "ai-borinquen": { nombre: "AI Borinquen (noche y verde)", fondo: "#07120e", texto: "#eef7f2", sutil: "#9fb3aa", acento: "#34d399", tinta: "#04130c", oscuro: true, logo: "/marcas/ai-borinquen-logo-dark.png" },
  claro: { nombre: "Claro (blanco y negro)", fondo: "#faf9f6", texto: "#141414", sutil: "#6b6b6b", acento: "#141414", tinta: "#ffffff", oscuro: false },
  noche: { nombre: "Noche (azul y coral)", fondo: "#0d1321", texto: "#f1f4fb", sutil: "#9aa6bd", acento: "#ff7a59", tinta: "#1a0d08", oscuro: true },
};

export const LOGOS: Record<string, string> = {
  "": "Sin logo",
  "/marcas/level-up-logo-dark.png": "Level Up (para fondo oscuro)",
  "/marcas/level-up-logo-light.png": "Level Up (para fondo claro)",
  "/marcas/ai-borinquen-logo-dark.png": "AI Borinquen",
  "/marcas/bori/lockup.png": "Bori",
  "/marcas/resuelto/logo-blanco.png": "Resuelto (blanco)",
  "/marcas/resuelto/logo-azul.png": "Resuelto (azul)",
};

export interface Apariencia {
  tema: string;
  acento?: string | null;
  logo?: string | null;
}

export function temaDe(a: Apariencia): Tema {
  const base = TEMAS[a.tema] ?? TEMAS["level-up"];
  const acento = a.acento && /^#[0-9a-f]{6}$/i.test(a.acento) ? a.acento : base.acento;
  const logo = a.logo === undefined || a.logo === null ? base.logo : a.logo || undefined;
  return { ...base, acento, tinta: a.acento && a.acento !== base.acento ? tintaSobre(acento) : base.tinta, logo };
}

/** Negro o blanco según qué se lea mejor sobre ese color. */
export function tintaSobre(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0b0b0b" : "#ffffff";
}

// ---------- Acciones al recibir una respuesta ----------

export const ACCIONES: Record<string, string> = {
  ninguna: "Solo guardar las respuestas",
  "pulse-onboarding-lu": "Crear la ficha del cliente en Pulse (LEVEL UP MEDIA) y abrirle expediente a Max",
};

export const TIPOS: Record<TipoPregunta, string> = {
  texto: "Texto corto",
  largo: "Texto largo",
  email: "E-mail",
  telefono: "Teléfono / WhatsApp",
  numero: "Número",
  opcion: "Opción única",
  multiple: "Varias opciones",
  "si-no": "Sí / No",
  escala: "Escala del 0 al 10",
  url: "Link",
  redes: "Redes sociales y web",
};

export const SI_NO = ["Sí", "No"];
export const ESCALA = Array.from({ length: 11 }, (_, i) => String(i));

export function opcionesDe(p: Pregunta): string[] {
  if (p.tipo === "si-no") return SI_NO;
  if (p.tipo === "escala") return ESCALA;
  return p.opciones ?? [];
}

export const verOpcion = (p: Pregunta, op: string) => p.etiquetas?.[op] ?? op;

// ---------- Validación ----------

export function visible(p: Pregunta, r: Respuestas): boolean {
  if (!p.si) return true;
  const v = r[p.si.id];
  return Array.isArray(v) ? v.includes(p.si.valor) : v === p.si.valor;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Mensaje de error de una pregunta, o null si está bien. */
export function errorDe(p: Pregunta, r: Respuestas): string | null {
  if (!visible(p, r)) return null;
  const v = r[p.id];
  const vacio = v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && !Object.values(v).some((x) => x?.trim()));
  if (vacio) return p.requerida ? "Esta respuesta hace falta para seguir." : null;
  const s = typeof v === "string" ? v.trim() : "";
  switch (p.tipo) {
    case "email":
      return EMAIL.test(s) ? null : "Ese e-mail no parece correcto.";
    case "telefono": {
      const d = s.replace(/\D/g, "");
      return d.length === 10 || (d.length === 11 && d.startsWith("1")) ? null : "Escribe los 10 números (ej. 787 000 0000).";
    }
    case "numero": {
      const n = Number(s.replace(/[$,\s]/g, ""));
      return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? null : "Escribe solo el número.";
    }
    case "url":
      return /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/i.test(s) ? null : "Pega un link válido.";
    case "opcion":
    case "si-no":
    case "escala":
      if (p.otra && s.startsWith("Otra:")) return s.slice(5).trim() ? null : "Escribe cuál.";
      return opcionesDe(p).includes(s) ? null : "Elige una opción.";
    case "multiple":
      return Array.isArray(v) && v.every((x) => opcionesDe(p).includes(x)) ? null : "Elige al menos una opción.";
    default:
      return s.length > 3000 ? "Es muy largo: resúmelo un poco." : null;
  }
}

export function validar(preguntas: Pregunta[], r: Respuestas): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const p of preguntas) {
    const e = errorDe(p, r);
    if (e) errores[p.id] = e;
  }
  return errores;
}

/** Respuesta como texto plano (para resúmenes, la tabla y el CSV). */
export function texto(v: Respuestas[string]): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return Object.entries(v).filter(([, x]) => x?.trim()).map(([k, x]) => `${k}: ${x.trim()}`).join(" · ");
  return v.trim();
}

/** Deja solo las respuestas de preguntas visibles y con el tipo esperado (lo que se guarda). */
export function limpiar(preguntas: Pregunta[], r: Respuestas): Respuestas {
  const out: Respuestas = {};
  for (const p of preguntas) {
    if (!visible(p, r)) continue;
    const v = r[p.id];
    if (v == null) continue;
    if (p.tipo === "multiple") {
      if (Array.isArray(v)) out[p.id] = v.map(String).slice(0, 50);
    } else if (p.tipo === "redes") {
      if (typeof v === "object" && !Array.isArray(v)) out[p.id] = Object.fromEntries(Object.entries(v).map(([k, x]) => [k.slice(0, 40), String(x ?? "").slice(0, 300)]));
    } else if (typeof v === "string") out[p.id] = v.slice(0, 5000);
  }
  return out;
}

/** "{nombre}" en los textos de la pantalla final → primer nombre de quien respondió. */
export function conNombre(t: string, r: Respuestas): string {
  const nombre = texto(r.nombre).split(/\s+/)[0] ?? "";
  return t.replace(/,?\s*\{nombre\}/g, (m) => (nombre ? m.replace("{nombre}", nombre) : "")).trim();
}

// ---------- Editor ----------

export function slugDe(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function idNuevo(existentes: string[]): string {
  for (let i = existentes.length + 1; ; i++) {
    const id = `p${i}`;
    if (!existentes.includes(id)) return id;
  }
}

/** Revisa que el formulario se pueda publicar. Devuelve el primer problema o null. */
export function problemaConfig(c: ConfigFormulario): string | null {
  if (!c.bienvenida?.titulo?.trim()) return "La pantalla de bienvenida necesita un título.";
  if (!c.gracias?.titulo?.trim()) return "La pantalla final necesita un título.";
  if (!c.preguntas?.length) return "Agrega al menos una pregunta.";
  const ids = new Set<string>();
  for (const [i, p] of c.preguntas.entries()) {
    const n = `Pregunta ${i + 1}`;
    if (!p.titulo?.trim()) return `${n}: escribe la pregunta.`;
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,40}$/.test(p.id) || ids.has(p.id)) return `${n}: identificador inválido o repetido.`;
    ids.add(p.id);
    if (!TIPOS[p.tipo]) return `${n}: tipo inválido.`;
    if ((p.tipo === "opcion" || p.tipo === "multiple") && !(p.opciones ?? []).filter((o) => o.trim()).length) return `${n}: agrega las opciones.`;
    if (p.si) {
      const j = c.preguntas.findIndex((x) => x.id === p.si!.id);
      if (j < 0 || j >= i) return `${n}: la condición tiene que depender de una pregunta anterior.`;
    }
  }
  if (c.gracias.boton && (!c.gracias.boton.texto?.trim() || !/^https?:\/\/\S+\.\S+/.test(c.gracias.boton.url ?? ""))) return "El botón de la pantalla final necesita texto y un link (https://…).";
  return null;
}

// ---------- Links ----------

const PROD = "https://content-os-chi-seven.vercel.app";

/** Link público para compartir. Los de Level Up salen por el dominio de marca (levelupmedia.vercel.app). */
export function linkPublico(f: { slug: string; marca: string }): string {
  if (f.marca === "level_up") return f.slug === "onboarding-level-up" ? "https://levelupmedia.vercel.app" : `https://levelupmedia.vercel.app/f/${f.slug}`;
  return `${PROD}/f/${f.slug}`;
}

export const MARCAS_FORM: Record<string, string> = { level_up: "Level Up", ai_borinquen: "AI Borinquen", otra: "Otra" };

/** Valor para una celda de CSV (Excel en español abre bien con ; y BOM). */
export function celdaCsv(v: string): string {
  const s = v.replace(/\r?\n/g, " ").trim();
  return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------- Quién maneja los formularios ----------

/** Además de admin/editor de Pulse: Jessica (onboarding) y Nahuel (director comercial), 26/sep.
 *  Override con FORMULARIOS_ACCESO (emails separados por coma). */
export function puedeFormularios(u: { rol: string; email: string }, lista = "jessica@levelupmediapr.net,nahueltissera46@gmail.com"): boolean {
  if (u.rol === "admin" || u.rol === "editor") return true;
  return lista.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(u.email.toLowerCase());
}

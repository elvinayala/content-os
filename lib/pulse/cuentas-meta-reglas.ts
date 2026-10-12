// Verificación de la cuenta publicitaria de cada cliente de Level Up (12/oct/2026). Elvin: "cómo aseguramos que Bori
// lea todas las cuentas y queden conectadas el día del onboarding". Puro y testeado (tests/cuentas-meta.test.mjs);
// lo usa lib/pulse/cuentas-meta.ts (consulta a Meta, comentarios en la ficha y avisos a Jessica).

export const PORTAFOLIO_LU = process.env.CUENTAS_META_PORTAFOLIO_ID || "836808821982174"; // "Level Up" en Business Manager

export type EstadoCuenta =
  | "ok" // la lee y está activa
  | "sin-id" // la ficha no trae el ID
  | "sin-permiso" // el dueño no la compartió con nuestro portafolio
  | "no-existe" // el ID no existe o está mal escrito
  | "pago" // la lee, pero Meta la tiene con pago pendiente / en gracia
  | "inactiva" // la lee, pero está deshabilitada, en revisión o cerrada
  | "transitorio"; // error de Meta o del token: no es culpa del cliente, no se avisa por cliente

export const PROBLEMAS: EstadoCuenta[] = ["sin-id", "sin-permiso", "no-existe", "pago", "inactiva"];
export const esProblema = (e: EstadoCuenta | null | undefined) => !!e && PROBLEMAS.includes(e);

/** El ID tal como lo escribe el cliente ("act_123 456", "ID: 1234…") → solo dígitos, o null si no parece un ID (8–20 dígitos). */
export function limpiarId(valor: unknown): string | null {
  const d = String(valor ?? "").replace(/^\s*act_/i, "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 20 ? d : null;
}

export interface RespuestaMeta {
  account_status?: number;
  name?: string;
  error?: { code?: number; message?: string; error_subcode?: number };
}

// account_status de Meta: 1 activa · 2 deshabilitada · 3 pago pendiente · 7 en revisión de riesgo · 8 liquidando · 9 en gracia · 100 en revisión · 101 cerrada · 201 cualquier cierre
export function clasificar(r: RespuestaMeta): { estado: EstadoCuenta; detalle: string } {
  if (r.error) {
    const { code, message = "" } = r.error;
    if (code === 200 && /NOT grant ads_management or ads_read/i.test(message)) return { estado: "sin-permiso", detalle: "el dueño de la cuenta no la compartió con el portafolio de Level Up" };
    if (code === 100 || code === 803) return { estado: "no-existe", detalle: "Meta dice que ese ID no existe o no lo vemos (revisa que esté bien escrito)" };
    return { estado: "transitorio", detalle: `${message}`.slice(0, 140) || `error ${code ?? "?"}` };
  }
  const s = r.account_status;
  if (s === 1) return { estado: "ok", detalle: "activa" };
  if (s === 3) return { estado: "pago", detalle: "Meta la tiene con pago pendiente: los anuncios no corren hasta resolverlo" };
  if (s === 9) return { estado: "pago", detalle: "está en periodo de gracia por un pago fallido" };
  if (s === 2) return { estado: "inactiva", detalle: "Meta la tiene deshabilitada" };
  if (s === 7 || s === 100) return { estado: "inactiva", detalle: "está en revisión de Meta" };
  if (s === 101 || s === 201 || s === 8) return { estado: "inactiva", detalle: "la cuenta está cerrada" };
  return { estado: "ok", detalle: "se lee bien" };
}

export const PASOS_COMPARTIR =
  `Pídele al cliente (Meta Business Suite → Configuración del negocio → Cuentas → Cuentas publicitarias → su cuenta → Asignar socios): ` +
  `pegar el ID de portafolio ${PORTAFOLIO_LU} ("Level Up") con permiso de *Administrar campañas* (control total).`;

/** Comentario que queda en la ficha cuando cambia el estado. */
export function textoFicha(estado: EstadoCuenta, id: string | null, detalle: string): string {
  switch (estado) {
    case "ok":
      return `✅ Cuenta publicitaria ${id}: Bori la lee y está activa.`;
    case "sin-id":
      return `⚠️ Falta el ID de la cuenta publicitaria. Sin él no podemos leer resultados ni conectar Bori. Pídeselo al cliente en el onboarding (si no tiene cuenta, hay que crearla).`;
    case "sin-permiso":
      return `⚠️ Bori NO puede leer la cuenta ${id}: ${detalle}. ${PASOS_COMPARTIR}`;
    case "no-existe":
      return `⚠️ Cuenta publicitaria ${id}: ${detalle}. Confirma el ID con el cliente (son 15-16 números, sin "act_").`;
    case "pago":
    case "inactiva":
      return `⚠️ Cuenta publicitaria ${id}: ${detalle}. Bori la lee, pero hay que hablar con el cliente.`;
    default:
      return `Cuenta publicitaria ${id}: ${detalle}`;
  }
}

export interface Linea {
  nombre: string;
  empresa?: string | null;
  id: string | null;
  estado: EstadoCuenta;
  detalle: string;
  admin?: string | null;
}

const ICONO: Partial<Record<EstadoCuenta, string>> = { "sin-id": "🆔", "sin-permiso": "🔒", "no-existe": "❓", pago: "💳", inactiva: "⛔" };

export function textoLinea(l: Linea): string {
  const quien = `${l.nombre}${l.empresa ? ` · ${l.empresa}` : ""}`;
  const adm = l.admin ? ` _(${l.admin})_` : "";
  return `${ICONO[l.estado] ?? "•"} *${quien}*${adm}${l.id ? ` — ${l.id}` : ""}: ${l.detalle}`;
}

/** DM para Jessica: lo nuevo (o el recordatorio de lunes con todo lo pendiente). */
export function textoAviso(p: { nuevos: Linea[]; recuperados: Linea[]; recordatorio?: boolean }): string | null {
  const partes: string[] = [];
  if (p.nuevos.length) {
    const sin = p.nuevos.filter((l) => l.estado === "sin-permiso" || l.estado === "no-existe");
    partes.push(
      `${p.recordatorio ? "📌 Cuentas publicitarias que siguen pendientes" : "🔌 Cuentas publicitarias por conectar"} (${p.nuevos.length}):\n` +
        p.nuevos.map((l) => `• ${textoLinea(l)}`).join("\n") +
        (sin.length ? `\n\n${PASOS_COMPARTIR}` : ""),
    );
  }
  if (p.recuperados.length) partes.push(`✅ Ya quedaron conectadas:\n${p.recuperados.map((l) => `• ${l.nombre}${l.empresa ? ` · ${l.empresa}` : ""}`).join("\n")}`);
  return partes.length ? partes.join("\n\n") : null;
}

/** ¿Hay que escribir en la ficha y avisar? Compara con el último estado guardado. */
export function decidir(anterior: EstadoCuenta | null, ahora: EstadoCuenta): { escribir: boolean; avisar: "nuevo" | "recuperado" | null } {
  if (ahora === "transitorio") return { escribir: false, avisar: null };
  if (anterior === ahora) return { escribir: false, avisar: null };
  if (esProblema(ahora)) return { escribir: true, avisar: "nuevo" };
  // ahora está ok: solo se escribe si antes había un problema registrado (si nunca hubo problema, no se llena la ficha de ✅)
  if (esProblema(anterior)) return { escribir: true, avisar: "recuperado" };
  return { escribir: false, avisar: null };
}

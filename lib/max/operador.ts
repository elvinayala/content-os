// Max en Slack — la lógica pura (sin red ni base), testeada en tests/max-operador.test.mjs.
//
// Elvin (24/sep/2026): "Max debe de vivir en Slack. En los canales de Slack, si un cliente envía
// algo, él le tiene que responder dando la recomendación o solicitándole cualquier cosa. Todo el
// proceso — el Typeform, el onboarding, la estrategia, la creación de contenido — que él lo cree
// independiente, envía aprobación al canal, se aprueba, y cuando está aprobado se lo envía al
// cliente. Siempre aprobación a Carilin o a mí en un canal. Cuando se aprueba todo, crea la
// estructura de campañas y anuncios y deja todo en borrador. Y si lo autoriza, lo publica."
//
// Decisiones de Elvin (24/sep): canal nuevo #max-aprobaciones · TODO lo que va al cliente pasa por
// aprobación (Max nunca le escribe directo: el servidor publica exactamente lo aprobado) · aprueban
// y autorizan publicar Elvin o Carilin · arranca con los clientes nuevos desde el onboarding.

// Qué propone Max. El tipo decide qué pasa al aprobarse:
//  - mensaje / plan / creativos → el servidor lo publica tal cual en el canal del cliente.
//  - campana → Max lo monta EN PAUSA (borrador) y reporta los ids.
//  - publicar → Max prende EXACTAMENTE esas campañas (el script verifica esta aprobación).
//  - interno → una consulta/aviso para Elvin/Carilin; aprobar solo lo cierra.
export const TIPOS_ITEM = ["mensaje", "plan", "creativos", "campana", "publicar", "interno"] as const;
export type TipoItem = (typeof TIPOS_ITEM)[number];
export const VAN_AL_CLIENTE: readonly TipoItem[] = ["mensaje", "plan", "creativos"];

export const ESTADOS_ITEM = ["esperando", "aprobado", "rechazado", "enviado", "ejecutado", "fallido"] as const;
export type EstadoItem = (typeof ESTADOS_ITEM)[number];

// Etapas del cliente con Max (el tablero de /ceo y el cerebro las usan igual).
export const ETAPAS = [
  "onboarding", // llegó el formulario; Max junta ficha, llamada de venta y competencia
  "estrategia", // plan de marketing en aprobación
  "estrategia-aprobada", // aprobado y enviado al cliente
  "creativos", // flyers/guiones/pedido de videos en producción o aprobación
  "campanas", // estructura montada EN PAUSA, esperando "publica"
  "activo", // publicado; Max optimiza (MANTENER/APAGAR/ITERAR/ESCALAR/NUEVO TEST)
  "pausado",
] as const;
export type Etapa = (typeof ETAPAS)[number];

export type Decision =
  | { accion: "aprobar"; id: number; nota: string }
  | { accion: "rechazar"; id: number; nota: string }
  | { accion: "publicar"; id: number; nota: string };

// "ok 12", "dale #12", "aprobado 12 pero sin emojis", "no 12 cambia el gancho", "publica 12".
// Solo cuenta si empieza con la palabra y trae el número; lo demás es conversación con Max.
const RE_DECISION = /^\s*(?:@?max[\s,:]+)?(ok|okay|s[ií]|dale|aprobad[oa]|aprueba|va|no|rechazad[oa]|publ[ií]ca(?:lo|la|los)?|publicar|pr[eé]ndel[oa]s?)\s*#?(\d{1,7})\b[\s,.:;—-]*([\s\S]*)$/i;

export function parsearDecision(texto: string): Decision | null {
  const m = String(texto ?? "").replace(/<@[^>]+>/g, "").match(RE_DECISION);
  if (!m) return null;
  const palabra = m[1].toLowerCase();
  const id = Number(m[2]);
  const nota = m[3].trim().slice(0, 2000);
  if (/^(no|rechazad)/.test(palabra)) return { accion: "rechazar", id, nota };
  if (/^(publ|pr[eé]nd)/.test(palabra)) return { accion: "publicar", id, nota };
  return { accion: "aprobar", id, nota };
}

// "ok 7" / "ok 7 perfecto" = va tal cual. "ok 7 pero quita el precio" = va CON un cambio: no se
// envía algo que nadie vio en su versión final, Max lo ajusta y lo vuelve a subir.
export function okConCambio(nota: string): boolean {
  const n = String(nota ?? "").trim();
  if (!n) return false;
  if (/^(gracias|perfecto|excelente|brutal|bien|buen[oa]|great|nice|👍|🔥|💯|✅)[\s!.👍🔥💯✅]*$/i.test(n)) return false;
  return /[a-záéíóúñ]{3,}.*\s.*[a-záéíóúñ]{3,}/i.test(n);
}

// Quién puede decidir: Elvin y Carilin (ids de Slack). MAX_APROBADORES = "Uxxx=elvin,Uyyy=carilin".
export function aprobadores(env: string | undefined, ceo: string): Record<string, string> {
  const mapa: Record<string, string> = { [ceo]: "elvin" };
  for (const par of String(env || "U07V7MVJ18B=carilin").split(",")) {
    const [id, nombre] = par.split("=").map((x) => x.trim());
    if (id && nombre) mapa[id] = nombre.toLowerCase();
  }
  return mapa;
}

// ¿La decisión aplica a este ítem? Devuelve el porqué si no.
export function validarDecision(
  d: Decision,
  item: { tipo: string; estado: string } | null,
): { ok: true } | { ok: false; motivo: string } {
  if (!item) return { ok: false, motivo: `No encuentro la #${d.id}.` };
  if (d.accion === "publicar") {
    if (item.tipo !== "publicar") return { ok: false, motivo: `La #${d.id} no es un pedido de publicar: "publica" solo sirve para las campañas que Max ya montó en borrador (él sube un 🚀 con su #id).` };
    if (item.estado !== "esperando") return { ok: false, motivo: `La #${d.id} ya está ${item.estado}.` };
    return { ok: true };
  }
  if (item.estado !== "esperando") return { ok: false, motivo: `La #${d.id} ya está ${item.estado}.` };
  return { ok: true };
}

// Mensaje que llega a #max-aprobaciones. Corto arriba (qué, para quién, cómo decidir) y el
// contenido completo abajo, igual a lo que verá el cliente si va al cliente.
export function textoAprobacion(i: { id: number; tipo: TipoItem; cliente: string; titulo: string; contenido: string; nota?: string }): string {
  const etiqueta: Record<TipoItem, string> = {
    mensaje: "💬 Respuesta al cliente",
    plan: "🧭 Plan de marketing",
    creativos: "🎨 Creativos",
    campana: "🧱 Montar campañas EN BORRADOR",
    publicar: "🚀 PUBLICAR campañas",
    interno: "📌 Para ustedes",
  };
  const como =
    i.tipo === "publicar"
      ? `👉 Para prenderlas: *publica ${i.id}*  ·  ✋ *no ${i.id} <por qué>*`
      : i.tipo === "campana"
        ? `👉 Para montarlas en borrador: *ok ${i.id}*  ·  ✋ *no ${i.id} <qué cambio>*`
        : VAN_AL_CLIENTE.includes(i.tipo)
          ? `👉 Para enviárselo al cliente tal cual: *ok ${i.id}*  ·  ✋ *no ${i.id} <qué cambio>*`
          : `👉 *ok ${i.id}* o *no ${i.id} <nota>*`;
  return [
    `*#${i.id} · ${etiqueta[i.tipo]} · ${i.cliente}*`,
    i.titulo ? `_${i.titulo}_` : "",
    i.nota ? `Contexto: ${i.nota}` : "",
    "",
    i.contenido,
    "",
    como,
  ]
    .filter((x, n) => x !== "" || n === 3 || n === 5)
    .join("\n")
    .slice(0, 39000);
}

// Lo que se publica en el canal del cliente: el contenido aprobado, sin ids ni notas internas.
export function textoParaCliente(contenido: string): string {
  return String(contenido ?? "")
    .replace(/^\s*\[(?:interno|nota interna)[^\]]*\][^\n]*\n?/gim, "")
    .trim()
    .slice(0, 39000);
}

// ¿Es alguien del equipo (no el cliente)? Los clientes entran a su canal como INVITADOS de Slack
// (single-channel guest: is_restricted / is_ultra_restricted; verificado con Biowest el 24/sep) y
// el equipo son miembros completos. Si no se sabe, se mira el dominio del correo.
export function esEquipo(u: { id: string; email?: string | null; esBot?: boolean; invitado?: boolean }, extra: string[] = [], dominios = ["levelupmediapr.net", "aiborinquen.com"]): boolean {
  if (u.esBot) return true;
  if (extra.includes(u.id)) return true;
  if (typeof u.invitado === "boolean") return !u.invitado;
  const dom = String(u.email || "").toLowerCase().split("@")[1] || "";
  return dominios.some((d) => dom === d || dom.endsWith("." + d));
}

export function slugCliente(nombre: string): string {
  return (
    String(nombre || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "cliente"
  );
}

// Encabezado de lo que le llega a Max por el buzón (el puente lo reconoce por el prefijo).
export function encabezadoBuzon(t: "cliente" | "aprobacion" | "equipo" | "onboarding", datos: Record<string, string | number | undefined>): string {
  const partes = Object.entries(datos)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k} ${v}`);
  const nombre = { cliente: "Slack cliente", aprobacion: "Max aprobación", equipo: "Max canal", onboarding: "Onboarding nuevo" }[t];
  return `[${nombre}${partes.length ? " · " + partes.join(" · ") : ""}]`;
}

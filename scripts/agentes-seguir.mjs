// Seguir el trabajo cuando otro agente responde (Elvin, 26/sep/2026).
//   "Nico le pide diseño a Lola… y no se pueden entre ellos, la lógica entre ellos no se están entendiendo muy
//    bien… después que las hace como que no las termina. Hay que agregar esa autonomía de ellos."
// Antes, la respuesta de otro agente solo quedaba como contexto para el PRÓXIMO pedido y el trabajo moría ahí
// (26/sep: Nico le preguntó a Lola por el leaderboard de Aure, Lola contestó en 2 min y nadie le cerró a Aure;
// 24/sep: la tanda 2 de ISLA quedó "esperando OK" sin dueño). Ahora cada pedido entre agentes lleva la marca
// ⟳ SEGUIR con el ORIGEN del trabajo (quién lo pidió de verdad) y la respuesta despierta al que pidió para que
// lo termine y se lo entregue a ese origen. La profundidad corta cadenas largas (A→B→C→A…).
// Puro: lo usan scripts/agentes.mjs (al mandar) y scripts/telegram-puente.mjs (al recibir). Tests:
// tests/agentes-seguir.test.mjs.

export const PROFUNDIDAD_MAX = 3;
const TIPOS = new Set(["telegram", "buzon", "solicitud", "aprobada", "slack"]);
const RE = /\n*⟳ SEGUIR \[(telegram|buzon|solicitud|aprobada|slack)(?::(\d+):([a-z]+))?·(\d+)\][^\n]*/;

// origen = lo que el puente le pasa a Claude en AGENTE_ORIGEN: "telegram" | "slack" | "buzon:<id>:<de>" |
// "solicitud:<id>:<de>" | "aprobada:<id>:<de>", con "·<n>" = cuántas continuaciones lleva la cadena.
export function parsearOrigen(origen) {
  const m = String(origen || "").trim().match(/^(telegram|buzon|solicitud|aprobada|slack)(?::(\d+):([a-z]+))?(?:·(\d+))?$/);
  if (!m || !TIPOS.has(m[1])) return null;
  return { tipo: m[1], id: m[2] ? Number(m[2]) : null, de: m[3] || null, n: Number(m[4] || 0) };
}
export function origenTexto(o) {
  return `${o.tipo}${o.id ? `:${o.id}:${o.de}` : ""}·${o.n || 0}`;
}

// La marca que va al final del pedido. "" si no hay origen (p. ej. un script en la Mac) o la cadena ya es larga.
export function marcaSeguir(origen, quien = "") {
  const o = parsearOrigen(origen);
  if (!o || o.n >= PROFUNDIDAD_MAX) return "";
  return `\n\n⟳ SEGUIR [${origenTexto(o)}] — cuando respondas, ${quien || "quien te pidió esto"} retoma y termina su trabajo: responde con el resultado completo (links, ids), no con "listo".`;
}

export function leerSeguir(texto) {
  const m = String(texto || "").match(RE);
  if (!m) return null;
  return { tipo: m[1], id: m[2] ? Number(m[2]) : null, de: m[3] || null, n: Number(m[4] || 0), origen: `${m[1]}${m[2] ? `:${m[2]}:${m[3]}` : ""}·${m[4]}` };
}
export function quitarMarca(texto) {
  return String(texto || "").replace(RE, "").trim();
}

// El AGENTE_ORIGEN de la corrida de continuación: el mismo origen, un paso más hondo.
export function origenSiguiente(seg) {
  return origenTexto({ ...seg, n: (seg.n || 0) + 1 });
}

// Tope diario de continuaciones por agente (red de seguridad contra ping-pong).
export function cupoContinuar(estado, dia, max = 20) {
  const e = estado && estado.dia === dia ? estado : { dia, n: 0 };
  if (e.n >= max) return { ok: false, estado: e };
  return { ok: true, estado: { dia, n: e.n + 1 } };
}

// ¿Esta corrida le pidió algo a otro agente (con seguimiento)? Se lee de los comandos Bash que corrió Claude.
export function delegadoEn(comando) {
  const m = String(comando || "").match(/agentes\.mjs\s+mensaje\s+(sofi|nico|max|lola)\b/);
  if (!m || /--sin-seguir/.test(comando)) return null;
  return m[1];
}

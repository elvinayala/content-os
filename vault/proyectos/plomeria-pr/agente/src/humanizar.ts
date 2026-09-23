/**
 * Humanizador de WhatsApp (22/sep/2026, pedido de Elvin: "si suenas robot, a guion, va a salir mal").
 * El modelo escribe limpio; aquí se le quita el acabado de plantilla ANTES de enviar:
 *  - sin "¡" de apertura (casi nadie lo escribe en WhatsApp) y a veces sin "¿"
 *  - minúscula al empezar cuando la primera palabra es común (nunca un nombre propio)
 *  - sin punto final la mayoría de las veces
 *  - UN solo error leve de acento en toda la conversación, en el 3er o 4to mensaje
 * Nunca toca números, precios, horas, links ni correos: solo palabras de una lista cerrada.
 * Determinista (semilla = contacto + número de mensaje) para que se pueda probar.
 */

function hash(s: string): number { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const azar = (semilla: string) => (hash(semilla) % 1000) / 1000; // [0,1)

// Primeras palabras que se pueden poner en minúscula sin que parezca error de nombre propio.
const COMUNES = new Set(["hola", "perfecto", "dale", "ok", "claro", "buenas", "gracias", "excelente", "bien", "mira", "te", "tu", "ya", "entonces", "eso", "y", "para", "que", "cuéntame", "cuentame", "listo", "genial", "súper", "super", "bueno", "brutal", "entendido", "oye", "sí", "si", "no", "me", "lo", "la", "el", "ahora", "cuando", "tienes", "estamos", "somos", "nosotros", "buscamos", "vamos", "déjame", "dejame", "anotado", "chévere", "chevere", "exacto"]);
// Errores leves y creíbles: quitar la tilde. Una sola vez por conversación.
const SIN_TILDE: [RegExp, string][] = [[/\btambién\b/, "tambien"], [/\bdespués\b/, "despues"], [/\baquí\b/, "aqui"], [/\bahí\b/, "ahi"], [/\bmás\b/, "mas"], [/\basí\b/, "asi"], [/\bdías\b/, "dias"], [/\bteléfono\b/, "telefono"], [/\bplomería\b/, "plomeria"], [/\bcuéntame\b/, "cuentame"], [/\bvehículo\b/, "vehiculo"], [/\blicencia\b/, "lisencia"]];

/** Índice del mensaje en la conversación: 1 = primer mensaje nuestro. */
export function humanizar(texto: string, indice: number, contactoId: string): string {
  let t = String(texto ?? "").trim();
  if (!t || /https?:\/\//.test(t) && t.length < 40) return t; // un link solo se deja tal cual
  const s = (k: string) => azar(`${contactoId}:${indice}:${k}`);

  t = t.replace(/(^|\n)\s*¡/g, "$1").replace(/ ¡/g, " ");                 // fuera los ¡ de apertura
  if (s("abre?") < 0.5) t = t.replace(/(^|\n|\. )¿/g, "$1");              // a veces fuera el ¿
  // Minúscula al empezar (y al empezar cada párrafo) si la palabra es común.
  t = t.replace(/(^|\n)([A-ZÁÉÍÓÚÑ])([a-záéíóúñü]*)/g, (m, pre, ini, resto) => {
    const palabra = (ini + resto).toLowerCase();
    return COMUNES.has(palabra) && s("min:" + palabra) < 0.75 ? pre + palabra : m;
  });
  // Sin punto final la mayoría de las veces (nunca se tocan "?" ni "!").
  if (/[^.]\.$/.test(t) && s("punto") < 0.7) t = t.slice(0, -1);
  // El error leve: en el mensaje 3 o 4 (se elige por contacto), una sola tilde menos.
  const cual = 3 + (hash(contactoId) % 2);
  if (indice === cual) {
    for (const [re, sin] of SIN_TILDE) if (re.test(t)) { t = t.replace(re, sin); break; }
  }
  return t;
}

// Avisos de Slack → notificación push (puro; tests en tests/push.test.mjs).
// Los avisos de Ritmo se escriben en el formato de Slack (*negrita*, <url|texto>, &lt; escapado). En el teléfono
// eso se ve como basura: aquí se convierte en título + texto plano y el primer link de Ritmo pasa a ser el destino.

export interface AvisoPush {
  titulo: string;
  texto: string;
  url: string; // ruta relativa dentro de la app (/ritmo/…)
  tag: string; // agrupa: un aviso nuevo del mismo tipo reemplaza al anterior en la pantalla
}

const MAX_TITULO = 60;
const MAX_TEXTO = 180;

const desescapar = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Quita el formato de Slack: links a su texto, negritas/cursivas/tachado y espacios de más. */
export function textoPlano(s: string): string {
  return desescapar(
    s
      .replace(/<([^<>|]+)\|([^<>]+)>/g, "$2") // <url|texto> → texto
      .replace(/<(https?:[^<>]+)>/g, "") // <url> suelto → nada
      .replace(/<[!@#][^<>]*>/g, "") // menciones/canales
      .replace(/(^|[\s(“"])[*_~]+(\S[^*_~\n]*?\S|\S)[*_~]+(?=[\s.,:;!?)”"]|$)/g, "$1$2"),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

/** Primer link del aviso convertido en ruta de la app (solo si es de /ritmo; lo demás abre Hoy). */
export function destino(s: string, porDefecto = "/ritmo"): string {
  for (const m of s.matchAll(/<(https?:\/\/[^<>|]+|\/[^<>|]*)(?:\|[^<>]*)?>/g)) {
    let ruta: string;
    try {
      const u = new URL(desescapar(m[1]), "https://app.local");
      ruta = u.pathname + u.search;
    } catch {
      continue;
    }
    if (ruta === "/ritmo" || ruta.startsWith("/ritmo/") || ruta.startsWith("/ritmo?")) return ruta;
  }
  return porDefecto;
}

const cortar = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Aviso de Slack → notificación. Si la primera línea va en negrita es el título; si no, el título es "Ritmo". */
export function avisoDesdeSlack(slack: string, app = "Ritmo"): AvisoPush {
  const lineas = slack.split("\n");
  const primera = lineas[0]?.trim() ?? "";
  const esTitulo = lineas.length > 1 && /^\*[^*]+\*/.test(primera);
  const titulo = esTitulo ? textoPlano(primera) : app;
  const cuerpo = textoPlano(esTitulo ? lineas.slice(1).join("\n") : slack) || textoPlano(slack);
  const url = destino(slack);
  const seccion = url.split(/[/?#]/)[2] || "hoy";
  return { titulo: cortar(titulo, MAX_TITULO), texto: cortar(cuerpo, MAX_TEXTO), url, tag: `${app.toLowerCase()}-${seccion}` };
}

/** Nombre corto del dispositivo para la lista de "Mis teléfonos" (sin guardar el user agent completo). */
export function nombreDispositivo(ua: string, instalada: boolean): string {
  const so = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Macintosh/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "Otro";
  const nav = /EdgA?\//.test(ua) ? "Edge" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "navegador";
  return instalada ? `${so} · app instalada` : `${so} · ${nav}`;
}

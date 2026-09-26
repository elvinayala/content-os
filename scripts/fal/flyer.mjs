// La guía de flyers de Elvin para Lola y Max (26/sep/2026), sobre la de Bori en producción (server.js → /api/image).
//   Elvin: "flyers de calidad, de pocas palabras: un título, bullets con los beneficios, call to action claro, que
//   resalte el producto. Minimalista, elegante, siempre con calidad. Nano Banana Pro."
// Puro (sin red): lo usa scripts/fal.mjs flyer y lo prueba tests/fal-flyer.test.mjs.

const ORIGEN = (process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");

// Kit por marca. Los logos son URLs públicas (public/marcas/ en Content OS) para que fal los use como referencia
// desde cualquier lado — la Mac o Railway —. Marca sin logo aquí = el arte sale SIN logo (nunca uno inventado).
export const MARCAS = {
  "level-up": {
    nombre: "Level Up Media",
    logo: { oscuro: `${ORIGEN}/marcas/level-up-logo-dark.png`, claro: `${ORIGEN}/marcas/level-up-logo-light.png` },
    fondo: "oscuro",
    paleta: "deep black (#0B0B0B) background, warm off-white (#F5F1E8) text and the signature gold-yellow (#F5CE1A) only for accents and the call-to-action button",
    tipo: "servicio",
  },
  "ai-borinquen": {
    nombre: "AI Borinquen",
    logo: { oscuro: `${ORIGEN}/marcas/ai-borinquen-logo-dark.png` },
    fondo: "oscuro",
    paleta: "deep green-black (#050E0A) background, soft white (#E8F3EC) text, neon green (#2BFF88) for accents and the call-to-action button, teal (#1FB6A6) as a secondary accent",
    tipo: "servicio",
  },
  bori: {
    nombre: "Bori",
    logo: { oscuro: `${ORIGEN}/marcas/bori/logo.png`, claro: `${ORIGEN}/marcas/bori/logo.png` },
    fondo: "oscuro",
    paleta: "forest-black (#07160F) background, soft white (#EAF5EE) text, brand green (#35C06F) with a teal (#1FB6A6) to light-green (#7BE08A) gradient for accents and the call-to-action button; copper (#B8733A) and gold (#E0A93C) only as tiny details. Clean modern geometric sans-serif typography (Onest-like)",
    tipo: "servicio",
  },
  resuelto: {
    nombre: "Resuelto",
    logo: { claro: `${ORIGEN}/marcas/resuelto/logo-azul.png`, oscuro: `${ORIGEN}/marcas/resuelto/logo-blanco.png` },
    fondo: "claro",
    paleta: "cream (#FBF7F0) background, deep Caribbean blue (#0F3D5E) for the headline and main shapes, flamboyán orange (#F2621F) ONLY for the call-to-action button and check marks, gray (#5C6670) for secondary text",
    tipo: "servicio",
  },
  "isla-run": {
    nombre: "ISLA Run Series",
    logo: null, // el logo de ISLA aún no está aprobado: va sin logo
    fondo: "oscuro",
    paleta: "black and white base with full-bleed sports photography (ASICS / Nike Running style), salina pink (#E0566F) as the only accent color; bold condensed uppercase typography",
    tipo: "servicio",
  },
};

export function marca(slug) {
  const s = String(slug || "").toLowerCase().trim().replace(/\s+/g, "-");
  const alias = { levelup: "level-up", lu: "level-up", aib: "ai-borinquen", "ai-borinquen": "ai-borinquen", borinquen: "ai-borinquen", isla: "isla-run", "isla-run-series": "isla-run", plomeria: "resuelto", "resuelto-pr": "resuelto" };
  return MARCAS[alias[s] || s] ? { slug: alias[s] || s, ...MARCAS[alias[s] || s] } : null;
}

// El logo que toca según el fondo del flyer (claro u oscuro). null si la marca no tiene.
export function logoPara(m, fondo) {
  if (!m?.logo) return null;
  return m.logo[fondo] || m.logo.oscuro || m.logo.claro || null;
}

const palabras = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
const limpio = (t) => String(t || "").replace(/["“”]/g, "").replace(/\s+/g, " ").trim();

// Reglas del copy ANTES de gastar un crédito. errores = no se genera; avisos = se genera pero se dice.
export function validarCopy({ titulo, bullets = [], cta }) {
  const errores = [], avisos = [];
  if (!limpio(titulo)) errores.push("falta el título");
  if (palabras(titulo) > 8) errores.push(`el título tiene ${palabras(titulo)} palabras (máx. 8): pocas palabras`);
  if (bullets.length > 3) errores.push(`son ${bullets.length} bullets (máx. 3)`);
  bullets.forEach((b, i) => { if (palabras(b) > 6) errores.push(`el bullet ${i + 1} tiene ${palabras(b)} palabras (máx. 6)`); });
  if (!limpio(cta)) errores.push("falta el CTA");
  if (palabras(cta) > 4) errores.push(`el CTA tiene ${palabras(cta)} palabras (máx. 4)`);
  const todo = [titulo, ...bullets, cta].join(" ");
  if (/\bgratis\b|\bfree\b/i.test(todo)) errores.push("'gratis' no va en ningún flyer (regla de Elvin)");
  if (/\b(vos|tenés|querés|podés|sabés|hacés|escribinos|contactanos|agendá|reservá)(?![\p{L}])/iu.test(todo)) errores.push("voseo: tuteo de Puerto Rico (tú/tienes/escríbenos), nunca vos/tenés/escribinos");
  if (/\b(gana|ganar[aá]s|ganes)\b[^.]*\$\s?\d|\$\s?\d[\d,.]*\s*(al|por)\s*(mes|d[ií]a|semana)/i.test(todo)) errores.push("promesa de ingresos: Meta la rechaza (los números van como caso de un cliente, no en el flyer)");
  if (/\$\s?\d|\d+\s?%/.test(bullets.join(" ") + " " + cta)) avisos.push("hay precio o porcentaje fuera del título: úsalo solo si Elvin lo dio exacto");
  return { ok: errores.length === 0, errores, avisos };
}

// El prompt para Nano Banana Pro. El texto del flyer va EXACTO en español; las instrucciones en inglés (el modelo
// las sigue mejor). Referencias: primero las fotos reales (producto/lugar/persona), el logo SIEMPRE la última.
export function promptFlyer({ marca: m, titulo, bullets = [], cta, producto, tipo, fondo, conFotos = false, conLogo = false, extra = "" }) {
  const esServicio = (tipo || m?.tipo || "servicio") === "servicio";
  const tono = fondo || m?.fondo || "oscuro";
  const head = limpio(titulo).slice(0, 80);
  const call = limpio(cta).slice(0, 28);
  const bs = bullets.map(limpio).filter(Boolean).slice(0, 3);
  const escena = limpio(producto) || (esServicio ? "the service being delivered or its happy result, in a real-life context" : "the product");
  const heroe = conFotos
    ? `The hero is the REAL ${esServicio ? "scene/people/result" : "product"} from the reference photo${conLogo ? "s (all references except the last one)" : "(s)"}: keep it authentic, recognizable and unchanged, just beautifully lit and composed`
    : `The hero is ${escena}, ${esServicio ? "a striking real-life photographic moment (people, place, result — never an invented physical product)" : "shown as a premium product shot"}`;
  const lista = bs.length
    ? ` Below or beside the hero, a short list of ${bs.length} benefit bullet${bs.length > 1 ? "s" : ""}, each with a small minimal check or icon, set in a clean smaller weight, reading EXACTLY: ${bs.map((b) => `"${b}"`).join(", ")}.`
    : "";
  const textoPermitido = [head, ...bs, call].map((t) => `"${t}"`).join(", ");
  return [
    `Premium, minimalist and elegant advertising flyer / social-media ad in the style of a top global brand (${esServicio ? "high-end professional services" : "Apple-style product"} ad). Quality over everything: sophisticated art direction, lots of negative space, professional lighting, crisp and photorealistic.`,
    `${heroe}; it must stand out clearly and be the focus of the design.`,
    `Clear hierarchy: ONE big bold headline at the top that reads EXACTLY "${head}".${lista} A single prominent high-contrast call-to-action button near the bottom that reads EXACTLY "${call}".`,
    `The ONLY text allowed on the flyer is: ${textoPermitido}${conLogo ? " (plus the logo graphic)" : ""}. All text is in Spanish and must be spelled EXACTLY as given, including accents (á é í ó ú ñ ¿ ¡). Do NOT add any other words, taglines, prices, dollar amounts, percentages, discounts, offers, "free"/"gratis", phone numbers, websites, dates or fine print.`,
    `Typography: TOP-TIER and expensive — a striking, characterful display typeface for the headline with refined kerning and an elegant premium pairing for the bullets; absolutely NOT generic or default fonts. Few words, big breathing room, perfectly legible on a phone.`,
    m?.paleta ? `Brand palette (${m.nombre}): ${m.paleta}. ${tono === "claro" ? "Light" : "Dark"} background.` : `${tono === "claro" ? "Light, airy" : "Dark, rich"} background with one accent color for the button.`,
    conLogo ? `The LAST reference image is the brand logo: include this exact logo EXACTLY as provided — do NOT redraw, restyle, recolor or distort it — small and discreet in a top corner. Never invent a different logo or wordmark.` : `Do NOT include any logo, brand mark or wordmark.`,
    `Avoid clutter, busy backgrounds, stickers, emojis and extra decorative text. Designed to convert.`,
    extra ? `Extra creative direction, follow it closely: ${limpio(extra).slice(0, 400)}.` : "",
  ].filter(Boolean).join(" ");
}

// Todo lo que fal necesita: prompt + referencias (fotos primero, logo al final) + modelo (con refs = edición).
// logo = URL del logo real de un cliente (Max: el de su expediente/Drive) — pisa el del kit.
export function armarFlyer({ marca: slug, titulo, bullets, cta, producto, tipo, fondo, fotos = [], logo: logoCliente = "", sinLogo = false, extra = "" }) {
  const m = marca(slug);
  const lista = Array.isArray(bullets) ? bullets : String(bullets || "").split("|");
  const bs = lista.map(limpio).filter(Boolean);
  const v = validarCopy({ titulo, bullets: bs, cta });
  const tono = fondo || m?.fondo || "oscuro";
  const logo = sinLogo ? null : /^https:\/\//.test(logoCliente || "") ? logoCliente : logoPara(m, tono);
  const fotosOk = fotos.filter((u) => /^https:\/\//.test(u)).slice(0, 4);
  const refs = [...fotosOk, ...(logo ? [logo] : [])];
  const prompt = promptFlyer({ marca: m, titulo, bullets: bs, cta, producto, tipo, fondo: tono, conFotos: fotosOk.length > 0, conLogo: Boolean(logo), extra });
  const avisos = [...v.avisos];
  if (slug && !m && !logo) avisos.push(`la marca "${slug}" no tiene kit en scripts/fal/flyer.mjs: sale sin logo ni paleta (pide el logo real con --logo <url>; nunca lo inventes)`);
  else if (m && !m.logo && !sinLogo) avisos.push(`${m.nombre} no tiene logo aprobado todavía: sale sin logo`);
  return { ...v, avisos, prompt, refs, marca: m, logo, bullets: bs };
}

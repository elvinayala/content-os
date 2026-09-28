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
    // Marca v2 (27/sep): coquí de circuitos + nombre claro, para fondo oscuro. vault/proyectos/ai-borinquen/marca/LEEME.md
    logo: { oscuro: `${ORIGEN}/marcas/ai-borinquen/lockup-horizontal-transparente.png` },
    fondo: "oscuro",
    paleta: "deep green-black (#050E0A) background, soft white (#E8F3EC) text, neon green (#2BFF88) for accents and the call-to-action button; brand green (#3C9A3F), blue (#1E6FD0) and red (#E63946) only as tiny details. Clean geometric typography (Outfit-like headline, Inter-like text)",
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
export function validarCopy({ titulo, bullets = [], cta, resaltar = "", oferta = "" }) {
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
  if (/\$\s?\d|\d+\s?%/.test(bullets.join(" ") + " " + cta)) avisos.push("hay precio o porcentaje en un bullet o el CTA: la oferta va en --oferta (su propia etiqueta), y solo si te la dieron exacta");
  // v2 (28/sep): la frase resaltada sale del título tal cual; la oferta es corta y es lo que te dieron.
  if (limpio(resaltar) && !limpio(titulo).toLowerCase().includes(limpio(resaltar).toLowerCase())) errores.push(`"${limpio(resaltar)}" no está en el título: la frase a resaltar tiene que salir del título tal cual`);
  if (limpio(resaltar) && palabras(resaltar) > 4) errores.push("resalta máximo 4 palabras del título (la frase que vende, no el título entero)");
  if (limpio(oferta) && palabras(oferta) > 5) errores.push(`la oferta tiene ${palabras(oferta)} palabras (máx. 5, ej. "Desde $899")`);
  if (limpio(oferta) && /\bgratis\b|\bfree\b/i.test(oferta)) errores.push("'gratis' no va en la oferta");
  return { ok: errores.length === 0, errores, avisos };
}

// El prompt para Nano Banana Pro. El texto del flyer va EXACTO en español; las instrucciones en inglés (el modelo
// las sigue mejor). Referencias: primero las fotos reales (producto/lugar/persona), el logo SIEMPRE la última.
// v2 (28/sep/2026, Elvin: "flyers de alto impacto, que vendan"): héroe a sangre completa (nada de foto en un
// recuadro, que se veía a plantilla), la frase clave del título en el color de acento, la oferta como etiqueta
// propia cuando el cliente la da, cero marcas ajenas (salió un BMW con su logo) y botón plano de la marca.
// layout: "hero" (foto a sangre con el texto en el espacio limpio) · "split" (texto a un lado, héroe al otro) ·
// "producto" (producto de estudio sobre fondo liso) · "auto" (el que mejor venda según el héroe).
export function promptFlyer({ marca: m, titulo, bullets = [], cta, producto, tipo, fondo, conFotos = false, conLogo = false, extra = "", resaltar = "", oferta = "", layout = "auto", ar = "4:5", acento: acentoPedido = "" }) {
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
  const clave = limpio(resaltar).slice(0, 60);
  const off = limpio(oferta).slice(0, 40);
  const textoPermitido = [head, ...bs, ...(off ? [off] : []), call].map((t) => `"${t}"`).join(", ");
  // Sin kit de marca el modelo no escogía acento: título sin resaltar y botón gris (prueba del 28/sep).
  const acentoTxt = limpio(acentoPedido).slice(0, 40);
  const acento = acentoTxt ? `the accent color ${acentoTxt}` : m?.paleta ? "the brand accent color" : "ONE vivid accent color taken from the hero (its most striking color), clearly different from the background";
  const LAYOUTS = {
    hero: "Layout: the hero photograph is FULL-BLEED and fills the whole canvas edge to edge; the headline sits on a naturally clean, darker or softer area of the photo (use a subtle gradient only if needed for legibility).",
    split: "Layout: an asymmetric split — the text block on one side over a clean area, the hero photo on the other side bleeding off the canvas edges (no box, no rounded corners, no card); the photo fades or blends softly into the text side so it all reads as one seamless image.",
    producto: "Layout: premium studio product shot — the product large and centered on a clean seamless solid or softly graded background, with a soft realistic shadow; text arranged around it with generous space.",
    auto: "Layout: pick the composition that sells best for this hero (full-bleed photo with text on its clean area, an asymmetric split, or a studio product shot on a seamless background).",
  };
  const vertical = /^9:16$/.test(String(ar));
  return [
    `The output image IS the flyer itself, filling the entire frame edge to edge — NOT a mockup, NOT a photo of a printed flyer, poster or screen, no margins, no drop shadow, no surface or wall around it.`,
    // v2.1: el texto como lista numerada ARRIBA. "Exactly ONCE": salió "Tus anuncios small vendiendo mientras mientras
    // duermes" (la escena en inglés se coló como texto y se repitió una palabra). Enterrado entre reglas, el modelo se saltaba la oferta y el resaltado.
    `TEXT ON THE FLYER — render exactly these ${2 + bs.length + (off ? 1 : 0)} elements and nothing else: ` +
      [`(1) HEADLINE: "${head}"${clave ? ` — the words "${clave}" in ${acento}, the rest in the main text color` : ""}`,
       ...(off ? [`(2) OFFER BADGE: "${off}" — a bold pill/badge in ${acento}, clearly visible`] : []),
       ...bs.map((b, i) => `(${(off ? 3 : 2) + i}) BENEFIT: "${b}" with a small check icon`),
       `(${(off ? 3 : 2) + bs.length}) BUTTON: "${call}" — solid ${acento} button`].join("; ") +
      ". Each element appears exactly ONCE, word for word: never repeat, reorder, translate or add words.",
    `Premium, minimalist and elegant advertising flyer / social-media ad in the style of a top global brand (${esServicio ? "high-end professional services" : "Apple-style product"} ad). Quality over everything: sophisticated art direction, lots of negative space, professional lighting, crisp and photorealistic.`,
    `SCENE (visual only — NEVER write any words from this scene description on the flyer): ${heroe}; it must stand out clearly and be the focus of the design.`,
    `${LAYOUTS[layout] || LAYOUTS.auto} NEVER place the photo inside a box, card, frame, border or rounded rectangle, and never split it with hard edges: it must feel integrated, like a luxury brand campaign, not a template.`,
    `Clear hierarchy: ONE big bold headline (max two lines) that reads EXACTLY "${head}"${clave ? `, where ONLY the words "${clave}" are set in ${acento} (the rest of the headline in the main text color) so the key phrase pops` : ""}.${lista}${off ? ` The offer is MANDATORY and must be clearly visible: a compact badge or pill in ${acento} placed near the headline or over the hero, reading EXACTLY "${off}".` : ""} A single prominent call-to-action button near the bottom that reads EXACTLY "${call}": a SOLID flat button in ${acento} with high-contrast text, clean rounded corners, no gradients, no glow, no 3D bevel.`,
    `Keep all text inside safe margins (at least 8% from every edge${vertical ? "; for this vertical story format keep the top 14% and the bottom 20% free of text" : ""}).`,
    `The ONLY text allowed on the flyer is: ${textoPermitido}${conLogo ? " (plus the logo graphic)" : ""}. All text is in Spanish and must be spelled EXACTLY as given, including accents (á é í ó ú ñ ¿ ¡). Do NOT add any other words, taglines, prices, dollar amounts, percentages, discounts, offers, "free"/"gratis", phone numbers, websites, dates or fine print.`,
    `Typography: TOP-TIER and expensive — a striking, characterful display typeface for the headline with refined kerning and an elegant premium pairing for the bullets; absolutely NOT generic or default fonts. Few words, big breathing room, perfectly legible on a phone.`,
    m?.paleta ? `Brand palette (${m.nombre}): ${m.paleta}. ${tono === "claro" ? "Light" : "Dark"} background.` : `${tono === "claro" ? "Light, airy" : "Dark, rich"} background with one accent color for the button.`,
    conLogo ? `The LAST reference image is the brand logo: include this exact logo EXACTLY as provided — do NOT redraw, restyle, recolor or distort it — small and discreet in a top corner. Never invent a different logo or wordmark.` : `Do NOT include any logo, brand mark or wordmark.`,
    `No third-party logos, brand badges, emblems or readable brand names anywhere: design any car, device or packaging as a generic, unbranded, clean model (smooth grille or surface, never a covered or blacked-out logo)${conFotos ? ", except the client's own product exactly as it appears in the reference photos" : ""}.`,
    `Avoid clutter, busy backgrounds, stickers, emojis and extra decorative text. Designed to stop the scroll and convert: one focal point, instant readability in under 2 seconds.`,
    extra ? `Extra creative direction, follow it closely: ${limpio(extra).slice(0, 400)}.` : "",
  ].filter(Boolean).join(" ");
}

// Todo lo que fal necesita: prompt + referencias (fotos primero, logo al final) + modelo (con refs = edición).
// logo = URL del logo real de un cliente (Max: el de su expediente/Drive) — pisa el del kit.
export function armarFlyer({ marca: slug, titulo, bullets, cta, producto, tipo, fondo, fotos = [], logo: logoCliente = "", sinLogo = false, extra = "", resaltar = "", oferta = "", layout = "auto", ar = "4:5", acento = "" }) {
  const m = marca(slug);
  const lista = Array.isArray(bullets) ? bullets : String(bullets || "").split("|");
  const bs = lista.map(limpio).filter(Boolean);
  const v = validarCopy({ titulo, bullets: bs, cta, resaltar, oferta });
  const tono = fondo || m?.fondo || "oscuro";
  const logo = sinLogo ? null : /^https:\/\//.test(logoCliente || "") ? logoCliente : logoPara(m, tono);
  const fotosOk = fotos.filter((u) => /^https:\/\//.test(u)).slice(0, 4);
  const refs = [...fotosOk, ...(logo ? [logo] : [])];
  const prompt = promptFlyer({ marca: m, titulo, bullets: bs, cta, producto, tipo, fondo: tono, conFotos: fotosOk.length > 0, conLogo: Boolean(logo), extra, resaltar, oferta, layout, ar, acento });
  const avisos = [...v.avisos];
  if (slug && !m && !logo) avisos.push(`la marca "${slug}" no tiene kit en scripts/fal/flyer.mjs: sale sin logo ni paleta (pide el logo real con --logo <url>; nunca lo inventes)`);
  else if (m && !m.logo && !sinLogo) avisos.push(`${m.nombre} no tiene logo aprobado todavía: sale sin logo`);
  return { ...v, avisos, prompt, refs, marca: m, logo, bullets: bs };
}

#!/usr/bin/env node
// Guarda de voz del ecosistema. Revisa que NADA infrinja las reglas duras:
//
//   1. VOSEO argentino — prohibido en todo (contenido, estilo, prompts).
//   2. Frases prohibidas de AI Borinquen ("revolucione su empresa con IA",
//      promesas de ingresos garantizados).
//   3. "gratis" en los CTA (regla de Elvin).
//
// Revisa DOS capas, porque el bug real es que un archivo de estilo con voseo
// contamina en silencio todo lo que la fábrica genera después:
//   · vault/estilo/*.md y vault/ceo/*.md  → la FUENTE
//   · data/entregas.json                  → la SALIDA
//
// Uso:  node scripts/validar-voz.mjs          (reporta)
//       node scripts/validar-voz.mjs --ci     (además sale con código 1)

import { promises as fs } from "fs";
import path from "path";

const RAIZ = path.join(import.meta.dirname, "..");
const CI = process.argv.includes("--ci");

// Voseo: lookaround unicode para no marcar falsos positivos como "proceSOS"
// o "reSPONDES". Solo formas verbales/pronominales rioplatenses reales.
const VOSEO = new RegExp(
  "(?<![a-záéíóúüñ])(" +
    [
      "vos", "sos", "tenés", "tenes", "querés", "queres", "podés", "podes",
      "sabés", "sabeś", "hacés", "haceś", "decís", "venís", "vivís",
      "mirá", "comentá", "escribí", "hacé", "fijate", "acordate", "dale que",
      "andá", "poné", "pensá", "buscá", "probá", "guardá", "usá", "armá",
      "dependés", "respondés", "necesitás", "trabajás", "empezá", "sumá",
      "tomá", "dejá", "llevá", "contá", "revisá", "aprovechá", "elegí",
    ].join("|") +
    ")(?![a-záéíóúüñ])",
  "giu",
);

const PROHIBIDAS = [
  { rx: /revolucion[ae]\s+(su|tu)\s+(empresa|negocio)/i, que: "«revolucione su empresa» (prohibida en AIB)" },
  { rx: /resultados?\s+garantizad[oa]s?/i, que: "promesa de resultados garantizados" },
  { rx: /(ingresos|ganancias)\s+garantizad[oa]s?/i, que: "promesa de ingresos garantizados" },
];

// "gratis" solo se marca cuando aparece en un CTA (no en prosa explicativa).
const CTA_GRATIS = /(?:\*\*CTA\*\*|CTA:|Comenta\s+[A-ZÁÉÍÓÚÑ]{3,})[^\n]{0,160}\bgratis\b/i;

async function listar(dir, ext = ".md") {
  try {
    const e = await fs.readdir(path.join(RAIZ, dir), { withFileTypes: true });
    return e.filter((x) => x.isFile() && x.name.endsWith(ext)).map((x) => `${dir}/${x.name}`);
  } catch {
    return [];
  }
}

function revisar(texto, etiqueta, hallazgos) {
  const voseo = texto.match(VOSEO);
  if (voseo) {
    hallazgos.push({
      donde: etiqueta,
      tipo: "VOSEO",
      detalle: [...new Set(voseo.map((v) => v.toLowerCase()))].join(", "),
    });
  }
  for (const p of PROHIBIDAS) {
    const m = texto.match(p.rx);
    // Ojo: la propia REGLA menciona la frase ("nunca prometer ingresos
    // garantizados"). Eso es la guarda, no la infracción — se ignora si viene
    // precedida de una negación cercana.
    if (m) {
      const antes = texto.slice(Math.max(0, m.index - 60), m.index).toLowerCase();
      if (/\b(nunca|no|sin|jam[áa]s|prohibid|evita[r]?)\b[^.]*$/.test(antes)) continue;
      hallazgos.push({ donde: etiqueta, tipo: "FRASE", detalle: `${p.que} → "${m[0]}"` });
    }
  }
  const g = texto.match(CTA_GRATIS);
  if (g) hallazgos.push({ donde: etiqueta, tipo: "GRATIS-CTA", detalle: g[0].slice(0, 90) });
}

const hallazgos = [];

// ---- capa 1: las FUENTES (estilo y cerebro) ----
const fuentes = [
  ...(await listar("vault/estilo")),
  ...(await listar("vault/ceo")),
  ...(await listar("vault/mentorias")),
];
for (const f of fuentes) {
  const txt = await fs.readFile(path.join(RAIZ, f), "utf-8");
  // Hay voseo LEGÍTIMO en el vault: la regla misma lista las palabras
  // prohibidas, y las citas de mentores argentinos van textuales. Se salta un
  // bloque completo desde la línea que declara la regla hasta la línea en
  // blanco siguiente — si no, la continuación del párrafo se marca sola.
  const lineas = txt.split("\n");
  const limpio = [];
  let enRegla = false;
  for (const l of lineas) {
    if (/adapt[áa]|voseo|NUNCA|prohibid|no decir|mentores argentinos|rioplatense/i.test(l)) {
      enRegla = true;
      continue;
    }
    if (enRegla) {
      if (l.trim() === "") enRegla = false; // fin del bloque de la regla
      continue;
    }
    limpio.push(l);
  }
  revisar(limpio.join("\n"), f, hallazgos);
}

// ---- capa 2: la SALIDA (lo que se le manda a la gente) ----
let entregasRevisadas = 0;
try {
  const data = JSON.parse(await fs.readFile(path.join(RAIZ, "data/entregas.json"), "utf-8"));
  for (const e of data.entregas ?? []) {
    if (e.estado === "descartado") continue;
    entregasRevisadas++;
    revisar(`${e.titulo}\n${e.contenido}`, `entrega ${e.id} · ${e.marca}`, hallazgos);
  }
} catch {}

// ---- reporte ----
console.log(`Fuentes revisadas : ${fuentes.length} archivos del vault`);
console.log(`Entregas revisadas: ${entregasRevisadas} piezas vigentes\n`);

if (hallazgos.length === 0) {
  console.log("✅ Sin infracciones de voz.");
  process.exit(0);
}

const porTipo = {};
for (const h of hallazgos) (porTipo[h.tipo] ??= []).push(h);
for (const [tipo, lista] of Object.entries(porTipo)) {
  console.log(`\n⚠️  ${tipo} — ${lista.length}`);
  for (const h of lista.slice(0, 25)) console.log(`   ${h.donde}\n     ${h.detalle}`);
  if (lista.length > 25) console.log(`   … y ${lista.length - 25} más`);
}
console.log(`\nTotal: ${hallazgos.length} infracciones.`);
if (CI) process.exit(1);

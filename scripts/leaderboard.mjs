#!/usr/bin/env node
// Leaderboard de Level Up (Aure #50–#66) — vista previa local de las imágenes.
//   node scripts/leaderboard.mjs prueba [dir]        → con el ejemplo de junio (sin hoja), deja closer.png y setter.png
//   node scripts/leaderboard.mjs hoja <archivo.csv> [dir] → con un CSV exportado de la hoja
// Lo que corre solo (L–S 7 AM y 3 PM) es /api/cron/leaderboard en Vercel; este script es para mirar el diseño.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og.js";

import { leaderboard, ANCHO, ALTO, fuentes } from "../lib/leaderboard/imagen.ts";
import { armarCloser, armarSetter, mesPR } from "../lib/leaderboard/reglas.ts";
import { parseCsv } from "../lib/sheets.ts";

const [cmd, a1, a2] = process.argv.slice(2);

const JUNIO = [
  ["", "New Sales", "$37,834.00"], ["", "Paying Off Debt", "$42,723.00"], ["", "Totals", "$80,557.00"], [],
  ["", "Closer", "Total recaudado por Closer"],
  ["", "Carilin Sofía", "$19,994.00"], ["", "Carilin Sofía PDC", "$9,729.00"], ["", "Laura Bernal", "$12,000.00"],
  ["", "Juan David Ramirez", "$8,550.00"], ["", "Juan David PDC", "$3,000.00"], ["", "Juan David BORI", "$996.00"],
  ["", "Roger Arteaga", "$14,500.00"], ["", "Roger Arteaga BORI", "$249.00"], ["", "Valentina Contreras", "$1,500.00"],
  ["", "Valentina Contreras PDC", "$2,250.00"], ["", "Valentina BORI", "$39.00"], ["", "Totales", "$72,807.00"], [],
  ["", "Setter", "Total recaudado por setter"],
  ["", "Ana Cecilio", "$29,249.00"], ["", "Dilan Torres", "$1,000.00"], ["", "Luis Fernandez", ""], ["", "Joaquin La Valle", ""],
  ["", "Inactive Setter", "$6,938.00"],
];

async function png(nodo) {
  const r = new ImageResponse(nodo, { width: ANCHO, height: ALTO, fonts: await fuentes() });
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  let filas;
  let dir;
  if (cmd === "prueba") { filas = JUNIO; dir = a1 ?? "/tmp/leaderboard"; }
  else if (cmd === "hoja" && a1) { filas = parseCsv(await readFile(a1, "utf8")); dir = a2 ?? "/tmp/leaderboard"; }
  else { console.log("Uso: node scripts/leaderboard.mjs prueba [dir] | hoja <archivo.csv> [dir]"); process.exit(1); }
  await mkdir(dir, { recursive: true });
  const mes = cmd === "prueba" ? "JUNE" : mesPR();
  const c = armarCloser(filas);
  const s = armarSetter(filas);
  for (const [tipo, r] of [["closer", c], ["setter", s]]) {
    if (r.errores.length) { console.log(`✖ ${tipo}: no se genera —\n  - ${r.errores.join("\n  - ")}`); continue; }
    const archivo = path.join(dir, `${tipo}.png`);
    await writeFile(archivo, await png(await leaderboard({ tipo, mes, total: r.total, podio: r.podio, abajo: r.abajo })));
    console.log(`✔ ${archivo}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

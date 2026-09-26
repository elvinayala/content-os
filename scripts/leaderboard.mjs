#!/usr/bin/env node
// Leaderboard de Level Up (Aure #50–#66) — vista previa local de las imágenes.
//   node scripts/leaderboard.mjs prueba [dir]        → con el ejemplo de junio (sin hoja), deja closer.png y setter.png
//   node scripts/leaderboard.mjs hoja <archivo.csv> [dir] → con un CSV exportado de la hoja
// Lo que corre solo (L–S 7 AM y 3 PM) es /api/cron/leaderboard en Vercel; este script es para mirar el diseño.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og.js";

import { leaderboard, ANCHO, ALTO, fuentes } from "../lib/leaderboard/imagen.ts";
import { JUNIO } from "../lib/leaderboard/ejemplo.ts";
import { armarCloser, armarSetter, mesPR } from "../lib/leaderboard/reglas.ts";
import { parseCsv } from "../lib/sheets.ts";

const [cmd, a1, a2] = process.argv.slice(2);


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

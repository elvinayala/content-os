#!/usr/bin/env node
// Hoja de contacto de un anuncio de la fábrica: 1 fotograma por escena (al 75 % de cada una),
// sacado del MP4 ya renderizado. Uso: node scripts/hoja.mjs <id> [mp4] → out/stills/hoja-<id>.png
import { execFileSync } from "node:child_process";
import fs from "node:fs";
const [, , id, mp4Arg] = process.argv;
const src = fs.readFileSync(new URL("../src/fabrica/anuncios.ts", import.meta.url), "utf8");
const bloque = src.slice(src.indexOf(`id: "${id}"`));
const escenas = bloque.slice(0, bloque.indexOf("\n  },\n")).match(/dur: (\d+)/g).map((m) => +m.slice(5));
let t = 0;
const frames = escenas.map((d) => { const f = t + Math.round(d * 0.75); t += d; return f; });
const mp4 = mp4Arg || `out/fabrica/${id}.mp4`;
const sel = frames.map((f) => `eq(n\\,${f})`).join("+");
const vertical = src.slice(src.indexOf(`id: "${id}"`)).split("\n")[0].includes('"9:16"');
fs.mkdirSync("out/stills", { recursive: true });
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-vf", `select='${sel}',scale=${vertical ? 360 : 640}:-1,tile=${frames.length}x1`, "-frames:v", "1", `out/stills/hoja-${id}.png`]);
console.log(`out/stills/hoja-${id}.png`, frames.join(","));

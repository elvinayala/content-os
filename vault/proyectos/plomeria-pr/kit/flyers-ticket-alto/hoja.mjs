// Hoja de contacto de la familia (3×3, solo feed) para revisar antes de subir nada.
import fs from "node:fs"; import path from "node:path"; import { execFileSync } from "node:child_process"; import { fileURLToPath } from "node:url";
const AQUI = path.dirname(fileURLToPath(import.meta.url)); const slug = process.argv[2] ?? "caguas";
const fs_ = fs.readdirSync(AQUI).filter((f) => f.startsWith(`ta-${slug}-`) && f.endsWith("-feed.png")).sort();
const h = `<!doctype html><html><body style="margin:0;background:#E9E4DB;padding:40px;display:grid;grid-template-columns:repeat(3,540px);gap:28px;width:${3 * 540 + 2 * 28 + 80}px">${fs_.map((f) => `<div><img src="${f}" style="width:540px;display:block;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.12)"><p style="font:600 18px system-ui;color:#0F3D5E;margin:10px 4px 0">${f.replace(`ta-${slug}-`, "").replace("-feed.png", "")}</p></div>`).join("")}</body></html>`;
const f = path.join(AQUI, "hoja.html"); fs.writeFileSync(f, h);
const filas = Math.ceil(fs_.length / 3), alto = 80 + filas * (675 + 40) + (filas - 1) * 28;
execFileSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${3 * 540 + 2 * 28 + 80},${alto}`, "--force-device-scale-factor=1", `--screenshot=${path.join(AQUI, `hoja-${slug}.png`)}`, "file://" + f], { stdio: "ignore", timeout: 60000 });
console.log(`hoja-${slug}.png · ${fs_.length} flyers`);

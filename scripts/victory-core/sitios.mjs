// Baja la home (+ about/locations/careers si están enlazadas) de cada cuenta
// "descubierta" con web, limpia el HTML y deja <dir>/<id>.txt (≤ maxChars).
// Es la evidencia que usa Claude para armar `perfil` (nunca inventa: si el
// texto no lo dice, el campo queda null).
//
// Uso: node scripts/victory-core/sitios.mjs <dirSalida> [maxChars=2200]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const DIR = "data/victory-core";
const [, , out, maxArg] = process.argv;
if (!out) { console.error("Uso: sitios.mjs <dirSalida> [maxChars]"); process.exit(1); }
const MAX = Number(maxArg ?? 2200);
mkdirSync(out, { recursive: true });
const store = JSON.parse(readFileSync(`${DIR}/cuentas.json`, "utf8"));
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const limpiar = (html) => html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, " ")
  .replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, " ").trim();
const meta = (html, n) => (html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${n}["'][^>]+content=["']([^"']*)`, "i")) ?? [])[1] ?? "";
async function bajar(url) {
  const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
}
const pendientes = store.cuentas.filter((c) => c.etapa === "descubierta" && c.web);
let ok = 0, fallo = 0;
await Promise.all(Array.from({ length: 6 }, async (_, w) => {
  for (let i = w; i < pendientes.length; i += 6) {
    const c = pendientes[i];
    try {
      const home = await bajar(c.web);
      let texto = `TITLE: ${(home.match(/<title[^>]*>([^<]*)/i) ?? [])[1]?.trim() ?? ""}\nDESC: ${meta(home, "description") || meta(home, "og:description")}\n` + limpiar(home).slice(0, MAX);
      const base = new URL(c.web);
      const extra = [...home.matchAll(/href=["']([^"']+)["']/gi)].map((m) => m[1]).find((h) => /about|locations|our-team|careers|company/i.test(h) && !/\.(pdf|jpg|png)/i.test(h));
      if (extra) {
        try { const h2 = await bajar(new URL(extra, base).href); texto += `\n--- ${extra} ---\n` + limpiar(h2).slice(0, Math.floor(MAX / 2)); } catch { /* opcional */ }
      }
      writeFileSync(`${out}/${c.id}.txt`, texto);
      ok++;
    } catch (e) {
      writeFileSync(`${out}/${c.id}.txt`, `ERROR: ${e.message}`);
      fallo++;
    }
  }
}));
console.log(JSON.stringify({ pendientes: pendientes.length, ok, fallo }));

// Archivo de Typeform antes de cancelar la suscripción (26/sep/2026), igual que el de Pipedrive:
// baja TODOS los formularios y TODAS sus respuestas por la API → JSON + Excel (una hoja por
// formulario) en ~/Documents/Archivo Typeform/<fecha>/ y copia en Supabase Storage privado
// pulse/archivo-typeform/<fecha>/. Costo $0.
//
//   node scripts/typeform-archivo.mjs [--dir "~/Documents/Archivo Typeform"] [--sin-storage]
//
// Necesita TYPEFORM_TOKEN (y SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY para la copia) en .env.local.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
if (!env.TYPEFORM_TOKEN) { console.error("Falta TYPEFORM_TOKEN en .env.local"); process.exit(1); }
const fecha = new Date().toISOString().slice(0, 10);
const dirArg = process.argv.includes("--dir") ? process.argv[process.argv.indexOf("--dir") + 1] : "~/Documents/Archivo Typeform";
const dir = path.join(dirArg.replace(/^~/, os.homedir()), fecha);
fs.mkdirSync(dir, { recursive: true });

const api = async (ruta) => {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(`https://api.typeform.com${ruta}`, { headers: { Authorization: `Bearer ${env.TYPEFORM_TOKEN}` } });
    if (r.status === 429) { await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
    if (!r.ok) throw new Error(`${ruta} → ${r.status} ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }
  throw new Error(`${ruta} → 429 repetido`);
};

const forms = [];
for (let page = 1; ; page++) {
  const d = await api(`/forms?page_size=200&page=${page}`);
  forms.push(...d.items);
  if (page >= (d.page_count ?? 1)) break;
}
// Formularios que se usan pero no salen en el listado (p. ej. la encuesta que mandan los agentes de n8n).
for (const id of ["UDjwQkKP"]) if (!forms.some((f) => f.id === id)) forms.push({ id });

const archivo = [];
for (const f of forms) {
  const def = await api(`/forms/${f.id}`);
  const respuestas = [];
  let before = "";
  try {
    for (;;) {
      const d = await api(`/forms/${f.id}/responses?page_size=1000&completed=true${before ? `&before=${before}` : ""}`);
      respuestas.push(...d.items);
      if (d.items.length < 1000) break;
      before = d.items.at(-1).token;
    }
  } catch (e) {
    // Formulario de OTRA cuenta de Typeform: la definición es pública, las respuestas no.
    console.log(`${f.id} · ${def.title}: ⚠ respuestas no accesibles con este token (${String(e.message).slice(0, 60)})`);
    archivo.push({ definicion: def, respuestas, aviso: "respuestas en otra cuenta de Typeform" });
    continue;
  }
  console.log(`${f.id} · ${def.title}: ${respuestas.length} respuestas`);
  archivo.push({ definicion: def, respuestas });
}
const json = path.join(dir, "typeform.json");
fs.writeFileSync(json, JSON.stringify({ fecha, formularios: archivo }, null, 1));

// Excel: una hoja por formulario, columnas = preguntas (en orden), filas = respuestas.
const xlsx = path.join(dir, `Typeform ${fecha}.xlsx`);
execFileSync("python3", ["-c", `
import json, re, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
ILEGAL = re.compile(r"[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f]")
data = json.load(open(sys.argv[1]))
wb = Workbook(); wb.remove(wb.active)
def campos(fs):
    for f in fs:
        if f["type"] == "group": yield from campos(f["properties"].get("fields", []))
        elif f["type"] not in ("statement",): yield f
def valor(a):
    t = a.get("type")
    if t == "choice": return a["choice"].get("label") or a["choice"].get("other", "")
    if t == "choices": return ", ".join(a["choices"].get("labels", []) + ([a["choices"]["other"]] if a["choices"].get("other") else []))
    return str(a.get(t, ""))
usados = set()
for fo in data["formularios"]:
    d = fo["definicion"]; fs = list(campos(d.get("fields", [])))
    nombre = re.sub(r"[\\\\/*?:\\[\\]]", "", f'{d.get("title","")[:24]} {d["id"]}')[:31]
    ws = wb.create_sheet(nombre)
    ws.append(["Fecha", *[f["title"] for f in fs], "Ocultos", "Token"])
    for c in ws[1]: c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="0B0B0B")
    for r in fo["respuestas"]:
        por = {a["field"]["id"]: valor(a) for a in r.get("answers") or []}
        fila = [r.get("submitted_at", "")[:19].replace("T", " "), *[por.get(f["id"], "") for f in fs], json.dumps(r.get("hidden") or {}, ensure_ascii=False), r.get("token", "")]
        ws.append([ILEGAL.sub("", str(x)) for x in fila])
    ws.freeze_panes = "B2"
    for col in ws.columns: ws.column_dimensions[col[0].column_letter].width = 28
wb.save(sys.argv[2])
`, json, xlsx]);
console.log(`\nListo en ${dir}`);

if (!process.argv.includes("--sin-storage") && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  for (const [local, tipo] of [[json, "application/json"], [xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]]) {
    const destino = `archivo-typeform/${fecha}/${path.basename(local)}`;
    const r = await fetch(`${env.SUPABASE_URL}/storage/v1/object/pulse/${encodeURI(destino)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": tipo, "x-upsert": "true" },
      body: fs.readFileSync(local),
    });
    console.log(`${r.ok ? "✓" : "✗"} Storage pulse/${destino}${r.ok ? "" : ` → ${r.status} ${(await r.text()).slice(0, 150)}`}`);
  }
}

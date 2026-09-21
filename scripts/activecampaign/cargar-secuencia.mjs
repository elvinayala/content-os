// Reemplaza el contenido de mensajes de automatización de ActiveCampaign con el copy del vault.
//   node scripts/activecampaign/cargar-secuencia.mjs <marca:level-up|ai-borinquen> <secuencia:bienvenida|lead-agenda|pre-llamada|no-show|no-compro> <msgId,msgId,...> [--dry]
import fs from "node:fs";
import path from "node:path";

const [marca, secuencia, idsArg, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
if (!marca || !secuencia || !idsArg) { console.error("Uso: <marca> <secuencia> <ids,coma> [--dry]"); process.exit(1); }
const env = (k) => process.env[k] || fs.readFileSync(".env.local", "utf8").match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const URL_ = env("ACTIVECAMPAIGN_URL"), KEY = env("ACTIVECAMPAIGN_KEY");
const LISTA = marca === "ai-borinquen" ? env("AC_LISTA_AIB") : env("AC_LISTA_LU");
const FROM = marca === "ai-borinquen" ? { nombre: "Alexis Pérez", email: "hola@aiborinquen.co" } : { nombre: "Elvin Ayala", email: "elvin@levelupmediapr.net" };
const md = fs.readFileSync(path.join("vault/proyectos/ecosistema/emails", marca, `${secuencia}.md`), "utf8");

// Parseo: cada "## " es un email. Asunto A, Preview, cuerpo = líneas entre Preview/UTM y **CTA:**
const bloques = md.split(/^## /m).slice(1).map((b) => {
  const lineas = b.split("\n");
  const titulo = lineas[0].trim();
  const get = (re) => (b.match(re)?.[1] || "").trim();
  const asunto = get(/\*\*Asunto A:\*\*\s*(.+)/);
  const preview = get(/\*\*Preview:\*\*\s*(.+)/);
  const cta = get(/\*\*CTA:\*\*\s*(.+)/);
  let cuerpo = b.split(/\*\*UTM:\*\*.*\n/)[1] || b.split(/\*\*Preview:\*\*.*\n/)[1] || "";
  cuerpo = cuerpo.split(/\*\*CTA:\*\*/)[0].trim();
  return { titulo, asunto, preview, cuerpo, cta };
}).filter((e) => e.asunto);

const ids = idsArg.split(",").map((s) => s.trim()).filter(Boolean);
if (ids.length !== bloques.length) { console.error(`❌ ${bloques.length} emails en el .md pero ${ids.length} ids`); process.exit(1); }

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function aHtml(texto) {
  // {{FIRSTNAME|x}} → %FIRSTNAME% con fallback de AC; [SI tag → "..."] → condicional %IF%
  let t = texto.replace(/\{\{FIRSTNAME\|([^}]*)\}\}/g, (_, d) => `%FIRSTNAME|${d}%`)
               .replace(/\{\{([A-Za-z ]+)\}\}/g, (_, f) => `%${f.trim().toUpperCase().replace(/ /g, "_")}%`);
  t = t.replace(/\[SI (\S+) → "([^"]+)"\]/g, (_, tag, frase) => `%IF in_array('${tag}', tags)%${frase}%/IF%`);
  const parrafos = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const html = esc(p).replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" style="color:#c0623a">$1</a>').replace(/\n/g, "<br>");
    return `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.55;color:#1a1a1a">${html}</p>`;
  });
  return parrafos.join("\n");
}
function envolver(e) {
  const link = (e.cuerpo.match(/https?:\/\/[^\s)]+/g) || []).pop();
  const boton = link ? `<p style="margin:24px 0"><a href="${link}" style="background:#c0623a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;display:inline-block">${esc(e.cta)}</a></p>` : "";
  const firma = marca === "ai-borinquen" ? `<p style="margin-top:28px;color:#555;font-size:14px">Alexis Pérez<br>AI Borinquen</p>` : `<p style="margin-top:28px;color:#555;font-size:14px">Elvin Ayala<br>Level Up Media</p>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f4f1;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${esc(e.preview)}</div><div style="max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">${aHtml(e.cuerpo)}${boton}${firma}<p style="margin-top:32px;font-size:12px;color:#999">%SENDER-INFO-SINGLELINE%<br><a href="%UNSUBSCRIBELINK%" style="color:#999">Darme de baja</a></p></div></body></html>`;
}
function aTexto(e) { return e.cuerpo.replace(/\{\{FIRSTNAME\|([^}]*)\}\}/g, "%FIRSTNAME|$1%").replace(/\[SI \S+ → "([^"]+)"\]/g, "$1") + `\n\n${e.cta}\n\n${FROM.nombre}\n\n%SENDER-INFO-SINGLELINE%\n%UNSUBSCRIBELINK%`; }

async function v1(action, params) {
  const body = new URLSearchParams(params);
  for (let intento = 0; intento < 4; intento++) {
    const r = await fetch(`${URL_}/admin/api.php?api_action=${action}&api_key=${KEY}&api_output=json`, { method: "POST", body });
    const txt = await r.text();
    try {
      const j = JSON.parse(txt);
      if (j.result_code !== 1) throw new Error(`${action}: ${j.result_message}`);
      return j;
    } catch (e) {
      if (e instanceof SyntaxError && intento < 3) { await new Promise((ok) => setTimeout(ok, 5000 * (intento + 1))); continue; }
      throw e;
    }
  }
}

const creados = [];
for (let i = 0; i < ids.length; i++) {
  const e = bloques[i], id = ids[i];
  console.log(`${dry ? "[dry] " : ""}msg ${id} ← "${e.asunto}" (${e.titulo})`);
  if (dry) continue;
  if (String(id).startsWith("new:")) {
    const campaignId = id.slice(4);
    const r = await v1("message_add", { format: "mime", subject: e.asunto, fromemail: FROM.email, fromname: FROM.nombre, reply2: FROM.email, priority: "3", charset: "utf-8", encoding: "quoted-printable", htmlconstructor: "editor", html: envolver(e), textconstructor: "editor", text: aTexto(e), [`p[${LISTA}]`]: LISTA });
    console.log(`   ✓ mensaje nuevo ${r.id} (para campaña ${campaignId})`);
    creados.push({ campaignId, messageId: String(r.id) });
    continue;
  }
  await v1("message_edit", { id, format: "mime", subject: e.asunto, fromemail: FROM.email, fromname: FROM.nombre, reply2: FROM.email, priority: "3", charset: "utf-8", encoding: "quoted-printable", htmlconstructor: "editor", html: envolver(e), textconstructor: "editor", text: aTexto(e), [`p[${LISTA}]`]: LISTA });
  console.log("   ✓");
}
if (creados.length) console.log("MAPA " + JSON.stringify(creados));

/**
 * Calculadora de precios para el equipo (Aure, #324 · 14/oct/2026): página privada, solo con link,
 * para cotizar sin depender de que Elvin esté disponible. Describes el trabajo (texto) o subes una
 * foto y, si está en el menú de servicios, devuelve el precio fijo. Si NO está en el menú, Elvin
 * decidió (14/oct) dejarlo como "cotización personalizada" en vez de inventar una fórmula: se le
 * avisa que anote los detalles y lo cotice él (o quien tenga el criterio) cuando pueda.
 */
import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { RAIZ } from "./almacen.js";
import { config } from "./config.js";
import { firmar, verificarFirma } from "./proveedores.js";

const MENU = path.join(RAIZ, "data", "menu.json");
const ID_ACCESO = "precio:equipo";

export const linkCalculadora = () => `${config.urlPublica}/calcular-precio?k=${firmar(ID_ACCESO)}`;

function auth(req: any): boolean {
  const k = String(req.query.k ?? req.body?.k ?? "");
  return !!k && verificarFirma(ID_ACCESO, k);
}

export const router = Router();

router.get("/calcular-precio", (req: any, res) => {
  if (!verificarFirma(ID_ACCESO, String(req.query.k ?? ""))) return res.status(403).send("Enlace inválido.");
  res.type("html").send(HTML);
});

router.post("/api/calcular-precio", async (req: any, res) => {
  if (!auth(req)) return res.status(401).json({ error: "Enlace inválido." });
  const { descripcion, fotos } = req.body as { descripcion?: string; fotos?: { mime: string; base64: string }[] };
  if (!descripcion?.trim() && !(fotos ?? []).length) return res.status(400).json({ error: "Describe el trabajo o sube una foto." });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "IA no configurada (falta ANTHROPIC_API_KEY)." });

  const menu = JSON.parse(fs.readFileSync(MENU, "utf8"));
  const lista = menu.servicios.map((s: any) =>
    `${s.id} · ${s.nombre} · $${Array.isArray(s.precio) ? s.precio.join("–") : s.precio}${s.nota ? ` (${s.nota})` : ""} · alias: ${(s.alias ?? []).join(", ")}`
  ).join("\n");

  const contenido: Anthropic.MessageParam["content"] = [
    ...(fotos ?? []).slice(0, 4).map((f) => ({ type: "image" as const, source: { type: "base64" as const, media_type: f.mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: f.base64 } })),
    {
      type: "text",
      text: `Eres el asistente de precios de Resuelto (plomería en Puerto Rico). Con la descripción del trabajo (y la foto si hay) decide si calza con un servicio de nuestro menú estándar.\n\n` +
        `Descripción: ${descripcion?.trim() || "(solo la foto)"}\n\n` +
        `Menú (usa SOLO estos ids si hay match; no inventes precios ni servicios):\n${lista}\n\n` +
        `Reglas: si el trabajo matchea CLARAMENTE un servicio del menú, responde con ese servicio. Si es ambiguo, parece un ` +
        `proyecto grande (remodelación, línea principal, excavación) o simplemente no calza con ninguno, marca personalizado=true ` +
        `y NO inventes un precio ni un rango — eso lo cotiza Elvin o el equipo con criterio propio.\n\n` +
        `Responde ÚNICAMENTE con JSON: {"personalizado": boolean, "servicio_id": "..." | null, "razon": "...", "preguntas_al_cliente": ["..."]}`,
    },
  ];

  try {
    const client = new Anthropic();
    const r = await client.messages.create({ model: config.modelo, max_tokens: 1000, output_config: { effort: "medium" }, messages: [{ role: "user", content: contenido }] } as any);
    const texto = (r.content as any[]).filter((b) => b.type === "text").map((b) => b.text).join("");
    const m = texto.match(/\{[\s\S]*\}/);
    const out = m ? JSON.parse(m[0]) : { personalizado: true, servicio_id: null, razon: "No pude interpretar la respuesta de la IA.", preguntas_al_cliente: [] };

    if (out.personalizado || !out.servicio_id) {
      return res.json({
        encontrado: false,
        personalizado: true,
        razon: out.razon ?? "No está en el menú estándar.",
        preguntas_al_cliente: out.preguntas_al_cliente ?? [],
        mensaje: "Este trabajo es una COTIZACIÓN PERSONALIZADA — no está en el menú fijo. Anota fotos, medidas y ubicación exacta, y que Elvin (o quien tenga el criterio) lo cotice cuando pueda.",
      });
    }
    const s = menu.servicios.find((x: any) => x.id === out.servicio_id);
    if (!s) return res.json({ encontrado: false, personalizado: true, razon: "La IA sugirió un servicio que no existe en el menú.", mensaje: "Revísalo a mano." });
    res.json({
      encontrado: true, personalizado: false,
      servicio: { id: s.id, nombre: s.nombre, precio: s.precio, nota: s.nota ?? null },
      cargos: { coordinacion: menu.cargo_coordinacion, emergencia: menu.recargo_emergencia, manejoMaterialesPct: menu.manejo_materiales_pct, garantiaMeses: menu.garantia_meses },
      razon: out.razon,
    });
  } catch (e) {
    res.status(502).json({ error: String((e as Error).message) });
  }
});

const HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Calculadora de precios · Resuelto</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#0b1220;color:#e8edf5}
  h1{font-size:20px;margin-bottom:4px} p.sub{color:#9fb0c8;margin-top:0;font-size:14px}
  textarea{width:100%;min-height:90px;border-radius:10px;border:1px solid #2a3a52;background:#121b2c;color:#e8edf5;padding:10px;font-size:15px;box-sizing:border-box}
  input[type=file]{margin:10px 0;color:#9fb0c8}
  button{width:100%;padding:14px;border:none;border-radius:10px;background:#2563eb;color:#fff;font-size:16px;font-weight:600;cursor:pointer}
  button:disabled{opacity:.5}
  #out{margin-top:18px;padding:14px;border-radius:10px;display:none}
  #out.ok{background:#0f2e1a;border:1px solid #1e5c35}
  #out.personal{background:#2e2410;border:1px solid #5c4a1e}
  #out.err{background:#3a1414;border:1px solid #6b2525}
  .precio{font-size:28px;font-weight:700;color:#4ade80}
  .nota{color:#9fb0c8;font-size:13px;margin-top:6px}
  ul{margin:8px 0;padding-left:20px}
</style></head>
<body>
  <h1>Calculadora de precios</h1>
  <p class="sub">Describe el trabajo o sube una foto. Resuelto PR.</p>
  <textarea id="desc" placeholder="Ej: filtración en un tubo debajo del fregadero, se ve el agua goteando"></textarea>
  <input type="file" id="foto" accept="image/*" capture="environment">
  <button id="btn">Calcular precio</button>
  <div id="out"></div>
<script>
const btn=document.getElementById('btn'),out=document.getElementById('out'),desc=document.getElementById('desc'),foto=document.getElementById('foto');
const params=new URLSearchParams(location.search), k=params.get('k');
function toBase64(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file);});}
btn.onclick=async()=>{
  const d=desc.value.trim(); const f=foto.files[0];
  if(!d && !f){alert('Describe el trabajo o sube una foto.');return;}
  btn.disabled=true; btn.textContent='Calculando...'; out.style.display='none';
  const fotos=[]; if(f){fotos.push({mime:f.type,base64:await toBase64(f)});}
  try{
    const r=await fetch('/api/calcular-precio?k='+encodeURIComponent(k),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({descripcion:d,fotos})});
    const j=await r.json();
    if(!r.ok){out.className='err';out.innerHTML='⚠️ '+(j.error||'Error');out.style.display='block';return;}
    if(j.personalizado){
      out.className='personal';
      let h='<b>🔧 Cotización personalizada</b><p class="nota">'+j.razon+'</p><p>'+j.mensaje+'</p>';
      if(j.preguntas_al_cliente?.length) h+='<ul>'+j.preguntas_al_cliente.map(p=>'<li>'+p+'</li>').join('')+'</ul>';
      out.innerHTML=h;
    } else {
      out.className='ok';
      const precio=Array.isArray(j.servicio.precio)?('$'+j.servicio.precio[0]+'–$'+j.servicio.precio[1]):('$'+j.servicio.precio);
      out.innerHTML='<div>'+j.servicio.nombre+'</div><div class="precio">'+precio+'</div>'+
        (j.servicio.nota?'<p class="nota">'+j.servicio.nota+'</p>':'')+
        '<p class="nota">+ $'+j.cargos.coordinacion+' de coordinación (incluye garantía '+j.cargos.garantiaMeses+' meses) · materiales al costo + '+j.cargos.manejoMaterialesPct+'% · emergencia +$'+j.cargos.emergencia+'</p>';
    }
    out.style.display='block';
  } catch(e){ out.className='err'; out.innerHTML='⚠️ '+e.message; out.style.display='block'; }
  finally{ btn.disabled=false; btn.textContent='Calcular precio'; }
};
</script>
</body></html>`;

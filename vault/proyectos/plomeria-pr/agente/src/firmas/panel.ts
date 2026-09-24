/** Panel del equipo para la firma electrónica: crear un enlace (plomero/aprendiz) y ver quién firmó. Minimalista. */
import type { Firma } from "./firmas.js";

const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const fecha = (iso?: string) => (iso ? new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

export function panelFirmasHTML(firmas: (Firma & { link: string; pdf: string })[]): string {
  const filas = firmas.map((f) => `<tr>
    <td><b>${esc(f.nombre)}</b><br><span class="g">${esc(f.id)} · ${f.tipo === "plomero" ? "Plomero" : "Aprendiz"} · ${esc(f.telefono.replace(/^1/, ""))}</span></td>
    <td>${f.estado === "firmado" ? `<span class="ok">✓ Firmado</span><br><span class="g">${fecha(f.firmado?.en)}</span>` : f.estado === "anulado" ? `<span class="g">Anulado</span>` : `<span class="pend">Pendiente</span><br><span class="g">${f.abierto ? "Lo abrió " + fecha(f.abierto.en) : "No lo ha abierto"}</span>`}</td>
    <td class="acc">${f.estado === "firmado" ? `<a href="${f.pdf}" target="_blank">PDF</a>` : `<button data-tipo="${f.tipo === "plomero" ? "aprendiz" : "plomero"}" data-id="${esc(f.id)}">Pasar a ${f.tipo === "plomero" ? "aprendiz" : "plomero"}</button> <button data-copiar="${esc(f.link)}">Copiar enlace</button> <a href="https://wa.me/${esc(f.telefono)}?text=${encodeURIComponent(`Hola ${f.nombre.split(" ")[0]}, te escribo de Resuelto. Aquí está tu contrato para completarlo y firmarlo desde el celular (toma unos 3 minutos): ${f.link}`)}" target="_blank">WhatsApp</a>`}</td>
  </tr>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Contratos · Resuelto</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--azul:#0F3D5E;--naranja:#F2621F;--crema:#FBF7F0;--gris:#5C6670;--linea:#E6E1D8;--verde:#1F9D6B}
*{box-sizing:border-box}body{margin:0;background:var(--crema);font-family:'DM Sans',system-ui,sans-serif;color:#1c2a36}
header{background:var(--azul);color:#fff;padding:16px 20px;border-bottom:3px solid var(--naranja);font-family:Sora;font-weight:800;font-size:18px}
main{max-width:860px;margin:0 auto;padding:18px 16px 40px}
h2{font-family:Sora;color:var(--azul);font-size:17px;margin:18px 0 10px}
.card{background:#fff;border-radius:14px;padding:16px;border:1px solid var(--linea)}
form{display:grid;grid-template-columns:1fr 1fr;gap:10px}
form .full{grid-column:1/-1}
label{font-size:13px;font-weight:700;display:block;margin-bottom:4px}
input,select{width:100%;font:inherit;padding:11px 12px;border:1.5px solid var(--linea);border-radius:10px;background:#fff}
button,.btn{font:inherit;font-weight:700;border:1.5px solid var(--linea);background:#fff;color:var(--azul);padding:9px 12px;border-radius:10px;cursor:pointer;text-decoration:none;display:inline-block}
.principal{background:var(--naranja);border-color:var(--naranja);color:#fff;font-family:Sora}
#nuevo{display:none;margin-top:12px;background:#EEF6F1;border-radius:10px;padding:12px;font-size:14px;word-break:break-all}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:10px 8px;border-bottom:1px solid var(--linea);vertical-align:top}
.g{color:var(--gris);font-size:12.5px}.ok{color:var(--verde);font-weight:700}.pend{color:#B45309;font-weight:700}.acc{text-align:right;white-space:nowrap}
.acc a{color:var(--azul);font-weight:700;margin-left:8px}
@media(max-width:600px){form{grid-template-columns:1fr}.acc{white-space:normal}}
</style></head><body>
<header>resuelto · contratos</header>
<main>
<h2>Nuevo contrato para firmar</h2>
<div class="card">
<form id="f">
  <div><label>Tipo</label><select name="tipo"><option value="plomero">Plomero con licencia</option><option value="aprendiz">Aprendiz (con certificado de la Junta)</option></select></div>
  <div><label>Nombre</label><input name="nombre" required></div>
  <div><label>WhatsApp</label><input name="telefono" inputmode="tel" required placeholder="787-000-0000"></div>
  <div><label>Municipio</label><input name="municipio"></div>
  <div class="full g">Sin licencia ni certificado de aprendiz no se hace contrato: por ley (Ley 59-2022) no puede hacer plomería. Si no sabes qué tiene, no importa: en el celular le preguntamos y, si es aprendiz con certificado, le sale el Acuerdo de aprendiz.</div>
  <div class="full"><button class="principal" type="submit">Crear enlace</button></div>
</form>
<div id="nuevo"></div>
</div>
<h2>Contratos</h2>
<div class="card" style="padding:4px 12px"><table>${filas || `<tr><td class="g">Todavía no hay contratos.</td></tr>`}</table></div>
</main>
<script>
document.querySelectorAll("[data-tipo]").forEach(b=>b.onclick=async()=>{b.disabled=true;const r=await fetch(location.pathname+"/tipo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:b.dataset.id,tipo:b.dataset.tipo})});const j=await r.json();if(j.ok)location.reload();else{alert(j.error||"No se pudo cambiar.");b.disabled=false}});
document.querySelectorAll("[data-copiar]").forEach(b=>b.onclick=()=>{navigator.clipboard.writeText(b.dataset.copiar);b.textContent="Copiado ✓"});
document.getElementById("f").onsubmit=async(e)=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
 const r=await fetch(location.pathname+"/nuevo",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});const j=await r.json();const n=document.getElementById("nuevo");n.style.display="block";
 if(!j.ok){n.textContent=j.error||"No se pudo crear.";return}
 n.innerHTML='<b>Listo.</b> Mándale este enlace por WhatsApp:<br><a href="'+j.link+'" target="_blank">'+j.link+'</a><br><br><a class="btn principal" target="_blank" href="'+j.whatsapp+'">Abrir WhatsApp con el mensaje</a> <button id="cp">Copiar enlace</button>';
 document.getElementById("cp").onclick=()=>navigator.clipboard.writeText(j.link);setTimeout(()=>{},0)};
</script></body></html>`;
}

/** Pantalla de entrada al panel: una clave, nada más. La cookie dura 30 días. */
export function entrarFirmasHTML(error: boolean): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Contratos · Resuelto</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@800&family=DM+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#FBF7F0;font-family:'DM Sans',system-ui,sans-serif;color:#1c2a36;padding:16px}
form{background:#fff;border:1px solid #E6E1D8;border-radius:16px;padding:24px;width:100%;max-width:360px}
h1{font-family:Sora;color:#0F3D5E;font-size:20px;margin:0 0 4px}p{color:#5C6670;font-size:14px;margin:0 0 16px}
input{width:100%;font:inherit;padding:12px;border:1.5px solid #E6E1D8;border-radius:10px;margin-bottom:12px}
button{width:100%;font:inherit;font-weight:700;padding:12px;border:0;border-radius:10px;background:#F2621F;color:#fff;cursor:pointer}
.err{color:#B42318;font-size:13px;margin:-4px 0 12px}</style></head><body>
<form method="post" action="/equipo-firmas/entrar"><h1>resuelto · contratos</h1><p>Escribe la clave del equipo.</p>
<input name="clave" type="password" autocomplete="current-password" required autofocus>
${error ? '<div class="err">Esa clave no es. Prueba otra vez.</div>' : ""}<button>Entrar</button></form></body></html>`;
}

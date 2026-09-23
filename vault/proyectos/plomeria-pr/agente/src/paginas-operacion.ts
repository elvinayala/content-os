/** Páginas HTML de operación: panel de plomeros (admin) y página de pago del cliente. Estilo de marca, sin dependencias. */
import type { Proveedor } from "./proveedores.js";
import type { Oferta } from "./despacho.js";
import type { Trabajo } from "./almacen.js";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const CSS = `:root{--c2:#F2621F;--night:#071B2C;--surf:#0C2A42;--line:rgba(255,255,255,.14);--ink:#EAF2F8;--ink2:#9FB8CA}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;background:var(--night);color:var(--ink);font-size:15px;line-height:1.45}
header{padding:16px 20px;border-bottom:1px solid var(--line);font-family:Sora,system-ui;font-weight:800;font-size:20px}header small{color:var(--c2);font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-left:8px}
main{max-width:1000px;margin:0 auto;padding:20px}h2{font-family:Sora,system-ui;font-size:17px;margin:26px 0 10px}
.card{background:var(--surf);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
input,select{background:#0A2236;border:1px solid var(--line);color:var(--ink);border-radius:10px;padding:11px 12px;font:inherit;width:100%}
label{font-size:12px;color:var(--ink2);display:block;margin:10px 0 4px}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px}
.btn{background:var(--c2);color:#fff;border:0;border-radius:10px;padding:11px 16px;font:inherit;font-weight:600;cursor:pointer}.btn.l{background:transparent;border:1px solid var(--line);color:var(--ink)}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{text-align:left;padding:9px 8px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--ink2);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
.tag{display:inline-block;font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px;background:rgba(255,255,255,.08)}.ok{background:rgba(31,157,107,.25);color:#7EE0B4}.warn{background:rgba(242,98,31,.2);color:#FF9660}
.link{font-size:12px;color:var(--ink2);word-break:break-all}#msg{margin-top:10px;font-weight:600}`;

export function panelPlomerosHTML(plomeros: (Proveedor & { link: string })[], ofertas: Oferta[], trabajos: Trabajo[]) {
  const filas = plomeros.map((p) => `<tr><td><b>${esc(p.nombre)}</b><div class="link">${esc(p.whatsapp)} · ${esc(p.licencia ?? "")}</div></td><td>${esc(p.municipio ?? "")}<div class="link">${esc(p.territorios.join(", "))}</div></td>
<td><span class="tag ${p.estado === "activo" ? "ok" : "warn"}">${esc(p.estado)}</span></td>
<td><div class="link">${esc(p.link)}</div><button class="btn l" onclick="copiar('${esc(p.link)}')">Copiar link</button> <button class="btn l" onclick="post('/admin/plomeros/${esc(p.id)}/reenviar',{})">Reenviar bienvenida</button>
${p.estado === "activo" ? `<button class="btn l" onclick="post('/admin/plomeros/${esc(p.id)}/estado',{estado:'pausado'})">Pausar</button>` : `<button class="btn l" onclick="post('/admin/plomeros/${esc(p.id)}/estado',{estado:'activo'})">Activar</button>`}</td></tr>`).join("");
  const trab = trabajos.map((t) => `<tr><td><b>${esc(t.id)}</b><div class="link">${esc(t.servicio)}</div></td><td>${esc(t.nombre)}<div class="link">${esc(t.municipio)}</div></td><td>${esc(t.plomeroId || "—")}</td>
<td><span class="tag ${t.estado === "cobrado" ? "ok" : "warn"}">${esc(t.estado)}</span></td><td>${t.totalCliente != null ? "$" + t.totalCliente.toFixed(2) : "—"}<div class="link">plomero ${t.pagoPlomero != null ? "$" + t.pagoPlomero.toFixed(2) : "—"}${t.pagadoAlPlomero ? " · pagado " + esc(t.pagadoAlPlomero) : ""}</div></td>
<td>${[...(t.fotosAntes ?? []), ...(t.fotosDespues ?? [])].map((f) => `<a class="link" href="/admin/fotos/${esc(f)}" target="_blank">📷</a>`).join(" ")}
${t.estado === "completado" ? `<button class="btn l" onclick="post('/admin/trabajos/${esc(t.id)}/marcar',{que:'cobrado'})">Cobrado</button>` : ""}${t.pagoPlomero != null && !t.pagadoAlPlomero ? ` <button class="btn l" onclick="post('/admin/trabajos/${esc(t.id)}/marcar',{que:'pagado-plomero'})">Pagado al plomero</button>` : ""}</td></tr>`).join("");
  const ofs = ofertas.map((o) => `<tr><td><b>${esc(o.id)}</b> · ${esc(o.referencia)}</td><td>${esc(o.categoriaNombre)}<div class="link">${esc(o.municipio)}</div></td><td><span class="tag ${o.estado === "aceptada" ? "ok" : "warn"}">${esc(o.estado)}</span></td><td>${esc(o.aceptadoPor ?? "—")}</td><td>avisados: ${o.avisados.length}</td></tr>`).join("");
  return `<!doctype html><html lang="es-PR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resuelto · Plomeros</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>
<header>resuelto<small>Operación</small></header><main>
<h2>Dar de alta un plomero (contratado y firmado)</h2>
<div class="card"><div class="g">
<div><label>Nombre completo</label><input id="nombre" placeholder="Luis Rivera"></div>
<div><label>WhatsApp</label><input id="whatsapp" placeholder="787-555-0123"></div>
<div><label>Municipio donde vive/trabaja</label><input id="municipio" placeholder="Bayamón"></div>
<div><label>Licencia (nivel y número)</label><input id="licencia" placeholder="maestro 12345"></div>
<div><label>Email (opcional)</label><input id="email" placeholder="correo@..."></div></div>
<p style="margin-top:14px"><button class="btn" onclick="alta()">Dar de alta y enviarle su app por WhatsApp</button></p><div id="msg"></div></div>
<h2>Plomeros (${plomeros.length})</h2><div class="card"><table><tr><th>Plomero</th><th>Zona</th><th>Estado</th><th>App</th></tr>${filas || '<tr><td colspan="4">Todavía no hay plomeros.</td></tr>'}</table></div>
<h2>Trabajos recientes</h2><div class="card"><table><tr><th>Trabajo</th><th>Cliente</th><th>Plomero</th><th>Estado</th><th>Montos</th><th></th></tr>${trab || '<tr><td colspan="6">Sin trabajos todavía.</td></tr>'}</table></div>
<h2>Ofertas recientes</h2><div class="card"><table><tr><th>Oferta</th><th>Servicio</th><th>Estado</th><th>Tomada por</th><th></th></tr>${ofs || '<tr><td colspan="5">Sin ofertas todavía.</td></tr>'}</table></div>
</main><script>
function post(u,b){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json()).then(j=>{if(j.ok)location.reload();else alert(j.motivo||'No se pudo')})}
function copiar(t){navigator.clipboard.writeText(t).then(()=>alert('Link copiado'))}
function alta(){var v=id=>document.getElementById(id).value.trim();var m=document.getElementById('msg');
if(!v('nombre')||!v('whatsapp')||!v('municipio')){m.textContent='Faltan nombre, WhatsApp o municipio.';return}
m.textContent='Dando de alta…';fetch('/admin/plomeros',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nombre:v('nombre'),whatsapp:v('whatsapp'),municipio:v('municipio'),licencia:v('licencia'),email:v('email')})}).then(r=>r.json()).then(j=>{
if(!j.ok){m.textContent=j.motivo;return}m.innerHTML='✅ '+j.plomero.nombre+' activo en '+(j.plomero.territorios.join(', ')||'SIN TERRITORIO')+'. Bienvenida por WhatsApp: '+(j.bienvenidaEnviada?'enviada':'NO enviada — mándale este link:')+'<div class=link>'+j.link+'</div>';setTimeout(()=>location.reload(),4000)})}
</script></body></html>`;
}

export function pagarHTML(t: Trabajo, ath: string) {
  const mano = t.manoObraFinal ?? t.manoObra ?? 0;
  const mat = t.materialesCosto ? Math.round(t.materialesCosto * 1.2 * 100) / 100 : 0;
  return `<!doctype html><html lang="es-PR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resuelto · Pagar ${esc(t.id)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet"><style>${CSS}.tot{font-family:Sora,system-ui;font-size:40px;font-weight:800}.r{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)}</style></head><body>
<header>resuelto<small>Pago</small></header><main style="max-width:520px">
<div class="card"><p style="color:var(--ink2)">Trabajo ${esc(t.id)} · ${esc(t.servicio)}</p><p style="margin:6px 0 14px">${esc(t.nombre)} · ${esc(t.municipio)}</p>
<div class="r"><span>Mano de obra</span><b>$${mano.toFixed(2)}</b></div>${t.emergencia ? `<div class="r"><span>Emergencia</span><b>$99.00</b></div>` : ""}${mat ? `<div class="r"><span>Materiales</span><b>$${mat.toFixed(2)}</b></div>` : ""}<div class="r"><span>Coordinación</span><b>$${t.fee.toFixed(2)}</b></div>
<p style="margin-top:16px;color:var(--ink2)">Total</p><div class="tot">$${(t.totalCliente ?? 0).toFixed(2)}</div></div>
${t.estado === "cobrado" ? `<div class="card"><b>✅ Pagado. ¡Gracias!</b><p style="color:var(--ink2);margin-top:6px">Tu garantía de 12 meses en mano de obra está activa.</p></div>` : `<div class="card"><b>Paga por ATH Móvil</b><p style="margin-top:8px">${esc(ath)}</p><p style="color:var(--ink2);margin-top:6px">En el mensaje del pago escribe <b>${esc(t.id)}</b>. Nunca le pagues en efectivo al plomero.</p></div>`}
<p style="color:var(--ink2);font-size:13px;margin-top:12px">¿Dudas? WhatsApp 939-247-9234 · resueltopr.com</p></main></body></html>`;
}

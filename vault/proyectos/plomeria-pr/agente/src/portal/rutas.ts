/**
 * Portal de operación de Resuelto (/portal): el lugar donde el gerente de proyectos, reclutamiento y Elvin buscan un
 * cliente y ven TODO lo que pasó (trabajos, fotos, notas del plomero, conversación, garantía), manejan plomeros y
 * abren garantías. Server-rendered, sin dependencias. Datos: el almacén del agente (volumen de Railway).
 */
import express, { type Request, type Response, type NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { almacen, RAIZ, type Trabajo, type Contacto } from "../almacen.js";
import * as despacho from "../despacho.js";
import * as ciclo from "../ciclo-trabajo.js";
import { partesDelPago, piezasDevueltas, montosDeCierre, faltaParaPagar, pasoDePago } from "../cuenta-plomero.js";
import { panelVentas, origenDe, ganancia, resumenMes, NOMBRE_ORIGEN, type Origen } from "../ventas-panel.js";
import { gastoAnuncios } from "../anuncios-gasto.js";
import { validarCierre, aplicarCierre, METODOS } from "../registro-pago.js";
import sharp from "sharp";
import { listar as listarFirmas, enlacePdf } from "../firmas/firmas.js";
import { plomeros, altaPlomero, cambiarEstadoPlomero, linkPortal, territorioDe, NOMBRE_OFICIO, oficioCampo, type OficioCampo } from "../proveedores.js";
import { DEMO_ID } from "../demo-plomero.js";
import { leerHistorial, archivar } from "../historial.js";
import { abrirGarantia, vigenciaGarantia } from "../garantias.js";
import { avisarCoordinador } from "../canales/whatsapp.js";
import { avisarAlTelefono } from "../canales/telefono.js"; // WhatsApp si está sano; si no, SMS desde el 787-956-1111
import { territorios, menu } from "../prompt.js";
const r2 = (n: number) => Math.round(n * 100) / 100;
import { config } from "../config.js";
import * as staff from "./staff.js";
import { casa } from "../marca.js";

export const portal = express.Router();
portal.use("/portal", express.urlencoded({ extended: false }));

const e = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const $ = (n?: number | null) => (n == null ? "—" : "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const f = (iso?: string) => (iso ? new Date(iso).toLocaleString("es-PR", { timeZone: config.zonaHoraria, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—");
const fd = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-PR", { timeZone: config.zonaHoraria, day: "numeric", month: "short", year: "numeric" }) : "—");
const tel = (t?: string) => (t ?? "").replace(/\D/g, "");
const u = (id: string) => encodeURIComponent(id);
const ESTADO_TXT: Record<string, string> = { agendado: "Agendado", "en-camino": "En camino", "en-sitio": "En el sitio", completado: "Terminado · por cobrar", cobrado: "Cobrado", cancelado: "Cancelado" };
const tagEstado = (s: string) => `<span class="tag ${s === "cobrado" ? "ok" : s === "cancelado" ? "mute" : s === "completado" ? "warn" : "info"}">${e(ESTADO_TXT[s] ?? s)}</span>`;

const CSS = `:root{--navy:#08243A;--navy2:#0F3D5E;--o:#F2621F;--cream:#FBF7F0;--line:#E6E1D8;--ink2:#5C6670;--ok:#1F9D6B}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'DM Sans',system-ui,sans-serif;background:var(--cream);color:var(--navy);font-size:15px;line-height:1.45}
a{color:var(--navy2)}nav{background:var(--navy);color:#fff;display:flex;align-items:center;gap:22px;padding:14px 22px;flex-wrap:wrap}
nav b{font-family:Sora,system-ui;font-size:20px;font-weight:800;letter-spacing:-.02em;margin-right:8px}nav b i{color:var(--o);font-style:normal}
nav a.marca{display:flex;align-items:center;gap:9px;color:#fff;border:0;padding:0;margin-right:10px}nav a.marca span{font-family:Sora,system-ui;font-size:21px;font-weight:800;letter-spacing:-.03em}
.entrar{min-height:100vh;display:grid;place-items:center;background:radial-gradient(1200px 500px at 50% -10%,#123F61 0%,var(--navy) 60%);padding:24px}
.entrar .card{width:100%;max-width:400px;padding:30px 28px;border:0;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28)}
.entrar .logo{display:flex;align-items:center;gap:10px;margin-bottom:18px}.entrar .logo span{font-family:Sora,system-ui;font-size:28px;font-weight:800;letter-spacing:-.03em;color:var(--navy2)}
.entrar h1{font-size:20px;margin-bottom:2px}.entrar .pie{color:#9FB8CA;font-size:12.5px;text-align:center;margin-top:18px}.entrar input{padding:12px 14px}.entrar input:focus{outline:2px solid #F2621F33;border-color:var(--o)}
nav a{color:#CFE0EC;text-decoration:none;font-weight:600;font-size:14.5px}nav a.on{color:#fff;border-bottom:2px solid var(--o);padding-bottom:3px}nav .yo{margin-left:auto;font-size:13px;color:#9FB8CA}
main{max-width:1100px;margin:0 auto;padding:22px}h1{font-family:Sora,system-ui;font-size:24px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
h2{font-family:Sora,system-ui;font-size:16px;font-weight:700;margin:26px 0 10px}.sub{color:var(--ink2);margin-bottom:14px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}.kpi b{display:block;font-family:Sora,system-ui;font-size:26px}.kpi span{color:var(--ink2);font-size:13px}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:top;font-size:14px}th{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--ink2)}
tr.click{cursor:pointer}tr.click:hover{background:#FFF7F1}
.tag{display:inline-block;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:99px;background:#EEF2F5}.tag.ok{background:#DDF3E9;color:#11774F}.tag.warn{background:#FDE7DA;color:#B6470F}.tag.info{background:#E3EDF6;color:var(--navy2)}.tag.mute{color:#8A949C}
input,select,textarea{font:inherit;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:#fff;width:100%}textarea{min-height:70px}
.btn{display:inline-block;background:var(--o);color:#fff;border:0;border-radius:10px;padding:10px 16px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}.btn.l{background:#fff;color:var(--navy);border:1px solid var(--line)}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:760px){.g2{grid-template-columns:1fr}}
.fotos{display:flex;flex-wrap:wrap;gap:8px}.fotos a img{width:150px;height:150px;object-fit:cover;border-radius:10px;border:1px solid var(--line)}
.ev{border-left:3px solid var(--line);padding:4px 0 10px 12px;margin-left:4px}.ev small{color:var(--ink2)}.ev.cliente{border-color:#9FB8CA}.ev.resuelto{border-color:var(--o)}.ev.plomero{border-color:var(--ok)}.ev.staff{border-color:var(--navy)}
.muted{color:var(--ink2)}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}label{font-size:12.5px;color:var(--ink2);display:block;margin:8px 0 4px}`;

function pagina(titulo: string, yo: staff.Staff | null, activo: string, cuerpo: string) {
  const nav = yo ? `<nav><a class="marca" href="/portal">${casa(true, 24)}<span>resuelto</span></a>${[["inicio", "/portal", "Inicio"], ["clientes", "/portal/clientes", "Clientes"], ["trabajos", "/portal/trabajos", "Trabajos"], ["ventas", "/portal/ventas", "Ventas"], ["plomeros", "/portal/plomeros", "Plomeros"], ["vacantes", "/portal/vacantes", "Vacantes"], ["contratistas", "/portal/contratistas", "Contratistas"], ["areas", "/portal/areas", "Áreas"], ["enlaces", "/portal/enlaces", "Enlaces"], ...(yo.rol === "admin" ? [["resumen", "/portal/resumen", "Resumen"], ["equipo", "/portal/equipo", "Equipo"]] : [])].map(([k, h, t]) => `<a href="${h}" class="${k === activo ? "on" : ""}">${t}</a>`).join("")}<span class="yo">${e(yo.nombre)} · <a href="/portal/clave">Mi clave</a> · <a href="/portal/salir">Salir</a></span></nav>` : "";
  return `<!doctype html><html lang="es-PR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(titulo)} · Resuelto</title><meta name="robots" content="noindex"><link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet"><style>${CSS}</style></head><body>${nav}${yo ? `<main>${cuerpo}</main>` : cuerpo}
<script>function post(u,b,msg){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})}).then(r=>r.json()).then(j=>{if(j.ok){if(msg)alert(msg);location.reload()}else alert(j.motivo||'No se pudo')})}</script></body></html>`;
}

// ── Auth ──
const intentos = new Map<string, { n: number; hasta: number }>();
function requerir(rol?: staff.Rol) {
  return (req: Request, res: Response, next: NextFunction) => {
    const yo = staff.leerSesion(req.headers.cookie);
    if (!yo) return req.method === "GET" ? res.redirect("/portal/login?v=" + encodeURIComponent(req.originalUrl)) : res.status(401).json({ ok: false, motivo: "Sesión vencida. Entra otra vez." });
    if (rol && yo.rol !== rol && yo.rol !== "admin") return res.status(403).send(pagina("Sin acceso", yo, "", "<h1>Sin acceso</h1><p class=sub>Tu usuario no tiene permiso para esta sección.</p>"));
    (req as any).yo = yo; next();
  };
}
portal.get("/portal/login", (req, res) => {
  const err = req.query.e ? `<p style="color:#B6470F;margin:10px 0">${req.query.e === "b" ? "Demasiados intentos. Espera 15 minutos." : "Email o clave incorrectos."}</p>` : "";
  res.type("html").send(pagina("Entrar", null, "", `<div class="entrar"><div><div class="card"><div class="logo">${casa(false, 34)}<span>resuelto</span></div><h1>Portal de operación</h1><p class="sub">Clientes, trabajos, plomeros y equipo en un solo lugar.</p>${err}
<form method="post" action="/portal/login"><input type="hidden" name="v" value="${e(req.query.v ?? "/portal")}"><label>Email</label><input name="email" type="email" autocomplete="username" required><label>Clave</label><input name="clave" type="password" autocomplete="current-password" required><p style="margin-top:16px"><button class="btn" style="width:100%;padding:12px 16px">Entrar</button></p></form></div><p class="pie">Resuelto PR Home Services LLC · uso interno</p></div></div>`));
});
portal.post("/portal/login", (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] ?? req.ip).split(",")[0]; const i = intentos.get(ip);
  if (i && i.n >= 8 && i.hasta > Date.now()) return res.redirect("/portal/login?e=b");
  const yo = staff.autenticar(String(req.body.email ?? ""), String(req.body.clave ?? ""));
  if (!yo) { intentos.set(ip, { n: (i && i.hasta > Date.now() ? i.n : 0) + 1, hasta: Date.now() + 15 * 60_000 }); return res.redirect("/portal/login?e=1"); }
  intentos.delete(ip);
  res.setHeader("Set-Cookie", `rs=${staff.crearSesion(yo.email)}; Path=/portal; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 86400}`);
  if (yo.temporal) return res.redirect("/portal/clave?t=1");
  const v = String(req.body.v ?? "/portal"); res.redirect(v.startsWith("/portal") ? v : "/portal");
});
portal.get("/portal/salir", (_req, res) => { res.setHeader("Set-Cookie", "rs=; Path=/portal; Max-Age=0"); res.redirect("/portal/login"); });

// ── Datos ──
function todosContactos(): Contacto[] {
  const ids = new Set<string>(); const out: Contacto[] = [];
  for (const t of almacen.trabajos()) if (!ids.has(t.contactoId)) { ids.add(t.contactoId); const c = almacen.contacto(t.contactoId); if (c) out.push(c); }
  return out;
}
function listaContactos(): Contacto[] {
  // contactos.json completo (vía almacen.contacto no hay "listar"; lo leemos del archivo directamente)
  try { const obj = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "estado", "contactos.json"), "utf8")) as Record<string, Contacto>; return Object.values(obj); } catch { return todosContactos(); }
}
const trabajosDe = (contactoId: string) => almacen.trabajos().filter((t) => t.contactoId === contactoId).sort((a, b) => b.creado.localeCompare(a.creado));
const norm = (s: unknown) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Registrar cierre y pago (3/oct): el desglose completo de un trabajo, lo que pagó el cliente, gastos y recibos.
function resumenCierre(t: Trabajo) {
  const c = t.cierre; const fotos = (t.recibos ?? []).map((x) => `<a href="/portal/fotos/${u(x)}" target="_blank"><img src="/portal/fotos/${u(x)}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;margin:6px 6px 0 0"></a>`).join("");
  if (!c) return fotos ? `<div>${fotos}</div>` : (["completado", "cobrado"].includes(t.estado) && !t.garantiaDe ? `<p style="margin-top:8px"><span class="tag warn">Falta registrar el cierre y el pago</span></p>` : "");
  return `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #E6E1D8"><b>Cierre registrado</b> <span class="muted">por ${e(c.por)} · ${f(c.registrado)}</span><br>${!c.pagado && c.abonado ? `El cliente pagó <b>${$(c.abonado)}</b> de ${$(c.totalPagado)} por ${e(c.metodo ?? "")} · <span class="tag warn">debe ${$(r2((c.totalPagado ?? 0) - c.abonado))}</span><br>` : ""}${c.pagado ? `El cliente pagó <b>${$(c.totalPagado)}</b> por ${e(c.metodo ?? "")}${(c.pagos ?? 1) > 1 ? ` en ${c.pagos} pagos` : ""}${c.fechaPago ? ` el ${fd(c.fechaPago + "T16:00:00Z")}` : ""}${c.totalPagado != null && t.totalCliente != null && Math.abs(c.totalPagado - t.totalCliente) >= 0.01 ? ` <span class="tag warn">le correspondía ${$(t.totalCliente)}</span>` : ""}` : c.abonado ? "" : `<span class="tag warn">el cliente todavía no ha pagado</span>`}${c.equipoResuelto ? `<br>Equipo que puso Resuelto: ${$(c.equipoResuelto)}` : ""}${c.otrosGastos ? `<br>Otros gastos: ${$(c.otrosGastos)} (${e(c.gastosNota ?? "")})` : ""}<br><b>Le queda a Resuelto: ${$(ganancia(t))}</b><br><span class="muted">${e(c.nota)}</span>${fotos ? `<div>${fotos}</div>` : ""}</div>`;
}
function formCierre(t: Trabajo) {
  const c = t.cierre; const pzPlomero = c?.piezasPlomero ?? (t.piezasPlomero != null ? r2(t.piezasPlomero / 1.1) : t.materialesCosto ?? 0);
  const eq = c?.equipoResuelto ?? (t.piezasPlomero != null && t.materialesCosto != null ? Math.max(0, r2(t.materialesCosto - t.piezasPlomero / 1.1)) : 0);
  const v = (x: unknown) => (x == null ? "" : e(String(x)));
  const hoy = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
  const campo = (id: string, label: string, val: unknown) => `<div><label>${label}</label><input id="${id}" type="number" step="0.01" min="0" value="${v(val)}"${id === "ci-tp" ? "" : ' oninput="ciCalc()"'}></div>`;
  return `<details id="cierre" class="card" style="margin-top:12px"${!c && ["completado", "cobrado"].includes(t.estado) ? " open" : ""}><summary><b>${c ? "Editar cierre y pago" : "Registrar cierre y pago"}</b> <span class="muted">(al cliente no le llega nada; queda en el historial y le llega a Elvin)</span></summary>
<div class="g2" style="margin-top:8px">${campo("ci-mo", "Mano de obra ($)", c?.manoObra ?? t.manoObraFinal ?? t.manoObra)}${campo("ci-fee", "Coordinación ($)", c?.fee ?? t.fee)}</div>
<div class="g2">${campo("ci-rec", "Recargo de emergencia ($)", c?.recargo ?? (t.emergencia ? menu.recargo_emergencia : 0))}${campo("ci-pz", "Piezas que compró el plomero (recibo, $)", pzPlomero)}</div>
<div class="g2">${campo("ci-eq", "Equipo o piezas que compró Resuelto ($)", eq)}${campo("ci-og", "Otros gastos de Resuelto ($)", c?.otrosGastos ?? 0)}</div>
<label>¿Cuáles fueron los otros gastos?</label><input id="ci-ogn" value="${v(c?.gastosNota)}" placeholder="Ej: ferretería, gasolina extra, descuento al cliente">
<div class="card" style="background:#F6F2EA;margin-top:12px" id="ci-res"></div>
<div class="g2"><div><label>¿El cliente ya pagó?</label><select id="ci-pag" onchange="ciPagado()"><option value="si"${c?.pagado || t.estado === "cobrado" ? " selected" : ""}>Sí, todo</option><option value="parcial"${c?.abonado && !c?.pagado && t.estado !== "cobrado" ? " selected" : ""}>Pagó una parte</option><option value="no"${c?.pagado || c?.abonado || t.estado === "cobrado" ? "" : " selected"}>Todavía no</option></select></div>${campo("ci-tp", "Total que paga el cliente ($)", c?.totalPagado ?? "")}</div>
<div id="ci-abw" class="g2"><div>${campo("ci-ab", "Lleva pagado ($)", c?.abonado ?? "")}</div><div class="muted" style="align-self:end;padding-bottom:12px" id="ci-debe"></div></div>
<div class="g2" id="ci-pago"><div><label>Cómo pagó</label><select id="ci-met">${METODOS.map((m) => `<option${c?.metodo === m ? " selected" : ""}>${m}</option>`).join("")}</select></div><div class="g2"><div><label>En cuántos pagos</label><input id="ci-np" type="number" min="1" max="10" value="${v(c?.pagos ?? 1)}"></div><div><label>Fecha del pago</label><input id="ci-fp" type="date" value="${v(c?.fechaPago ?? hoy)}"></div></div></div>
<label>Fotos del trabajo terminado${(t.fotosDespues ?? []).length ? ` <span class="muted">(el plomero ya subió ${(t.fotosDespues ?? []).length})</span>` : ' <b style="color:#B6470F">(obligatorio: el plomero no subió ninguna)</b>'}</label><input id="ci-ftr" type="file" accept="image/*" multiple>
<label>Fotos de recibos de piezas y del comprobante de pago${(t.recibos ?? []).length ? ` <span class="muted">(ya hay ${(t.recibos ?? []).length})</span>` : " (el recibo es obligatorio si el plomero compró piezas)"}</label><input id="ci-fot" type="file" accept="image/*" multiple>
<label>Nota (qué pasó, cómo se cobró)</label><input id="ci-n" value="${v(c?.nota)}" placeholder="Ej: la bomba la compró Resuelto en Home Depot; pagó por ATH en dos pagos">
<p style="margin-top:10px"><button class="btn" id="ci-g" onclick="ciGuardar()">Guardar cierre</button></p></details>
<script>
var MARGEN=${menu.manejo_materiales_pct};function nv(i){var x=parseFloat(document.getElementById(i).value);return isNaN(x)?0:x}function m$(n){return '$'+(Math.round(n*100)/100).toFixed(2)}
function ciEp(){return document.getElementById('ci-pag').value}
function ciCalc(){var mo=nv('ci-mo'),fee=nv('ci-fee'),rec=nv('ci-rec'),pz=nv('ci-pz'),eq=nv('ci-eq'),og=nv('ci-og');var mat=(pz+eq)*(1+MARGEN/100),total=mo+fee+rec+mat,com=(mo+rec)*0.65,dev=pz*1.1;var tp=document.getElementById('ci-tp');if(!tp.dataset.tocado&&ciEp()!=='no')tp.value=(Math.round(total*100)/100).toFixed(2);var pag=ciEp()!=='no'?nv('ci-tp'):total;document.getElementById('ci-debe').textContent=ciEp()==='parcial'?'Debe '+m$(nv('ci-tp')-nv('ci-ab')):'';
document.getElementById('ci-res').innerHTML='Al cliente le corresponde <b>'+m$(total)+'</b> (mano de obra '+m$(mo)+' + coordinación '+m$(fee)+(rec?' + emergencia '+m$(rec):'')+(mat?' + piezas y equipo '+m$(mat):'')+')<br>Comisión del plomero (viernes): <b>'+m$(com)+'</b>'+(dev?' · piezas a devolverle (48 h): <b>'+m$(dev)+'</b>':'')+'<br>Le queda a Resuelto: <b>'+m$(pag-com-dev-eq-og)+'</b>'}
function ciPagado(){document.getElementById('ci-pago').style.display=ciEp()!=='no'?'':'none';document.getElementById('ci-abw').style.display=ciEp()==='parcial'?'':'none';ciCalc()}
document.getElementById('ci-tp').addEventListener('input',function(){this.dataset.tocado=1;ciCalc()});${c?.totalPagado != null ? "document.getElementById('ci-tp').dataset.tocado=1;" : ""}ciPagado();
function achicar(f){return new Promise(function(ok,ko){var i=new Image();i.onload=function(){var s=Math.min(1,1600/Math.max(i.width,i.height)),k=document.createElement('canvas');k.width=Math.round(i.width*s);k.height=Math.round(i.height*s);k.getContext('2d').drawImage(i,0,0,k.width,k.height);ok(k.toDataURL('image/jpeg',.8))};i.onerror=ko;i.src=URL.createObjectURL(f)})}
async function ciGuardar(){var b=document.getElementById('ci-g');if(!document.getElementById('ci-n').value.trim()){alert('Escribe una nota');return}b.disabled=true;var fs=[].slice.call(document.getElementById('ci-fot').files||[],0,4),ft=[].slice.call(document.getElementById('ci-ftr').files||[],0,4),rec=[],tra=[];try{for(var i=0;i<fs.length;i++)rec.push(await achicar(fs[i]));for(var k=0;k<ft.length;k++)tra.push(await achicar(ft[k]))}catch(e){alert('Una de las fotos no se pudo leer');b.disabled=false;return}
fetch('/portal/trabajos/${u(t.id)}/cierre',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mano_obra:document.getElementById('ci-mo').value,fee:document.getElementById('ci-fee').value,recargo:document.getElementById('ci-rec').value,piezas:document.getElementById('ci-pz').value,equipo:document.getElementById('ci-eq').value,otros_gastos:document.getElementById('ci-og').value,gastos_nota:document.getElementById('ci-ogn').value,pagado:document.getElementById('ci-pag').value,total_pagado:document.getElementById('ci-tp').value,abonado:document.getElementById('ci-ab').value,metodo:document.getElementById('ci-met').value,pagos:document.getElementById('ci-np').value,fecha_pago:document.getElementById('ci-fp').value,nota:document.getElementById('ci-n').value,recibos:rec,fotos_trabajo:tra})}).then(function(r){return r.json()}).then(function(j){if(j.ok){alert('Cierre guardado.');location.reload()}else{alert(j.motivo||'No se pudo');b.disabled=false}}).catch(function(){alert('Sin conexión');b.disabled=false})}
</script>`;
}

// ── Ventas: quién vendió, cuánto dejó cada venta y cuánto se lleva cada plomero (3/oct) ──
portal.get("/portal/ventas", requerir(), (req, res) => {
  const yo = (req as any).yo as staff.Staff;
  const hoyPR = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 7);
  const mes = /^\d{4}-\d{2}$/.test(String(req.query.mes ?? "")) ? String(req.query.mes) : req.query.mes === "todo" ? "todo" : hoyPR;
  const [y, m] = (mes === "todo" ? hoyPR : mes).split("-").map(Number);
  const rango = mes === "todo" ? { desde: 0, hasta: Date.now() + 365 * 86400_000 } : { desde: Date.UTC(y, m - 1, 1, 4), hasta: Date.UTC(y, m, 1, 4) };
  const otroMes = (d: number) => { const x = new Date(Date.UTC(y, m - 1 + d, 1)); return x.toISOString().slice(0, 7); };
  const nombreMes = (k: string) => new Date(k + "-15T12:00:00Z").toLocaleDateString("es-PR", { month: "long", year: "numeric" });
  const ts = almacen.trabajos();
  const origen = (t: Trabajo) => origenDe(t, { reservoPorPagina: !t.origen && leerHistorial(t.contactoId, 400).some((h) => h.texto.startsWith("[Reserva por la página]") && Math.abs(Date.parse(h.fecha) - Date.parse(t.creado)) < 3600_000), humanoDesde: almacen.contacto(t.contactoId)?.humanoDesde });
  const p = panelVentas(ts, rango, origen);
  const nombres = new Map(plomeros().map((x) => [x.id, x.nombre] as const)); const quien = (id: string) => nombres.get(id) ?? (id || "—");
  const porPagar = new Map<string, number>(); for (const t of ts) if (t.estado === "cobrado" && t.pagoPlomero != null && !t.pagadoAlPlomero) porPagar.set(t.plomeroId, (porPagar.get(t.plomeroId) ?? 0) + partesDelPago(t).comision);
  const tagO = (o: Origen) => `<span class="tag ${o === "agente" ? "ok" : o === "web" ? "info" : "warn"}">${e(NOMBRE_ORIGEN[o])}</span>`;
  const tabla = (titulo: string, filas: ReturnType<typeof panelVentas>["porOrigen"], nombre: (k: string) => string, extra?: (k: string) => string) => `<div class="card"><b>${titulo}</b><table style="margin-top:8px"><tr><th></th><th>Ventas</th><th>Cliente pagó</th><th>Comisión plomero</th><th>Piezas</th><th>Le queda a Resuelto</th>${extra ? "<th>Por pagar (viernes)</th>" : ""}</tr>${filas.map((g) => `<tr><td>${nombre(g.clave)}</td><td>${g.ventas}</td><td>${$(g.total)}</td><td>${$(g.comision)}</td><td>${$(g.piezas)}</td><td><b>${$(g.ganancia)}</b></td>${extra ? `<td>${extra(g.clave)}</td>` : ""}</tr>`).join("") || '<tr><td colspan="7" class="muted">Sin ventas en este periodo.</td></tr>'}</table></div>`;
  const k = p.kpis;
  res.type("html").send(pagina("Ventas", yo, "ventas", `<h1>Ventas</h1><p class="sub">${mes === "todo" ? "Desde el principio" : e(nombreMes(mes))} · <a href="/portal/ventas?mes=${otroMes(-1)}">← ${e(nombreMes(otroMes(-1)))}</a>${mes !== hoyPR ? ` · <a href="/portal/ventas">Este mes</a>` : ""} · <a href="/portal/ventas?mes=todo">Todo</a></p>
<div class="kpis"><div class="card kpi"><b>${k.ventas}</b><span>trabajos vendidos</span></div><div class="card kpi"><b>${$(k.total)}</b><span>pagaron los clientes</span></div><div class="card kpi"><b>${$(k.ganancia)}</b><span>le queda a Resuelto</span></div><div class="card kpi"><b>${$(k.comisiones)}</b><span>comisiones de plomeros</span></div><div class="card kpi"><b>${$(k.ticket)}</b><span>ticket promedio</span></div><div class="card kpi"><b>${$(k.porCobrar)}</b><span>por cobrar a clientes</span></div><div class="card kpi"><b>${k.agendados}</b><span>agendados · ~${$(k.agendadoEstimado)}${k.sinPlomero ? ` · <span style="color:#B6470F;font-weight:700">${k.sinPlomero} sin plomero</span>` : ""}</span></div></div>
${p.sinMontos.length ? `<div class="card" style="border:2px solid #F2621F"><b>⚠️ Cerrados sin montos:</b> ${p.sinMontos.map((id) => `<a href="/portal/trabajos/${u(id)}">${e(id)}</a>`).join(", ")}. No cuentan en los totales ni le salen al plomero. Ábrelos y usa <b>"Registrar cierre y pago"</b>.</div>` : ""}
${p.sinCierre.length ? `<div class="card" style="border:2px solid #F2C94C"><b>Falta registrar el cierre y el pago:</b> ${p.sinCierre.map((id) => `<a href="/portal/trabajos/${u(id)}#cierre">${e(id)}</a>`).join(", ")}. Hasta que se registre, el total es lo que le correspondía pagar al cliente, no lo que pagó.</div>` : ""}
<div class="g2">${tabla("¿Quién cerró la venta?", p.porOrigen, (o) => tagO(o as Origen))}${tabla("Por pueblo", p.porZona, (z) => e(z))}</div>
${tabla("Por plomero", p.porPlomero, (id) => `<a href="/portal/plomeros/${u(id)}">${e(quien(id))}</a>`, (id) => $(porPagar.get(id) ?? 0))}
<h2>Cada venta</h2><div class="card"><table><tr><th>Fecha</th><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Plomero</th><th>Quién cerró</th><th>Canal</th><th>Cliente pagó</th><th>Cómo pagó</th><th>Comisión</th><th>Piezas</th><th>Gastos</th><th>Le queda</th><th>Registró</th><th></th></tr>${p.filas.map((r) => `<tr class="click" onclick="location='/portal/trabajos/${u(r.id)}'"><td>${fd(r.fecha)}</td><td><b>${e(r.id)}</b></td><td>${e(r.cliente)}</td><td>${e(r.servicio)}<div class="muted">${e(r.municipio)}</div></td><td>${e(quien(r.plomero))}</td><td>${tagO(r.origen)}</td><td>${e(r.canal)}</td><td>${r.total ? (r.debe && r.debe < r.total ? `${$(r2(r.total - r.debe))} de ${$(r.total)}` : $(r.total)) : '<span class="tag warn">sin montos</span>'}</td><td>${e(r.metodo ?? "—")}</td><td>${$(r.comision)}</td><td>${$(r.piezas)}</td><td>${$(r.gastos)}</td><td><b>${$(r.ganancia)}</b></td><td>${r.registradoPor ? e(r.registradoPor) : '<span class="tag warn">falta</span>'}</td><td>${r.cobrado ? '<span class="tag ok">cobrado</span>' : `<span class="tag warn">debe ${$(r.debe)}</span>`}</td></tr>`).join("") || '<tr><td colspan="15" class="muted">Sin ventas en este periodo.</td></tr>'}</table></div>
<h2>Agendados (lo que viene)</h2><div class="card"><table><tr><th>Cita</th><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Plomero</th><th>Quién cerró</th><th>Valor estimado</th></tr>${p.agendados.map((a) => `<tr class="click" onclick="location='/portal/trabajos/${u(a.id)}'"><td>${f(a.inicio)}</td><td><b>${e(a.id)}</b></td><td>${e(a.cliente)}</td><td>${e(a.servicio)}<div class="muted">${e(a.municipio)}</div></td><td>${a.plomero ? e(quien(a.plomero)) : '<span class="tag warn">sin plomero</span>'}</td><td>${tagO(a.origen)}</td><td>${$(a.estimado)}</td></tr>`).join("") || '<tr><td colspan="7" class="muted">No hay citas agendadas.</td></tr>'}</table></div>
<p class="muted">"Le queda a Resuelto" = lo que pagó el cliente − comisión del plomero − piezas que se le devuelven − equipo que puso Resuelto − otros gastos. "Gastos" = equipo de Resuelto + otros gastos. "Agente + Heileen" = Heileen había hablado con el cliente antes de que el agente agendara.</p>`));
});

// ── Resumen del dueño (solo admin): anuncios vs. lo que dejaron los trabajos, mes por mes (3/oct) ──
portal.get("/portal/resumen", requerir("admin"), async (req, res) => {
  const yo = (req as any).yo as staff.Staff;
  const hoyPR = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
  const mes = /^\d{4}-\d{2}$/.test(String(req.query.mes ?? "")) ? String(req.query.mes) : hoyPR.slice(0, 7);
  const rangoDe = (k: string) => { const [y, m] = k.split("-").map(Number); return { desde: Date.UTC(y, m - 1, 1, 4), hasta: Date.UTC(y, m, 1, 4), d1: `${k}-01`, d2: k === hoyPR.slice(0, 7) ? hoyPR : new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) }; };
  const mesAntes = (k: string, n: number) => { const [y, m] = k.split("-").map(Number); return new Date(Date.UTC(y, m - 1 - n, 1)).toISOString().slice(0, 7); };
  const nombreMes = (k: string) => new Date(k + "-15T12:00:00Z").toLocaleDateString("es-PR", { month: "long", year: "numeric" });
  const ts = almacen.trabajos(); const R = rangoDe(mes); const r = resumenMes(ts, R); const ads = await gastoAnuncios(R.d1, R.d2);
  const gasto = ads.ok ? ads.total : 0;
  const meses = await Promise.all([0, 1, 2, 3, 4, 5].map(async (n) => { const k = mesAntes(mes, n), rr = rangoDe(k), x = resumenMes(ts, rr); const a = k < "2026-09" ? null : await gastoAnuncios(rr.d1, rr.d2); return { k, x, a }; }));
  const kpi = (v: string, t: string, color = "") => `<div class="card kpi"><b${color ? ` style="color:${color}"` : ""}>${v}</b><span>${t}</span></div>`;
  const fila = (k: string, v: string, fuerte = false, nota = "") => `<tr><td>${fuerte ? `<b>${k}</b>` : k}${nota ? `<div class="muted">${nota}</div>` : ""}</td><td style="text-align:right">${fuerte ? `<b>${v}</b>` : v}</td></tr>`;
  const final = r2(r.neto - gasto);
  res.type("html").send(pagina("Resumen", yo, "resumen", `<h1>Resumen</h1><p class="sub">${e(nombreMes(mes))} · <a href="/portal/resumen?mes=${mesAntes(mes, 1)}">← ${e(nombreMes(mesAntes(mes, 1)))}</a>${mes !== hoyPR.slice(0, 7) ? ` · <a href="/portal/resumen">Este mes</a>` : ""}</p>
<div class="kpis">${kpi(ads.ok ? $(gasto) : "—", "gastado en anuncios")}${kpi($(r.facturado), "facturado (todo incluido)")}${kpi($(r.sinPiezas), "facturado sin piezas")}${kpi($(r.neto), "neto de los trabajos")}${kpi($(final), "neto después de anuncios", final < 0 ? "#B6470F" : "#157A53")}${kpi(String(r.trabajos), "trabajos realizados")}</div>
${ads.ok ? "" : `<div class="card" style="border:2px solid #F2C94C">No pude leer el gasto en anuncios: ${e(ads.motivo)}.</div>`}
<div class="g2"><div class="card"><b>Los trabajos del mes</b><table style="margin-top:8px">
${fila("Facturado, todo incluido", $(r.facturado), true, `${r.trabajos} trabajo(s)${r.porCobrar ? ` · ${$(r.porCobrar)} todavía por cobrar` : ""}`)}
${fila("Mano de obra", $(r.manoObra))}${fila("Coordinación ($19 por visita)", $(r.coordinacion))}${r.recargos ? fila("Recargos de emergencia", $(r.recargos)) : ""}
${fila("Facturado sin piezas", $(r.sinPiezas), true, "mano de obra + coordinación + recargos")}
${fila("Piezas y equipo cobrados al cliente", $(r.piezasCobradas))}
</table></div><div class="card"><b>A dónde se fue</b><table style="margin-top:8px">
${fila("Comisiones de plomeros", "− " + $(r.comisiones), false, "65 % de la mano de obra")}
${fila("Compras de piezas y equipo", "− " + $(r.compraPiezas), false, "costo (las del plomero se le devuelven + 10 %)")}
${fila("10 % de manejo a plomeros", "− " + $(r2(r.devolucionPiezas - (r.devolucionPiezas / 1.1))))}
${r.otrosGastos ? fila("Otros gastos", "− " + $(r.otrosGastos)) : ""}
${fila("Neto de los trabajos", $(r.neto), true, "lo que sobró antes de anuncios")}
${fila("Anuncios en Meta", ads.ok ? "− " + $(gasto) : "—", false, ads.ok ? `clientes ${$(ads.clientes)} · reclutamiento ${$(ads.reclutamiento)}` : "")}
${fila("Neto después de anuncios", $(final), true)}
</table>${ads.ok && r.trabajos ? `<p class="muted" style="margin-top:8px">Anuncios de clientes: ${$(ads.clientes)} · ${ads.conversaciones} conversaciones (${ads.conversaciones ? $(r2(ads.clientes / ads.conversaciones)) : "—"} c/u) · ${$(r2(ads.clientes / r.trabajos))} por trabajo realizado.</p>` : ""}</div></div>
<h2>Cada trabajo</h2><div class="card"><table><tr><th>Fecha</th><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Facturado</th><th>Sin piezas</th><th>Mano de obra</th><th>Piezas compradas</th><th>Comisión</th><th>Otros</th><th>Neto</th></tr>${r.filas.map((f) => `<tr class="click" onclick="location='/portal/trabajos/${u(f.id)}'"><td>${fd(f.fecha)}</td><td><b>${e(f.id)}</b></td><td>${e(f.cliente)}</td><td>${e(f.servicio)}</td><td>${$(f.facturado)}${f.debe ? `<div class="muted">debe ${$(f.debe)}</div>` : ""}</td><td>${$(f.sinPiezas)}</td><td>${$(f.mano)}</td><td>${$(f.compraPiezas)}</td><td>${$(f.comision)}</td><td>${$(f.otros)}</td><td><b>${$(f.neto)}</b></td></tr>`).join("") || '<tr><td colspan="11" class="muted">Sin trabajos terminados este mes.</td></tr>'}</table></div>
<h2>Mes por mes</h2><div class="card"><table><tr><th>Mes</th><th>Trabajos</th><th>Facturado</th><th>Sin piezas</th><th>Piezas compradas</th><th>Neto trabajos</th><th>Anuncios</th><th>Neto final</th></tr>${meses.map(({ k, x, a }) => `<tr class="click" onclick="location='/portal/resumen?mes=${k}'"><td>${e(nombreMes(k))}</td><td>${x.trabajos}</td><td>${$(x.facturado)}</td><td>${$(x.sinPiezas)}</td><td>${$(x.compraPiezas)}</td><td>${$(x.neto)}</td><td>${a?.ok ? $(a.total) : "—"}</td><td><b>${$(r2(x.neto - (a?.ok ? a.total : 0)))}</b></td></tr>`).join("")}</table></div>
${ads.ok && ads.porCampana.length ? `<h2>Anuncios por campaña</h2><div class="card"><table><tr><th>Campaña</th><th>Gasto</th><th>Conversaciones</th><th>Costo c/u</th></tr>${ads.porCampana.map((c) => `<tr><td>${e(c.nombre)}</td><td>${$(c.gasto)}</td><td>${c.conversaciones}</td><td>${c.conversaciones ? $(r2(c.gasto / c.conversaciones)) : "—"}</td></tr>`).join("")}</table></div>` : ""}
<p class="muted">Solo trabajos terminados con montos. "Facturado" usa lo que el cliente pagó (o acordó pagar) si se registró el cierre. El gasto en anuncios viene de Meta (se actualiza cada hora).</p>`));
});

// ── Inicio ──
portal.get("/portal", requerir(), (req, res) => {
  const yo = (req as any).yo as staff.Staff; const ts = almacen.trabajos(); const hoy = new Date().toLocaleDateString("en-CA", { timeZone: config.zonaHoraria });
  const deHoy = ts.filter((t) => new Date(t.inicio).toLocaleDateString("en-CA", { timeZone: config.zonaHoraria }) === hoy && t.estado !== "cancelado");
  const enCurso = ts.filter((t) => ["en-camino", "en-sitio"].includes(t.estado)); const porCobrar = ts.filter((t) => t.estado === "completado" && !t.garantiaDe);
  const garantias = ts.filter((t) => t.garantiaDe && !["completado", "cobrado", "cancelado"].includes(t.estado));
  const activos = plomeros().filter((p) => p.estado === "activo").length;
  const porPagar = ts.filter((t) => t.pagoPlomero != null && !t.pagadoAlPlomero && t.estado === "cobrado").reduce((a, t) => a + partesDelPago(t).comision, 0);
  const piezasPend = ts.filter((t) => t.terminadoEn && !piezasDevueltas(t)).reduce((a, t) => a + partesDelPago(t).piezas, 0);
  const fila = (t: Trabajo) => `<tr class="click" onclick="location='/portal/trabajos/${u(t.id)}'"><td><b>${e(t.id)}</b></td><td>${e(t.nombre)}<div class="muted">${e(t.municipio)}</div></td><td>${e(t.servicio)}</td><td>${e(t.plomeroId || "sin asignar")}</td><td>${tagEstado(t.estado)}</td><td>${f(t.inicio)}</td></tr>`;
  res.type("html").send(pagina("Inicio", yo, "inicio", `<h1>${(() => { const h = Number(new Date().toLocaleString("en-US", { timeZone: config.zonaHoraria, hour: "numeric", hour12: false })) % 24; return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; })()}, ${e(yo.nombre.split(" ")[0])}</h1><p class="sub">Lo que está pasando hoy en Resuelto.</p>
<form action="/portal/clientes" class="card row"><input name="q" placeholder="Buscar cliente por nombre, teléfono o dirección…" autofocus style="flex:1"><button class="btn">Buscar</button></form>
<div class="kpis"><div class="card kpi"><b>${deHoy.length}</b><span>trabajos hoy</span></div><div class="card kpi"><b>${enCurso.length}</b><span>en curso ahora</span></div><div class="card kpi"><b>${porCobrar.length}</b><span>terminados por cobrar</span></div><div class="card kpi"><b>${garantias.length}</b><span>garantías abiertas</span></div><div class="card kpi"><b>${activos}</b><span>plomeros activos</span></div><div class="card kpi"><b>${$(porPagar)}</b><span>por pagar a plomeros (viernes)</span></div>${piezasPend ? `<div class="card kpi"><b>${$(piezasPend)}</b><span>piezas por devolver (48 h)</span></div>` : ""}</div>
<h2>Hoy</h2><div class="card"><table><tr><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Plomero</th><th>Estado</th><th>Ventana</th></tr>${deHoy.map(fila).join("") || '<tr><td colspan="6" class="muted">No hay trabajos para hoy.</td></tr>'}</table></div>
${porCobrar.length ? `<h2>Terminados sin cobrar</h2><div class="card"><table><tr><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Plomero</th><th>Estado</th><th>Ventana</th></tr>${porCobrar.map(fila).join("")}</table></div>` : ""}
${garantias.length ? `<h2>Garantías abiertas</h2><div class="card"><table><tr><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Plomero</th><th>Estado</th><th>Ventana</th></tr>${garantias.map(fila).join("")}</table></div>` : ""}`));
});

// ── Clientes ──
portal.get("/portal/clientes", requerir(), (req, res) => {
  const yo = (req as any).yo; const q = norm(req.query.q); const todos = req.query.todos === "1";
  let cs = listaContactos().filter((c) => todos || c.tipo === "cliente" || c.tipo === "cliente-proyecto" || trabajosDe(c.id).length);
  if (q) cs = listaContactos().filter((c) => [c.nombre, c.telefono, c.identificador, c.direccion, c.municipio].some((x) => norm(x).includes(q)) || (tel(q) && tel(c.telefono ?? c.identificador).includes(tel(q))));
  cs.sort((a, b) => (b.actualizado ?? "").localeCompare(a.actualizado ?? ""));
  const filas = cs.slice(0, 200).map((c) => { const ts = trabajosDe(c.id); const g = ts.find((t) => vigenciaGarantia(t).vigente);
    return `<tr class="click" onclick="location='/portal/clientes/${u(c.id)}'"><td><b>${e(c.nombre ?? "(sin nombre)")}</b><div class="muted">${e(c.telefono ?? c.identificador)}</div></td><td>${e(c.municipio ?? "—")}</td><td>${e(c.tipo ?? "—")}</td><td>${ts.length}</td><td>${ts[0] ? e(ts[0].servicio) + '<div class="muted">' + fd(ts[0].inicio) + "</div>" : "—"}</td><td>${g ? '<span class="tag ok">Garantía vigente</span>' : ""}</td></tr>`; }).join("");
  res.type("html").send(pagina("Clientes", yo, "clientes", `<h1>Clientes</h1><p class="sub">${q ? `Resultados para "${e(req.query.q)}"` : todos ? "Todos los contactos" : "Clientes con trabajos o agendados"} · ${cs.length}</p>
<form class="card row"><input name="q" value="${e(req.query.q ?? "")}" placeholder="Nombre, teléfono, dirección o municipio" style="flex:1"><button class="btn">Buscar</button>${todos ? "" : '<a class="btn l" href="/portal/clientes?todos=1">Ver todos los contactos</a>'}</form>
<div class="card"><table><tr><th>Cliente</th><th>Municipio</th><th>Tipo</th><th>Trabajos</th><th>Último</th><th></th></tr>${filas || '<tr><td colspan="6" class="muted">No encontré a nadie.</td></tr>'}</table></div>`));
});
portal.get("/portal/clientes/:id", requerir(), (req, res) => {
  const yo = (req as any).yo; const c = almacen.contacto(req.params.id); if (!c) return res.status(404).type("html").send(pagina("No existe", yo, "clientes", "<h1>No encuentro ese cliente</h1>"));
  const ts = trabajosDe(c.id); const hist = leerHistorial(c.id).reverse(); const t0 = tel(c.telefono ?? c.identificador);
  const filas = ts.map((t) => { const g = vigenciaGarantia(t); return `<tr class="click" onclick="location='/portal/trabajos/${u(t.id)}'"><td><b>${e(t.id)}</b>${t.garantiaDe ? `<div class="muted">garantía de ${e(t.garantiaDe)}</div>` : ""}</td><td>${e(t.servicio)}</td><td>${e(t.plomeroId || "—")}</td><td>${fd(t.inicio)}</td><td>${tagEstado(t.estado)}</td><td>${$(t.totalCliente)}</td><td>${g.vigente ? `<span class="tag ok">hasta ${fd(g.vence)}</span>` : g.vence ? `<span class="muted">venció ${fd(g.vence)}</span>` : "—"}</td></tr>`; }).join("");
  const eventos = hist.map((h) => `<div class="ev ${e(h.autor)}"><small>${f(h.fecha)} · ${e({ cliente: "Cliente", resuelto: "Agente Resuelto", humano: "Humano (inbox)", plomero: "Plomero", sistema: "Sistema", staff: "Equipo" }[h.autor] ?? h.autor)}${h.ref ? " · " + e(h.ref) : ""}</small><div>${e(h.texto).replace(/\n/g, "<br>")}</div></div>`).join("");
  res.type("html").send(pagina(c.nombre ?? "Cliente", yo, "clientes", `<p class="muted"><a href="/portal/clientes">← Clientes</a></p><h1>${e(c.nombre ?? "(sin nombre)")}</h1>
<p class="sub">${e(c.tipo ?? "contacto")} · cliente desde ${fd(c.creado)} · vía ${e(c.canal)}</p>
<div class="g2"><div class="card"><b>Contacto</b><p style="margin-top:6px">📞 ${t0 ? `<a href="tel:+${t0}">${e(c.telefono ?? c.identificador)}</a> · <a href="https://wa.me/${t0}" target="_blank">WhatsApp</a>` : "—"}<br>📍 ${e(c.direccion ?? "—")}${c.municipio ? ", " + e(c.municipio) : ""}${c.humano ? '<br><span class="tag warn">Un humano está atendiendo (el agente calla)</span>' : ""}</p></div>
<div class="card"><b>Notas</b>${(c.notas ?? []).slice(-8).reverse().map((n) => `<p class="muted" style="margin-top:6px">${e(n)}</p>`).join("") || '<p class="muted">Sin notas.</p>'}
<div class="row" style="margin-top:10px"><input id="nota" placeholder="Agregar nota interna…" style="flex:1"><button class="btn l" onclick="post('/portal/clientes/${u(c.id)}/nota',{texto:document.getElementById('nota').value})">Guardar</button></div></div></div>
<h2>Trabajos (${ts.length})</h2><div class="card"><table><tr><th>Trabajo</th><th>Servicio</th><th>Plomero</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Garantía</th></tr>${filas || '<tr><td colspan="7" class="muted">Todavía no tiene trabajos.</td></tr>'}</table></div>
<h2>Historial completo</h2><div class="card">${eventos || '<p class="muted">Sin mensajes registrados todavía (el historial permanente arrancó el 23/sep/2026).</p>'}</div>`));
});
portal.post("/portal/clientes/:id/nota", requerir(), express.json(), (req, res) => {
  const yo = (req as any).yo as staff.Staff; const c = almacen.contacto(req.params.id); const texto = String(req.body?.texto ?? "").trim();
  if (!c || !texto) return res.json({ ok: false, motivo: "Escribe la nota." });
  almacen.guardarContacto({ ...c, notas: [...(c.notas ?? []), `${new Date().toISOString().slice(0, 10)}: [${yo.nombre}] ${texto}`].slice(-50) });
  archivar(c.id, "staff", `${yo.nombre}: ${texto}`); res.json({ ok: true });
});

// ── Trabajos ──
portal.get("/portal/trabajos", requerir(), (req, res) => {
  const yo = (req as any).yo; const est = String(req.query.estado ?? "");
  const ts = almacen.trabajos().filter((t) => !est || t.estado === est).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const filtros = ["", "agendado", "en-camino", "en-sitio", "completado", "cobrado", "cancelado"].map((s) => `<a class="btn ${s === est ? "" : "l"}" href="/portal/trabajos${s ? "?estado=" + s : ""}">${s ? ESTADO_TXT[s] : "Todos"}</a>`).join(" ");
  res.type("html").send(pagina("Trabajos", yo, "trabajos", `<h1>Trabajos</h1><p class="sub">${ts.length} ${est ? "· " + e(ESTADO_TXT[est]) : ""}</p><div class="row" style="margin-bottom:12px">${filtros}</div>
<div class="card"><table><tr><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Plomero</th><th>Ventana</th><th>Estado</th><th>Total</th></tr>${ts.map((t) => `<tr class="click" onclick="location='/portal/trabajos/${u(t.id)}'"><td><b>${e(t.id)}</b></td><td>${e(t.nombre)}<div class="muted">${e(t.municipio)}</div></td><td>${e(t.servicio)}</td><td>${e(t.plomeroId || "—")}</td><td>${f(t.inicio)}</td><td>${tagEstado(t.estado)}</td><td>${$(t.totalCliente)}</td></tr>`).join("") || '<tr><td colspan="7" class="muted">Nada por aquí.</td></tr>'}</table></div>`));
});
portal.get("/portal/trabajos/:id", requerir(), (req, res) => {
  const yo = (req as any).yo; const t = almacen.trabajos().find((x) => x.id === req.params.id);
  if (!t) return res.status(404).type("html").send(pagina("No existe", yo, "trabajos", "<h1>No encuentro ese trabajo</h1>"));
  const o = despacho.ofertas().find((x) => x.referencia === t.id); const g = vigenciaGarantia(t);
  const pasos: [string, string | undefined][] = [["Agendado", t.creado], ["Aceptado por " + (o?.aceptadoPor ?? "—"), o?.aceptadoEn], ["En camino", t.enCaminoEn], ["Llegó", t.llegadaEn], ["Terminado", t.terminadoEn]];
  const fotos = (l?: string[]) => (l ?? []).map((x) => `<a href="/portal/fotos/${u(x)}" target="_blank"><img src="/portal/fotos/${u(x)}" loading="lazy"></a>`).join("") || '<span class="muted">Sin fotos.</span>';
  const ventanas = ((territorios as any).ventanas as string[]) ?? ["08:00-10:00", "10:00-12:00", "13:00-15:00", "15:00-17:00"];
  const manana = new Date(Date.now() + 86400_000).toLocaleDateString("en-CA", { timeZone: config.zonaHoraria });
  res.type("html").send(pagina(t.id, yo, "trabajos", `<p class="muted"><a href="/portal/trabajos">← Trabajos</a> · <a href="/portal/clientes/${u(t.contactoId)}">Ficha de ${e(t.nombre)}</a></p>
<h1>${e(t.id)} · ${e(t.servicio)}</h1><p class="sub">${tagEstado(t.estado)} ${t.garantiaDe ? `· garantía de <a href="/portal/trabajos/${u(t.garantiaDe)}">${e(t.garantiaDe)}</a>` : ""}</p>
<div class="g2"><div class="card"><b>Cliente</b><p style="margin-top:6px">${e(t.nombre)} · <a href="tel:${tel(t.telefono).replace(/^1?(\d{10})$/, "+1$1")}">${e(t.telefono)}</a><br>📍 ${e(t.direccion)}${norm(t.direccion).includes(norm(t.municipio)) ? "" : ", " + e(t.municipio)}${t.referencia ? `<br><span class="muted">Ref: ${e(t.referencia)}</span>` : ""}<br>🕑 ${f(t.inicio)}${t.emergencia ? ' <span class="tag warn">Emergencia</span>' : ""}</p></div>
<div class="card"><b>Dinero</b><p style="margin-top:6px">Mano de obra: ${$(t.manoObraFinal ?? t.manoObra)}${t.rango ? ` <span class="muted">(rango $${t.rango[0]}–$${t.rango[1]})</span>` : ""}<br>Materiales (costo): ${$(t.materialesCosto)}<br>Coordinación: ${$(t.fee)}<br><b>Cliente paga: ${$(t.totalCliente)}</b><br>Comisión del plomero (viernes, 65 % de la mano de obra): ${t.pagoPlomero == null ? "—" : $(partesDelPago(t).comision)} ${t.pagadoAlPlomero ? `<span class="tag ok">pagado ${e(t.pagadoAlPlomero)}</span>` : ""}${partesDelPago(t).piezas ? `<br>Piezas a devolverle en 48 h (costo + 10 %): ${$(partesDelPago(t).piezas)} ${piezasDevueltas(t) ? `<span class="tag ok">devueltas${t.piezasDevueltas ? " " + e(t.piezasDevueltas) : ""}</span>` : `<span class="tag warn">pendiente</span>`}` : ""}</p>
${resumenCierre(t)}<div class="row" style="margin-top:10px">${t.estado === "completado" && !t.garantiaDe ? `<button class="btn l" onclick="var d=document.getElementById('cierre');d.open=true;document.getElementById('ci-pag').value='si';ciPagado();d.scrollIntoView({behavior:'smooth'})">Marcar cobrado</button>` : ""}${t.pagoPlomero != null && !t.pagadoAlPlomero ? (faltaParaPagar(t).length ? `<span class="tag warn" style="margin:6px 0">No se le paga al plomero hasta que suba: ${e(faltaParaPagar(t).join(" y "))}</span>` : `<button class="btn l" onclick="post('/portal/trabajos/${u(t.id)}/accion',{que:'pagado-plomero'})">Marcar pagado al plomero</button>`) : ""}${partesDelPago(t).piezas && !piezasDevueltas(t) ? `<button class="btn l" onclick="post('/portal/trabajos/${u(t.id)}/accion',{que:'piezas-devueltas'})">Marcar piezas devueltas</button>` : ""}${["agendado", "en-camino"].includes(t.estado) ? `<button class="btn l" onclick="if(confirm('¿Cancelar este trabajo? Se le avisa al cliente.'))post('/portal/trabajos/${u(t.id)}/accion',{que:'cancelar'})">Cancelar</button>` : ""}</div></div></div>
${t.estado !== "cancelado" && !t.garantiaDe ? formCierre(t) : ""}
<h2>Línea de tiempo</h2><div class="card">${pasos.map(([k, v]) => `<div class="ev ${v ? "plomero" : ""}"><small>${v ? f(v) : "pendiente"}</small><div>${e(k)}</div></div>`).join("")}</div>
<div class="g2"><div><h2>Fotos del antes</h2><div class="card fotos">${fotos(t.fotosAntes)}</div></div><div><h2>Fotos del después</h2><div class="card fotos">${fotos(t.fotosDespues)}</div></div></div>
<h2>Notas del plomero y del equipo</h2><div class="card">${t.notaCierre ? `<div class="ev plomero"><small>Al cerrar</small><div>${e(t.notaCierre)}</div></div>` : ""}${(t.notasInternas ?? []).map((n) => `<div class="ev ${n.autor.startsWith("plomero") ? "plomero" : "staff"}"><small>${f(n.fecha)} · ${e(n.autor.replace(/^(plomero|staff):/, ""))}</small><div>${e(n.texto)}</div></div>`).join("") || (t.notaCierre ? "" : '<p class="muted">Sin notas.</p>')}
<div class="row" style="margin-top:10px"><input id="nt" placeholder="Nota interna del equipo…" style="flex:1"><button class="btn l" onclick="post('/portal/trabajos/${u(t.id)}/nota',{texto:document.getElementById('nt').value})">Guardar</button></div></div>
${g.vigente ? `<h2>Garantía · vigente hasta ${fd(g.vence)}</h2><div class="card"><p class="muted">Crea un re-trabajo sin costo para el cliente y se lo ofrece SOLO al plomero original (${e(t.plomeroId || "sin plomero")}) con 48 h para aceptar. Si no acepta, te avisa para reasignar.</p>
<label>¿Qué pasó?</label><textarea id="gm" placeholder="Ej: volvió a tapar el fregadero a las 3 semanas"></textarea><div class="g2"><div><label>Fecha</label><input id="gf" type="date" value="${manana}"></div><div><label>Ventana</label><select id="gv">${ventanas.map((v) => `<option>${v}</option>`).join("")}</select></div></div>
<p style="margin-top:12px"><button class="btn" onclick="var m=document.getElementById('gm').value.trim();if(!m){alert('Explica qué pasó');return}post('/portal/trabajos/${u(t.id)}/garantia',{motivo:m,fecha:document.getElementById('gf').value,ventana:document.getElementById('gv').value},'Garantía abierta. Se le avisó al cliente y al plomero.')">Abrir garantía</button></p></div>` : g.vence ? `<h2>Garantía</h2><div class="card muted">Venció el ${fd(g.vence)}.</div>` : ""}`));
});
portal.post("/portal/trabajos/:id/accion", requerir(), express.json(), async (req, res) => {
  const yo = (req as any).yo as staff.Staff; const t = almacen.trabajos().find((x) => x.id === req.params.id); if (!t) return res.json({ ok: false, motivo: "No existe." });
  const que = String(req.body?.que ?? "");
  if (que === "cobrado") { almacen.guardarTrabajo({ ...t, estado: "cobrado", cobradoEn: t.cobradoEn ?? new Date().toISOString() }); archivar(t.contactoId, "staff", `${yo.nombre} marcó ${t.id} como cobrado.`, t.id); }
  else if (que === "pagado-plomero") { const f = faltaParaPagar(t); if (f.length) return res.json({ ok: false, motivo: `No se le puede pagar todavía: falta ${f.join(" y ")}.` }); almacen.guardarTrabajo({ ...t, pagadoAlPlomero: new Date().toISOString().slice(0, 10) }); }
  else if (que === "piezas-devueltas") { almacen.guardarTrabajo({ ...t, piezasDevueltas: new Date().toISOString().slice(0, 10) }); archivar(t.contactoId, "staff", `${yo.nombre} devolvió las piezas de ${t.id} al plomero.`, t.id); }
  else if (que === "cancelar") {
    almacen.guardarTrabajo({ ...t, estado: "cancelado" }); archivar(t.contactoId, "staff", `${yo.nombre} canceló ${t.id}.`, t.id);
    await avisarCoordinador(`❌ ${yo.nombre} canceló ${t.id} (${t.nombre}).`).catch(() => undefined);
  } else return res.json({ ok: false, motivo: "Acción inválida." });
  res.json({ ok: true });
});
portal.post("/portal/trabajos/:id/cierre", requerir(), async (req, res) => {
  const yo = (req as any).yo as staff.Staff; const t = almacen.trabajos().find((x) => x.id === req.params.id); if (!t) return res.json({ ok: false, motivo: "No existe." });
  if (t.estado === "cancelado" || t.garantiaDe) return res.json({ ok: false, motivo: "No aplica a trabajos cancelados ni a garantías." });
  const v = validarCierre(req.body, { fee: t.fee, recargo: t.emergencia ? menu.recargo_emergencia : 0 }); if (!v.ok) return res.json(v);
  const ahora = new Date().toISOString(); const c = { ...v.datos, por: yo.nombre, registrado: ahora };
  const recibos = [...(t.recibos ?? [])];
  for (const d of (Array.isArray(req.body?.recibos) ? req.body.recibos : []).slice(0, 4)) {
    const m = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(String(d)); if (!m || recibos.length >= 12) continue;
    const archivo = `${t.id}-recibo-${recibos.length + 1}-${Date.now().toString(36)}.jpg`;
    try { await sharp(Buffer.from(m[1], "base64")).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(path.join(ciclo.DIR_FOTOS, archivo)); recibos.push(archivo); } catch { return res.json({ ok: false, motivo: "Una de las fotos no se pudo guardar." }); }
  }
  const despues = [...(t.fotosDespues ?? [])];
  for (const d of (Array.isArray(req.body?.fotos_trabajo) ? req.body.fotos_trabajo : []).slice(0, 4)) {
    const m = /^data:image\/[a-z+.-]+;base64,(.+)$/i.exec(String(d)); if (!m || despues.length >= 12) continue;
    const archivo = `${t.id}-despues-staff-${despues.length + 1}-${Date.now().toString(36)}.jpg`;
    try { await sharp(Buffer.from(m[1], "base64")).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 78 }).toFile(path.join(ciclo.DIR_FOTOS, archivo)); despues.push(archivo); } catch { return res.json({ ok: false, motivo: "Una de las fotos del trabajo no se pudo guardar." }); }
  }
  if (!despues.length) return res.json({ ok: false, motivo: "Sube al menos una foto del trabajo terminado (pídesela al plomero). Sin foto no se le paga." });
  if (c.piezasPlomero > 0 && !recibos.length) return res.json({ ok: false, motivo: "El plomero compró piezas: sube la foto del recibo (por si hay garantía y para devolvérselas)." });
  const antes = t.cierre ? `antes: cliente ${$(t.cierre.totalPagado ?? t.totalCliente)} · comisión ${$(partesDelPago(t).comision)}` : "";
  const nuevo = { ...t, ...aplicarCierre(t, c, menu.manejo_materiales_pct, ahora), recibos, fotosDespues: despues,
    notasInternas: [...(t.notasInternas ?? []), { fecha: ahora, autor: `staff:${yo.nombre}`, texto: `${t.cierre ? "Editó" : "Registró"} el cierre: ${c.pagado ? `cliente pagó ${$(c.totalPagado)} por ${c.metodo}` : c.abonado ? `cliente pagó ${$(c.abonado)} de ${$(c.totalPagado)} por ${c.metodo}` : "cliente todavía no paga"} · mano de obra ${$(c.manoObra)} · coordinación ${$(c.fee)}${c.piezasPlomero ? ` · piezas del plomero ${$(c.piezasPlomero)}` : ""}${c.equipoResuelto ? ` · equipo de Resuelto ${$(c.equipoResuelto)}` : ""}${c.otrosGastos ? ` · otros gastos ${$(c.otrosGastos)} (${c.gastosNota})` : ""}. ${c.nota}` }] };
  almacen.guardarTrabajo(nuevo);
  archivar(t.contactoId, "staff", `${yo.nombre} registró el cierre de ${t.id}: ${c.pagado ? `pagó ${$(c.totalPagado)} por ${c.metodo}` : "pendiente de pago"}. ${c.nota}`, t.id);
  await avisarCoordinador(`🧾 ${yo.nombre} ${t.cierre ? "editó" : "registró"} el cierre de ${t.id} (${t.nombre}, ${t.servicio})\n${c.pagado ? `Pagó ${$(c.totalPagado)} por ${c.metodo}${(c.pagos ?? 1) > 1 ? ` en ${c.pagos} pagos` : ""}` : c.abonado ? `Pagó ${$(c.abonado)} de ${$(c.totalPagado)} por ${c.metodo} · debe ${$(r2((c.totalPagado ?? 0) - c.abonado))}` : "Todavía no ha pagado"} · le correspondía ${$(nuevo.totalCliente)}\nComisión plomero ${$(nuevo.pagoPlomero)}${nuevo.piezasPlomero ? ` + piezas ${$(nuevo.piezasPlomero)}` : ""}${c.equipoResuelto ? ` · equipo Resuelto ${$(c.equipoResuelto)}` : ""}${c.otrosGastos ? ` · otros gastos ${$(c.otrosGastos)}` : ""}\nLe queda a Resuelto: ${$(ganancia(nuevo))}${antes ? `\n(${antes})` : ""}\n${c.nota}`).catch(() => undefined);
  res.json({ ok: true });
});
portal.post("/portal/trabajos/:id/nota", requerir(), express.json(), (req, res) => {
  const yo = (req as any).yo as staff.Staff; const t = almacen.trabajos().find((x) => x.id === req.params.id); const texto = String(req.body?.texto ?? "").trim();
  if (!t || !texto) return res.json({ ok: false, motivo: "Escribe la nota." });
  almacen.guardarTrabajo({ ...t, notasInternas: [...(t.notasInternas ?? []), { fecha: new Date().toISOString(), autor: `staff:${yo.nombre}`, texto }] });
  archivar(t.contactoId, "staff", `${yo.nombre} sobre ${t.id}: ${texto}`, t.id); res.json({ ok: true });
});
portal.post("/portal/trabajos/:id/garantia", requerir(), express.json(), async (req, res) => {
  const yo = (req as any).yo as staff.Staff; const [a, b] = String(req.body?.ventana ?? "08:00-10:00").split("-"); const fecha = String(req.body?.fecha ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return res.json({ ok: false, motivo: "Fecha inválida." });
  res.json(await abrirGarantia(req.params.id, { motivo: String(req.body?.motivo ?? ""), inicio: `${fecha}T${a}:00-04:00`, fin: `${fecha}T${b}:00-04:00`, autor: yo.nombre }));
});
portal.get("/portal/fotos/:archivo", requerir(), (req, res) => { const p = path.join(ciclo.DIR_FOTOS, path.basename(req.params.archivo)); if (!fs.existsSync(p)) return res.status(404).end(); res.type("jpg").send(fs.readFileSync(p)); });

// ── Plomeros ──
// Autorización de depósito directo (9/oct/2026): firmada, enviada o falta. Nunca muestra el número de cuenta.
function depositoDe(p: { whatsapp: string }) {
  const tel = (x: string) => String(x ?? "").replace(/\D/g, "").slice(-10);
  const fs = listarFirmas().filter((f) => f.tipo === "deposito" && f.estado !== "anulado" && tel(f.telefono).length === 10 && tel(f.telefono) === tel(p.whatsapp));
  const firmada = fs.find((f) => f.estado === "firmado");
  if (firmada) { const d = firmada.firmado!.datos; return { clave: "ok" as const, texto: `🏦 Depósito directo: ${d.banco ?? ""} · ${d.tipo_cuenta ?? ""} ••••${String(d.cuenta ?? "").slice(-4)}`, pdf: enlacePdf(firmada) }; }
  if (fs.length) return { clave: "enviada" as const, texto: fs[0].abierto ? "🏦 Depósito directo: lo abrió, falta que firme" : "🏦 Depósito directo: enviado, no lo ha abierto" };
  return { clave: "falta" as const, texto: "🏦 Falta la autorización de depósito directo" };
}
function bienvenida(nombre: string, link: string) {
  return `¡Bienvenido a Resuelto, ${nombre.split(" ")[0]}! 🔧\n\nEsta es tu app para recibir trabajos:\n${link}\n\n1️⃣ Ábrela y añádela a tu pantalla de inicio (queda como una app).\n2️⃣ Toca "Activar alertas" para que te avise al celular.\n3️⃣ Cuando salga un trabajo en tu zona te llega la alerta: el primero que acepta se lo lleva.\n4️⃣ En cada trabajo: "Voy en camino" → "Llegué" → fotos del antes y el después → "Terminé". Resuelto le cobra al cliente y tú cobras el viernes.\n\nCualquier duda, escríbenos por aquí.`;
}
portal.get("/portal/plomeros", requerir(), (req, res) => {
  const yo = (req as any).yo; const ps = [...plomeros()].sort((a, b) => Number(b.estado === "activo") - Number(a.estado === "activo"));
  const cuentas = ps.map((p) => ({ p, c: ciclo.cuentaSemanal(p) }));
  const suma = (f: (c: ReturnType<typeof ciclo.cuentaSemanal>) => number) => r2(cuentas.reduce((a, x) => a + f(x.c), 0));
  const viernes = cuentas[0]?.c.esteViernes.fecha;
  const aPagar = suma((c) => c.esteViernes.total), piezasDev = suma((c) => c.piezas.porDevolver.total), esperando = suma((c) => c.esperandoCliente.total), sinFotos = suma((c) => c.faltanFotos.total), siguiente = suma((c) => c.siguienteViernes.total);
  const filas = cuentas.map(({ p, c }) => { const detenido = [c.esperandoCliente.total ? `⏳ cliente no ha pagado: ${$(c.esperandoCliente.total)}` : "", c.faltanFotos.total ? `📷 faltan fotos: ${$(c.faltanFotos.total)}` : "", c.siguienteViernes.total ? `📅 el viernes siguiente: ${$(c.siguienteViernes.total)}` : ""].filter(Boolean); return `<tr class="click" onclick="location='/portal/plomeros/${u(p.id)}'" style="${p.estado === "activo" ? "" : "opacity:.6"}"><td><b>${e(p.nombre)}</b><div class="muted">${e(NOMBRE_OFICIO[oficioCampo(p)])}${p.licencia ? " · " + e(p.licencia) : ""}</div>${(() => { const dp = depositoDe(p); return `<div class="muted" style="color:${dp.clave === "ok" ? "#157A53" : dp.clave === "falta" ? "#B45309" : "inherit"}">${e(dp.clave === "ok" ? "🏦 Depósito directo ✓" : dp.texto)}</div>`; })()}</td><td>${e(p.municipio ?? "—")}<div class="muted">${e(p.territorios.join(", ") || "sin territorio")}</div></td><td><span class="tag ${p.estado === "activo" ? "ok" : "mute"}">${e(p.estado)}</span></td><td>${c.trabajosTotales}${c.porHacer.trabajos.length ? `<div class="muted">${c.porHacer.trabajos.length} por hacer</div>` : ""}</td><td><b>${$(c.acumulado)}</b></td><td><b style="color:${c.esteViernes.total ? "#157A53" : "inherit"}">${$(c.esteViernes.total)}</b></td><td>${detenido.map((d) => `<div class="muted">${d}</div>`).join("") || "—"}</td><td>${c.piezas.porDevolver.total ? $(c.piezas.porDevolver.total) : "—"}</td></tr>`; }).join("");
  res.type("html").send(pagina("Plomeros", yo, "plomeros", `<h1>Plomeros</h1><p class="sub">${ps.filter((p) => p.estado === "activo").length} activos · ${ps.length} en total</p>
<h2>Dar de alta (contratado y firmado)</h2><div class="card"><div class="g2"><div><label>Oficio</label><select id="o">${Object.entries(NOMBRE_OFICIO).map(([k, t]) => `<option value="${k}">${t}</option>`).join("")}</select></div><div><label>Nombre completo</label><input id="n" placeholder="Luis Rivera"></div><div><label>WhatsApp</label><input id="w" placeholder="787-555-0123"></div><div><label>Municipio</label><input id="m" placeholder="Bayamón"></div><div><label>Licencia (nivel y número)</label><input id="l" placeholder="maestro 12345"></div></div>
<p style="margin-top:12px"><button class="btn" onclick="var v=i=>document.getElementById(i).value.trim();if(!v('n')||!v('w')||!v('m')){alert('Faltan nombre, WhatsApp o municipio');return}post('/portal/plomeros',{oficio:v('o'),nombre:v('n'),whatsapp:v('w'),municipio:v('m'),licencia:v('l')},'Activo. Le enviamos su app por texto.')">Dar de alta y enviarle su app</button></p></div>
<div class="card row"><div style="flex:1"><b>¿Cómo lo ve el plomero?</b><div class="muted">La misma app que usan ellos, con trabajos de EJEMPLO: aceptar, "No puedo", en camino, llegué, fotos y terminé. No toca nada real.</div></div><a class="btn l" href="${e(linkPortal(DEMO_ID, config.urlPublica))}" target="_blank">Abrir la app de prueba</a></div>
<div class="kpis"><div class="card kpi"><b style="color:#157A53">${$(aPagar)}</b><span>comisiones a pagar el viernes${viernes ? " " + e(fd(viernes + "T12:00:00")) : ""}</span></div><div class="card kpi"><b>${$(piezasDev)}</b><span>piezas por devolverles (48 h)</span></div><div class="card kpi"><b>${$(esperando)}</b><span>esperando que el cliente pague</span></div><div class="card kpi"><b>${$(sinFotos)}</b><span>detenido: faltan fotos</span></div><div class="card kpi"><b>${$(siguiente)}</b><span>para el viernes siguiente</span></div></div>
<div class="card"><table><tr><th>Plomero</th><th>Zona</th><th>Estado</th><th>Trabajos</th><th>Ganado en total</th><th>Cobra este viernes</th><th>Detenido</th><th>Piezas por devolver</th></tr>${filas || '<tr><td colspan="8" class="muted">Todavía no hay plomeros.</td></tr>'}</table></div>
<p class="muted">"Ganado en total" = su 65 % de la mano de obra de todos los trabajos que terminó. "Cobra este viernes" = lo que el cliente ya pagó hasta el miércoles y tiene sus fotos. Lo demás aparece en "Detenido" con la razón; entra solo en cuanto se resuelva.</p>`));
});
portal.post("/portal/plomeros", requerir(), express.json(), async (req, res) => {
  const b = req.body ?? {}; if (!b.nombre || !b.whatsapp || !b.municipio) return res.json({ ok: false, motivo: "Faltan nombre, WhatsApp o municipio." });
  const p = altaPlomero({ nombre: String(b.nombre).trim(), whatsapp: String(b.whatsapp), municipio: String(b.municipio).trim(), licencia: b.licencia ? String(b.licencia).trim() : undefined, oficio: (b.oficio in NOMBRE_OFICIO ? b.oficio : "plomero") as OficioCampo });
  const link = linkPortal(p.id, config.urlPublica); const ok = await avisarAlTelefono(p.whatsapp, bienvenida(p.nombre, link)).catch(() => false);
  await avisarCoordinador(`🔧 Alta de plomero por ${(req as any).yo.nombre}: ${p.nombre} · ${p.municipio} (${p.territorios.join(", ") || "SIN territorio"})\nApp: ${link}\nBienvenida: ${ok ? "enviada" : "NO enviada — mándale el link a mano"}`).catch(() => undefined);
  res.json({ ok: true, link, bienvenida: ok });
});
portal.get("/portal/plomeros/:id", requerir(), (req, res) => {
  const yo = (req as any).yo; const p = plomeros().find((x) => x.id === req.params.id); if (!p) return res.status(404).type("html").send(pagina("No existe", yo, "plomeros", "<h1>No existe</h1>"));
  const c = ciclo.cuentaSemanal(p); const link = linkPortal(p.id, config.urlPublica);
  const ts = almacen.trabajos().filter((t) => t.plomeroId === p.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const notas = ts.flatMap((t) => [...(t.notasInternas ?? []).filter((n) => n.autor.startsWith("plomero")).map((n) => ({ ...n, t: t.id })), ...(t.notaCierre ? [{ fecha: t.terminadoEn!, texto: t.notaCierre, t: t.id }] : [])]).sort((a, b) => b.fecha.localeCompare(a.fecha));
  res.type("html").send(pagina(p.nombre, yo, "plomeros", `<p class="muted"><a href="/portal/plomeros">← Plomeros</a></p><h1>${e(p.nombre)}</h1><p class="sub"><span class="tag ${p.estado === "activo" ? "ok" : "mute"}">${e(p.estado)}</span> · ${e(p.municipio ?? "")} · ${e(p.territorios.join(", "))} · ${e(p.licencia ?? "licencia sin anotar")} · alta ${fd(p.alta)}</p>${(() => { const dp = depositoDe(p); return `<p style="margin:-4px 0 12px;color:${dp.clave === "ok" ? "#157A53" : dp.clave === "falta" ? "#B45309" : "inherit"}">${e(dp.texto)}${"pdf" in dp && dp.pdf ? ` · <a href="${e(dp.pdf)}" target="_blank">PDF</a>` : ""}${dp.clave === "falta" ? ` · <a href="/equipo-firmas" target="_blank">Crear en Firmas</a>` : ""}</p>`; })()}
<div class="g2"><div class="card"><b>Su app</b><p class="muted" style="margin:6px 0;word-break:break-all">${e(link)}</p><div class="row"><button class="btn l" onclick="navigator.clipboard.writeText('${e(link)}').then(()=>alert('Copiado'))">Copiar link</button><button class="btn l" onclick="post('/portal/plomeros/${u(p.id)}/reenviar',{},'Bienvenida reenviada')">Reenviar por WhatsApp</button>${p.estado === "activo" ? `<button class="btn l" onclick="post('/portal/plomeros/${u(p.id)}/estado',{estado:'pausado'})">Pausar</button>` : `<button class="btn l" onclick="post('/portal/plomeros/${u(p.id)}/estado',{estado:'activo'})">Activar</button>`}</div><p style="margin-top:10px">📞 <a href="https://wa.me/${tel(p.whatsapp)}" target="_blank">${e(p.whatsapp)}</a></p></div>
<div class="card"><b>Pagos</b><p style="margin-top:6px"><span class="muted">Ganado en total:</span> <b>${$(c.acumulado)}</b> en ${c.trabajosTotales} trabajo(s)<br><span class="muted">Cobra este viernes ${fd(c.esteViernes.fecha + "T12:00:00")}:</span> <b style="color:#157A53">${$(c.esteViernes.total)}</b>${c.esteViernes.trabajos.length ? ` (${c.esteViernes.trabajos.map((x) => e(x.id)).join(", ")})` : ""}<br><span class="muted">El viernes siguiente:</span> ${$(c.siguienteViernes.total)}<br><span class="muted">Esperando que el cliente pague:</span> ${$(c.esperandoCliente.total)}${c.esperandoCliente.trabajos.length ? ` (${c.esperandoCliente.trabajos.map((x) => `<a href="/portal/trabajos/${u(x.id)}">${e(x.id)}</a>`).join(", ")})` : ""}<br><span class="muted">Detenido por fotos:</span> ${$(c.faltanFotos.total)}${c.faltanFotos.trabajos.length ? ` (${c.faltanFotos.trabajos.map((x) => `<a href="/portal/trabajos/${u(x.id)}">${e(x.id)}</a> falta ${e(x.falta.join(" y "))}`).join("; ")})` : ""}<br><span class="muted">Piezas por devolverle:</span> ${$(c.piezas.porDevolver.total)}<br><span class="muted">Por hacer esta semana:</span> ${$(c.porHacer.total)} (${c.porHacer.trabajos.length})</p></div></div>
<h2>Trabajos (${ts.length})</h2><div class="card"><table><tr><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Estado</th><th>Cómo va su pago</th><th>Su pago</th></tr>${ts.map((t) => { const pp = pasoDePago(t); return `<tr class="click" onclick="location='/portal/trabajos/${u(t.id)}'"><td><b>${e(t.id)}</b></td><td>${e(t.nombre)}</td><td>${e(t.servicio)}</td><td>${fd(t.inicio)}</td><td>${tagEstado(t.estado)}</td><td><span class="tag ${pp.clave === "pagado" || pp.clave === "viernes" ? "ok" : pp.clave === "hacer" || pp.clave === "cancelado" ? "mute" : "warn"}">${e(pp.texto)}</span></td><td>${t.pagoPlomero == null ? "—" : $(partesDelPago(t).comision)}${t.pagadoAlPlomero ? ' <span class="tag ok">pagado</span>' : ""}${partesDelPago(t).piezas ? `<div class="muted">+ piezas ${$(partesDelPago(t).piezas)}</div>` : ""}</td></tr>`; }).join("") || '<tr><td colspan="7" class="muted">Sin trabajos todavía.</td></tr>'}</table></div>
<h2>Sus comentarios</h2><div class="card">${notas.map((n) => `<div class="ev plomero"><small>${f(n.fecha)} · ${e(n.t)}</small><div>${e(n.texto)}</div></div>`).join("") || '<p class="muted">Sin comentarios.</p>'}</div>`));
});
portal.post("/portal/plomeros/:id/estado", requerir(), express.json(), (req, res) => { const s = String(req.body?.estado ?? ""); if (!["activo", "pausado"].includes(s)) return res.json({ ok: false }); res.json({ ok: !!cambiarEstadoPlomero(req.params.id, s as any) }); });
portal.post("/portal/plomeros/:id/reenviar", requerir(), async (req, res) => { const p = plomeros().find((x) => x.id === req.params.id); if (!p) return res.json({ ok: false }); const ok = await avisarAlTelefono(p.whatsapp, bienvenida(p.nombre, linkPortal(p.id, config.urlPublica))).catch(() => false); res.json({ ok, motivo: ok ? undefined : "No se pudo entregar. Copia el link y mándaselo tú." }); });

// ── Vacantes (candidatos a plomero; lo lleva Yaileen) ──
const ESTADO_CAND: Record<string, string> = { nuevo: "Nuevo", verificando: "Verificando", entrevista: "Entrevista", prueba: "Prueba", activo: "Activo", descartado: "Descartado", "lista-espera": "Lista de espera" };
portal.get("/portal/vacantes", requerir(), (req, res) => {
  const yo = (req as any).yo; const q = norm(req.query.q); const est = String(req.query.estado ?? "");
  const cs = almacen.candidatos().filter((c) => (!est || c.estado === est) && (!q || norm([c.nombre, c.municipio, c.whatsapp, c.nivelLicencia, c.oficio].join(" ")).includes(q))).sort((a, b) => b.creado.localeCompare(a.creado));
  const cuenta = (k: string) => almacen.candidatos().filter((c) => c.estado === k).length;
  const filtros = Object.entries(ESTADO_CAND).map(([k, t]) => `<a class="tag ${est === k ? "info" : ""}" href="/portal/vacantes?estado=${k}">${t} · ${cuenta(k)}</a>`).join(" ");
  const filas = cs.map((c) => `<tr class="click" onclick="location='/portal/clientes/${u(c.contactoId)}'"><td><b>${e(c.nombre)}</b><div class="muted">${e(c.whatsapp)}</div></td><td>${e(c.oficio ?? "plomero")} · ${e(c.nivelLicencia)}${c.numeroLicencia ? " #" + e(c.numeroLicencia) : ""}<div class="muted">${e(c.experiencia ?? "")}</div></td><td>${e(c.municipio)}<div class="muted">${e(territorioDe(c.municipio) ?? "fuera de zona")}</div></td><td>${e(c.disponibilidad)}</td><td><span class="tag">${e(ESTADO_CAND[c.estado] ?? c.estado)}</span>${c.entrevista ? `<div class="muted">entrevista ${f(c.entrevista)}</div>` : ""}</td><td>${fd(c.creado)}</td></tr>`).join("");
  res.type("html").send(pagina("Vacantes", yo, "vacantes", `<h1>Vacantes · candidatos</h1><p class="sub">Plomeros y oficios que aplicaron. Reclutamiento lo lleva Yaileen; las entrevistas están en el calendario de GHL.</p>
<form class="card row"><input name="q" value="${e(req.query.q ?? "")}" placeholder="Nombre, pueblo, teléfono, licencia" style="flex:1"><button class="btn">Buscar</button><a class="btn l" href="/portal/vacantes">Todos</a></form><p style="margin:0 0 12px">${filtros}</p>
<div class="card"><table><tr><th>Candidato</th><th>Oficio · licencia</th><th>Pueblo</th><th>Disponibilidad</th><th>Estado</th><th>Aplicó</th></tr>${filas || '<tr><td colspan="6" class="muted">No hay candidatos con ese filtro.</td></tr>'}</table></div>`));
});

// ── Contratistas (División Proyectos) ──
portal.get("/portal/contratistas", requerir(), (req, res) => {
  const yo = (req as any).yo; const cs = almacen.contratistas().sort((a, b) => a.nombre.localeCompare(b.nombre));
  const filas = cs.map((c) => `<tr class="click" onclick="location='/portal/clientes/${u(c.contactoId)}'"><td><b>${e(c.nombre)}</b><div class="muted">${e(c.empresa ?? "")} · ${e(c.whatsapp)}</div></td><td>${e(c.categorias.join(", "))}</td><td>${e(c.zonas.join(", "))}</td><td>${e(c.registroDaco ? "DACO " + c.registroDaco : "sin DACO")}<div class="muted">${e(c.seguro ? "seguro: " + c.seguro : "sin seguro anotado")}</div></td><td><span class="tag ${c.estado === "verified" || c.estado === "preferido" ? "ok" : c.estado === "descartado" ? "mute" : ""}">${e(c.estado)}</span></td></tr>`).join("");
  res.type("html").send(pagina("Contratistas", yo, "contratistas", `<h1>Contratistas</h1><p class="sub">División Proyectos (remodelaciones). Solo los "verified" o "preferido" reciben proyectos.</p>
<div class="card"><table><tr><th>Contratista</th><th>Categorías</th><th>Zonas</th><th>DACO · seguro</th><th>Estado</th></tr>${filas || '<tr><td colspan="5" class="muted">Todavía no hay contratistas.</td></tr>'}</table></div>`));
});

// ── Áreas (territorios: dónde hay plomero, trabajos y demanda en espera) ──
portal.get("/portal/areas", requerir(), (req, res) => {
  const yo = (req as any).yo; const ps = plomeros(); const ts = almacen.trabajos(); const espera = almacen.listaEspera(); const cands = almacen.candidatos();
  const mes = new Date().toISOString().slice(0, 7);
  const filas = territorios.territorios.map((t) => {
    const activos = ps.filter((p) => p.estado === "activo" && p.territorios.includes(t.id));
    const tsT = ts.filter((x) => territorioDe(x.municipio) === t.id && x.estado !== "cancelado");
    const esp = espera.filter((x) => territorioDe(x.municipio) === t.id).length;
    const cand = cands.filter((c) => territorioDe(c.municipio) === t.id && !["descartado", "activo"].includes(c.estado)).length;
    return `<tr><td><b>${e(t.id)} · ${e(t.nombre)}</b><div class="muted">${e(t.municipios.join(", "))}</div></td><td>${activos.length ? activos.map((p) => `<a href="/portal/plomeros/${u(p.id)}">${e(p.nombre)}</a>`).join("<br>") : '<span class="tag warn">sin plomero</span>'}</td><td>${tsT.filter((x) => x.creado.startsWith(mes)).length} este mes<div class="muted">${tsT.length} en total</div></td><td>${esp}</td><td>${cand}</td></tr>`;
  }).join("");
  res.type("html").send(pagina("Áreas", yo, "areas", `<h1>Áreas</h1><p class="sub">Los 8 territorios. Donde hay plomero activo, el agente agenda y salen anuncios; donde no, el cliente queda en lista de espera.</p>
<div class="card"><table><tr><th>Territorio · pueblos</th><th>Plomeros activos</th><th>Trabajos</th><th>Clientes en espera</th><th>Candidatos en proceso</th></tr>${filas}</table></div>`));
});

// ── Enlaces: todo lo que se usa, en un solo sitio ──
portal.get("/portal/enlaces", requerir(), (req, res) => {
  const yo = (req as any).yo; const b = config.urlPublica;
  const li = (t: string, url: string, d: string) => `<tr><td><b>${t}</b><div class="muted">${d}</div></td><td><a href="${e(url)}" target="_blank" style="word-break:break-all">${e(url)}</a></td></tr>`;
  res.type("html").send(pagina("Enlaces", yo, "enlaces", `<h1>Enlaces</h1><p class="sub">Lo que ve cada quien.</p>
<h2>Clientes</h2><div class="card"><table>${li("Página de reserva", b + "/reservar", "El cliente escoge servicio, pueblo, día y hora, y reserva solo. Sin pago por ahora.")}${li("Web de Resuelto", "https://resueltopr.com", "La página pública.")}</table></div>
<h2>Plomeros</h2><div class="card"><table>${li("App del plomero (PRUEBA)", linkPortal(DEMO_ID, b), "Trabajos de ejemplo: así aceptan, rechazan y cierran. No toca nada real.")}${li("Kit de bienvenida", b + "/kit/kit-bienvenida-resuelto.pdf", "Lo que recibe cada plomero al firmar.")}${li("Acuerdo del plomero", b + "/kit/acuerdo-resuelto.pdf", "Contrato de afiliación.")}</table><p class="muted" style="margin-top:8px">El link de cada plomero real está en su ficha (Plomeros → nombre).</p></div>
<h2>Equipo</h2><div class="card"><table>${li("Firmas electrónicas", b + "/equipo-firmas", "Contratos por firmar y firmados (tiene su propia clave).")}${li("Menú de precios interno", b + "/kit/menu-precios-interno-r7q4.pdf", "Precios, guion de llamada y objeciones.")}${li("SOP de la setter", b + "/kit/sop-setter-k3m8.pdf", "Cómo trabaja la setter de clientes.")}${li("Acuerdo de la setter", b + "/kit/acuerdo-setter-p5w2.pdf", "Contratista independiente, comisión.")}</table></div>`));
});

// ── Cambiar mi clave ──
portal.get("/portal/clave", requerir(), (req, res) => {
  const yo = (req as any).yo as staff.Staff; const err = req.query.e ? `<p style="color:#B6470F;margin:8px 0">${e(String(req.query.e))}</p>` : "";
  res.type("html").send(pagina("Mi clave", yo, "", `<div class="card" style="max-width:420px;margin:30px auto"><h1>Cambiar mi clave</h1><p class="sub">${yo.temporal || req.query.t ? "Estás entrando con una clave temporal: ponle una tuya." : "Mínimo 8 caracteres."}</p>${err}
<form method="post" action="/portal/clave"><label>Clave actual</label><input name="actual" type="password" autocomplete="current-password" required><label>Clave nueva (8+)</label><input name="nueva" type="password" autocomplete="new-password" minlength="8" required><label>Repite la clave nueva</label><input name="otra" type="password" autocomplete="new-password" minlength="8" required><p style="margin-top:14px"><button class="btn" style="width:100%">Guardar</button></p></form></div>`));
});
portal.post("/portal/clave", requerir(), (req, res) => {
  const yo = (req as any).yo as staff.Staff; const b = req.body ?? {};
  if (!staff.autenticar(yo.email, String(b.actual ?? ""))) return res.redirect("/portal/clave?e=" + encodeURIComponent("La clave actual no es correcta."));
  if (String(b.nueva) !== String(b.otra)) return res.redirect("/portal/clave?e=" + encodeURIComponent("Las dos claves nuevas no son iguales."));
  try { staff.ponerClave(yo.email, String(b.nueva ?? "")); } catch (err) { return res.redirect("/portal/clave?e=" + encodeURIComponent((err as Error).message)); }
  res.type("html").send(pagina("Listo", yo, "", `<div class="card" style="max-width:420px;margin:30px auto"><h1>Clave cambiada ✅</h1><p style="margin-top:12px"><a class="btn" href="/portal">Ir al inicio</a></p></div>`));
});

// ── Equipo (solo admin) ──
portal.get("/portal/equipo", requerir("admin"), (req, res) => {
  const yo = (req as any).yo;
  res.type("html").send(pagina("Equipo", yo, "equipo", `<h1>Equipo</h1><p class="sub">Quién entra al portal.</p><div class="card"><table><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Última entrada</th><th></th></tr>${staff.listar().map((s) => `<tr><td>${e(s.nombre)}</td><td>${e(s.email)}</td><td>${e(s.rol)}</td><td>${f(s.ultimaEntrada)}</td><td>${s.email !== yo.email ? `<button class="btn l" onclick="post('/portal/equipo/estado',{email:'${e(s.email)}',activo:${!s.activo}})">${s.activo ? "Desactivar" : "Activar"}</button>` : ""}</td></tr>`).join("")}</table></div>
<h2>Agregar usuario</h2><div class="card"><div class="g2"><div><label>Nombre</label><input id="n"></div><div><label>Email</label><input id="m" type="email"></div><div><label>Rol</label><select id="r"><option value="gerente">Gerente de proyectos</option><option value="reclutamiento">Reclutamiento</option><option value="admin">Admin</option></select></div><div><label>Clave temporal (8+)</label><input id="c"></div></div><p style="margin-top:12px"><button class="btn" onclick="var v=i=>document.getElementById(i).value.trim();post('/portal/equipo',{nombre:v('n'),email:v('m'),rol:v('r'),clave:v('c')},'Usuario creado. Pásale su email y clave.')">Crear usuario</button></p></div>`));
});
portal.post("/portal/equipo", requerir("admin"), express.json(), (req, res) => {
  const b = req.body ?? {}; if (!b.nombre || !b.email || !b.clave) return res.json({ ok: false, motivo: "Faltan datos." });
  try { staff.crear({ nombre: b.nombre, email: b.email, rol: ["admin", "gerente", "reclutamiento"].includes(b.rol) ? b.rol : "gerente", clave: String(b.clave) }); res.json({ ok: true }); } catch (err) { res.json({ ok: false, motivo: (err as Error).message }); }
});
portal.post("/portal/equipo/estado", requerir("admin"), express.json(), (req, res) => { staff.cambiarActivo(String(req.body?.email ?? ""), !!req.body?.activo); res.json({ ok: true }); });

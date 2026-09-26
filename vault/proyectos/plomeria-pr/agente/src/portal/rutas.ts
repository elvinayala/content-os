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
import { plomeros, altaPlomero, cambiarEstadoPlomero, linkPortal, territorioDe } from "../proveedores.js";
import { DEMO_ID } from "../demo-plomero.js";
import { leerHistorial, archivar } from "../historial.js";
import { abrirGarantia, vigenciaGarantia } from "../garantias.js";
import { avisarCoordinador } from "../canales/whatsapp.js";
import { avisarAlTelefono } from "../canales/telefono.js"; // WhatsApp si está sano; si no, SMS desde el 787-956-1111
import { territorios } from "../prompt.js";
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
  const nav = yo ? `<nav><a class="marca" href="/portal">${casa(true, 24)}<span>resuelto</span></a>${[["inicio", "/portal", "Inicio"], ["clientes", "/portal/clientes", "Clientes"], ["trabajos", "/portal/trabajos", "Trabajos"], ["plomeros", "/portal/plomeros", "Plomeros"], ["vacantes", "/portal/vacantes", "Vacantes"], ["contratistas", "/portal/contratistas", "Contratistas"], ["areas", "/portal/areas", "Áreas"], ["enlaces", "/portal/enlaces", "Enlaces"], ...(yo.rol === "admin" ? [["equipo", "/portal/equipo", "Equipo"]] : [])].map(([k, h, t]) => `<a href="${h}" class="${k === activo ? "on" : ""}">${t}</a>`).join("")}<span class="yo">${e(yo.nombre)} · <a href="/portal/clave">Mi clave</a> · <a href="/portal/salir">Salir</a></span></nav>` : "";
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

// ── Inicio ──
portal.get("/portal", requerir(), (req, res) => {
  const yo = (req as any).yo as staff.Staff; const ts = almacen.trabajos(); const hoy = new Date().toLocaleDateString("en-CA", { timeZone: config.zonaHoraria });
  const deHoy = ts.filter((t) => new Date(t.inicio).toLocaleDateString("en-CA", { timeZone: config.zonaHoraria }) === hoy && t.estado !== "cancelado");
  const enCurso = ts.filter((t) => ["en-camino", "en-sitio"].includes(t.estado)); const porCobrar = ts.filter((t) => t.estado === "completado" && !t.garantiaDe);
  const garantias = ts.filter((t) => t.garantiaDe && !["completado", "cobrado", "cancelado"].includes(t.estado));
  const activos = plomeros().filter((p) => p.estado === "activo").length;
  const porPagar = ts.filter((t) => t.pagoPlomero != null && !t.pagadoAlPlomero && t.estado === "cobrado").reduce((a, t) => a + (t.pagoPlomero ?? 0), 0);
  const fila = (t: Trabajo) => `<tr class="click" onclick="location='/portal/trabajos/${u(t.id)}'"><td><b>${e(t.id)}</b></td><td>${e(t.nombre)}<div class="muted">${e(t.municipio)}</div></td><td>${e(t.servicio)}</td><td>${e(t.plomeroId || "sin asignar")}</td><td>${tagEstado(t.estado)}</td><td>${f(t.inicio)}</td></tr>`;
  res.type("html").send(pagina("Inicio", yo, "inicio", `<h1>${(() => { const h = Number(new Date().toLocaleString("en-US", { timeZone: config.zonaHoraria, hour: "numeric", hour12: false })) % 24; return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; })()}, ${e(yo.nombre.split(" ")[0])}</h1><p class="sub">Lo que está pasando hoy en Resuelto.</p>
<form action="/portal/clientes" class="card row"><input name="q" placeholder="Buscar cliente por nombre, teléfono o dirección…" autofocus style="flex:1"><button class="btn">Buscar</button></form>
<div class="kpis"><div class="card kpi"><b>${deHoy.length}</b><span>trabajos hoy</span></div><div class="card kpi"><b>${enCurso.length}</b><span>en curso ahora</span></div><div class="card kpi"><b>${porCobrar.length}</b><span>terminados por cobrar</span></div><div class="card kpi"><b>${garantias.length}</b><span>garantías abiertas</span></div><div class="card kpi"><b>${activos}</b><span>plomeros activos</span></div><div class="card kpi"><b>${$(porPagar)}</b><span>por pagar a plomeros</span></div></div>
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
<div class="g2"><div class="card"><b>Cliente</b><p style="margin-top:6px">${e(t.nombre)} · <a href="https://wa.me/${tel(t.telefono)}" target="_blank">${e(t.telefono)}</a><br>📍 ${e(t.direccion)}, ${e(t.municipio)}${t.referencia ? `<br><span class="muted">Ref: ${e(t.referencia)}</span>` : ""}<br>🕑 ${f(t.inicio)}${t.emergencia ? ' <span class="tag warn">Emergencia</span>' : ""}</p></div>
<div class="card"><b>Dinero</b><p style="margin-top:6px">Mano de obra: ${$(t.manoObraFinal ?? t.manoObra)}${t.rango ? ` <span class="muted">(rango $${t.rango[0]}–$${t.rango[1]})</span>` : ""}<br>Materiales (costo): ${$(t.materialesCosto)}<br>Coordinación: ${$(t.fee)}<br><b>Cliente paga: ${$(t.totalCliente)}</b><br>Plomero cobra: ${$(t.pagoPlomero)} ${t.pagadoAlPlomero ? `<span class="tag ok">pagado ${e(t.pagadoAlPlomero)}</span>` : ""}</p>
<div class="row" style="margin-top:10px">${t.estado === "completado" && !t.garantiaDe ? `<button class="btn l" onclick="post('/portal/trabajos/${u(t.id)}/accion',{que:'cobrado'})">Marcar cobrado</button>` : ""}${t.pagoPlomero != null && !t.pagadoAlPlomero ? `<button class="btn l" onclick="post('/portal/trabajos/${u(t.id)}/accion',{que:'pagado-plomero'})">Marcar pagado al plomero</button>` : ""}${["agendado", "en-camino"].includes(t.estado) ? `<button class="btn l" onclick="if(confirm('¿Cancelar este trabajo? Se le avisa al cliente.'))post('/portal/trabajos/${u(t.id)}/accion',{que:'cancelar'})">Cancelar</button>` : ""}</div></div></div>
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
  if (que === "cobrado") { almacen.guardarTrabajo({ ...t, estado: "cobrado" }); archivar(t.contactoId, "staff", `${yo.nombre} marcó ${t.id} como cobrado.`, t.id); }
  else if (que === "pagado-plomero") almacen.guardarTrabajo({ ...t, pagadoAlPlomero: new Date().toISOString().slice(0, 10) });
  else if (que === "cancelar") {
    almacen.guardarTrabajo({ ...t, estado: "cancelado" }); archivar(t.contactoId, "staff", `${yo.nombre} canceló ${t.id}.`, t.id);
    await avisarCoordinador(`❌ ${yo.nombre} canceló ${t.id} (${t.nombre}).`).catch(() => undefined);
  } else return res.json({ ok: false, motivo: "Acción inválida." });
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
function bienvenida(nombre: string, link: string) {
  return `¡Bienvenido a Resuelto, ${nombre.split(" ")[0]}! 🔧\n\nEsta es tu app para recibir trabajos:\n${link}\n\n1️⃣ Ábrela y añádela a tu pantalla de inicio (queda como una app).\n2️⃣ Toca "Activar alertas" para que te avise al celular.\n3️⃣ Cuando salga un trabajo en tu zona te llega la alerta: el primero que acepta se lo lleva.\n4️⃣ En cada trabajo: "Voy en camino" → "Llegué" → fotos del antes y el después → "Terminé". Resuelto le cobra al cliente y tú cobras el viernes.\n\nCualquier duda, escríbenos por aquí.`;
}
portal.get("/portal/plomeros", requerir(), (req, res) => {
  const yo = (req as any).yo; const ps = plomeros();
  const filas = ps.map((p) => { const c = ciclo.cuentaSemanal(p); return `<tr class="click" onclick="location='/portal/plomeros/${u(p.id)}'"><td><b>${e(p.nombre)}</b><div class="muted">${e(p.licencia ?? "")}</div></td><td>${e(p.municipio ?? "—")}<div class="muted">${e(p.territorios.join(", ") || "sin territorio")}</div></td><td><span class="tag ${p.estado === "activo" ? "ok" : "mute"}">${e(p.estado)}</span></td><td>${c.trabajosTotales}</td><td>${$(c.estaSemana.total)}</td></tr>`; }).join("");
  res.type("html").send(pagina("Plomeros", yo, "plomeros", `<h1>Plomeros</h1><p class="sub">${ps.filter((p) => p.estado === "activo").length} activos · ${ps.length} en total</p>
<h2>Dar de alta un plomero (contratado y firmado)</h2><div class="card"><div class="g2"><div><label>Nombre completo</label><input id="n" placeholder="Luis Rivera"></div><div><label>WhatsApp</label><input id="w" placeholder="787-555-0123"></div><div><label>Municipio</label><input id="m" placeholder="Bayamón"></div><div><label>Licencia (nivel y número)</label><input id="l" placeholder="maestro 12345"></div></div>
<p style="margin-top:12px"><button class="btn" onclick="var v=i=>document.getElementById(i).value.trim();if(!v('n')||!v('w')||!v('m')){alert('Faltan nombre, WhatsApp o municipio');return}post('/portal/plomeros',{nombre:v('n'),whatsapp:v('w'),municipio:v('m'),licencia:v('l')},'Plomero activo. Le enviamos su app por WhatsApp.')">Dar de alta y enviarle su app</button></p></div>
<div class="card row"><div style="flex:1"><b>¿Cómo lo ve el plomero?</b><div class="muted">La misma app que usan ellos, con trabajos de EJEMPLO: aceptar, "No puedo", en camino, llegué, fotos y terminé. No toca nada real.</div></div><a class="btn l" href="${e(linkPortal(DEMO_ID, config.urlPublica))}" target="_blank">Abrir la app de prueba</a></div>
<div class="card"><table><tr><th>Plomero</th><th>Zona</th><th>Estado</th><th>Trabajos</th><th>Esta semana</th></tr>${filas || '<tr><td colspan="5" class="muted">Todavía no hay plomeros.</td></tr>'}</table></div>`));
});
portal.post("/portal/plomeros", requerir(), express.json(), async (req, res) => {
  const b = req.body ?? {}; if (!b.nombre || !b.whatsapp || !b.municipio) return res.json({ ok: false, motivo: "Faltan nombre, WhatsApp o municipio." });
  const p = altaPlomero({ nombre: String(b.nombre).trim(), whatsapp: String(b.whatsapp), municipio: String(b.municipio).trim(), licencia: b.licencia ? String(b.licencia).trim() : undefined });
  const link = linkPortal(p.id, config.urlPublica); const ok = await avisarAlTelefono(p.whatsapp, bienvenida(p.nombre, link)).catch(() => false);
  await avisarCoordinador(`🔧 Alta de plomero por ${(req as any).yo.nombre}: ${p.nombre} · ${p.municipio} (${p.territorios.join(", ") || "SIN territorio"})\nApp: ${link}\nBienvenida: ${ok ? "enviada" : "NO enviada — mándale el link a mano"}`).catch(() => undefined);
  res.json({ ok: true, link, bienvenida: ok });
});
portal.get("/portal/plomeros/:id", requerir(), (req, res) => {
  const yo = (req as any).yo; const p = plomeros().find((x) => x.id === req.params.id); if (!p) return res.status(404).type("html").send(pagina("No existe", yo, "plomeros", "<h1>No existe</h1>"));
  const c = ciclo.cuentaSemanal(p); const link = linkPortal(p.id, config.urlPublica);
  const ts = almacen.trabajos().filter((t) => t.plomeroId === p.id).sort((a, b) => b.inicio.localeCompare(a.inicio));
  const notas = ts.flatMap((t) => [...(t.notasInternas ?? []).filter((n) => n.autor.startsWith("plomero")).map((n) => ({ ...n, t: t.id })), ...(t.notaCierre ? [{ fecha: t.terminadoEn!, texto: t.notaCierre, t: t.id }] : [])]).sort((a, b) => b.fecha.localeCompare(a.fecha));
  res.type("html").send(pagina(p.nombre, yo, "plomeros", `<p class="muted"><a href="/portal/plomeros">← Plomeros</a></p><h1>${e(p.nombre)}</h1><p class="sub"><span class="tag ${p.estado === "activo" ? "ok" : "mute"}">${e(p.estado)}</span> · ${e(p.municipio ?? "")} · ${e(p.territorios.join(", "))} · ${e(p.licencia ?? "licencia sin anotar")} · alta ${fd(p.alta)}</p>
<div class="g2"><div class="card"><b>Su app</b><p class="muted" style="margin:6px 0;word-break:break-all">${e(link)}</p><div class="row"><button class="btn l" onclick="navigator.clipboard.writeText('${e(link)}').then(()=>alert('Copiado'))">Copiar link</button><button class="btn l" onclick="post('/portal/plomeros/${u(p.id)}/reenviar',{},'Bienvenida reenviada')">Reenviar por WhatsApp</button>${p.estado === "activo" ? `<button class="btn l" onclick="post('/portal/plomeros/${u(p.id)}/estado',{estado:'pausado'})">Pausar</button>` : `<button class="btn l" onclick="post('/portal/plomeros/${u(p.id)}/estado',{estado:'activo'})">Activar</button>`}</div><p style="margin-top:10px">📞 <a href="https://wa.me/${tel(p.whatsapp)}" target="_blank">${e(p.whatsapp)}</a></p></div>
<div class="card"><b>Pagos</b><p style="margin-top:6px">Esta semana: <b>${$(c.estaSemana.total)}</b> (paga ${fd(c.estaSemana.pagoViernes + "T12:00:00")})<br>Semana pasada: ${$(c.anterior.total)}<br>Acumulado: ${$(c.acumulado)} en ${c.trabajosTotales} trabajos</p></div></div>
<h2>Trabajos (${ts.length})</h2><div class="card"><table><tr><th>Trabajo</th><th>Cliente</th><th>Servicio</th><th>Fecha</th><th>Estado</th><th>Su pago</th></tr>${ts.map((t) => `<tr class="click" onclick="location='/portal/trabajos/${u(t.id)}'"><td><b>${e(t.id)}</b></td><td>${e(t.nombre)}</td><td>${e(t.servicio)}</td><td>${fd(t.inicio)}</td><td>${tagEstado(t.estado)}</td><td>${$(t.pagoPlomero)}${t.pagadoAlPlomero ? ' <span class="tag ok">pagado</span>' : ""}</td></tr>`).join("") || '<tr><td colspan="6" class="muted">Sin trabajos todavía.</td></tr>'}</table></div>
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

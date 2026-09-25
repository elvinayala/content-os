/**
 * Documentos que ve el CLIENTE de un proyecto: la propuesta (precio cerrado, alcance, hitos,
 * garantía) y el contrato de mejoras al hogar. El cliente nunca ve costos unitarios ni márgenes.
 * El texto legal del contrato es un borrador de negocio: lo fija el abogado (DACO exige
 * contrato escrito con número de registro).
 */
import type { Proyecto } from "./almacen.js";
import type { Cotizacion } from "./cotizador.js";

const $ = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fechaLarga = (d = new Date()) => d.toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", dateStyle: "long" });
const CSS = `body{font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#08243A;max-width:820px;margin:0 auto;padding:36px 28px;line-height:1.5;font-size:14px;background:#fff}
.marca{font-family:Sora,Helvetica,Arial,sans-serif;font-weight:800;font-size:28px;color:#0F3D5E;letter-spacing:-1px}.marca span{color:#F2621F}
h1{font-family:Sora,Helvetica,Arial,sans-serif;font-size:26px;color:#0F3D5E;margin:18px 0 4px;letter-spacing:-.5px}h2{font-family:Sora,Helvetica,Arial,sans-serif;font-size:15px;color:#0F3D5E;margin:26px 0 8px;padding-bottom:5px;border-bottom:1px solid #E6E1D8}
.peq{font-size:12px;color:#5C6670}table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:8px 6px;border-bottom:1px solid #EEE9E0;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}
.precio{background:#0F3D5E;color:#fff;border-radius:16px;padding:22px 26px;display:flex;justify-content:space-between;align-items:center;margin:18px 0}.precio b{font-family:Sora;font-size:38px;color:#F2621F}
.precio small{display:block;font-size:12px;color:#9FB8CA;letter-spacing:.1em;text-transform:uppercase}
.ok{color:#1F9D6B;font-weight:600}.cta{display:inline-block;background:#F2621F;color:#fff;font-weight:700;padding:14px 22px;border-radius:12px;text-decoration:none;margin-top:8px}
.firma{margin-top:40px;display:flex;gap:40px}.firma div{flex:1;border-top:1px solid #08243A;padding-top:6px;font-size:12px}
@media print{.cta{display:none}}`;

export interface DatosPropuesta { proyecto: Proyecto; cot: Cotizacion; categoriaNombre: string; partidas: { nombre: string; cantidad: number; unidad: string }[]; incluye?: string; noIncluye?: string; duracionDias?: [number, number]; cotizadorNombre: string; waLink: string; validezDias?: number }

export function propuestaHTML(d: DatosPropuesta): string {
  const p = d.proyecto, c = d.cot;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Propuesta ${p.id} · Resuelto</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap"><style>${CSS}</style></head><body>
<div class="marca">resuelto<span>.</span></div>
<div class="peq">Propuesta ${p.id} · ${fechaLarga()} · Válida ${d.validezDias ?? 15} días</div>
<h1>${d.categoriaNombre} para ${p.nombre.split(" ")[0]}</h1>
<div class="peq">${p.municipio} · Preparada por ${d.cotizadorNombre}, Resuelto</div>

<div class="precio"><div><small>Precio fijo del proyecto</small><b>${$(c.precioFinal)}</b></div><div style="text-align:right;font-size:13px;color:#9FB8CA">Mano de obra, materiales del alcance,<br>coordinación y garantía incluidos.<br><span style="color:#fff;font-weight:600">Sin sorpresas.</span></div></div>

<h2>Alcance del trabajo</h2>
<table>${d.partidas.map((x) => `<tr><td>${x.nombre}</td><td>${x.cantidad} ${x.unidad}</td></tr>`).join("")}</table>
${d.incluye ? `<p><strong>Incluye:</strong> ${d.incluye}</p>` : ""}
${d.noIncluye ? `<p class="peq"><strong>No incluye:</strong> ${d.noIncluye}</p>` : ""}
${d.duracionDias ? `<p><strong>Duración estimada:</strong> ${d.duracionDias[0]} a ${d.duracionDias[1]} días hábiles desde el inicio.</p>` : ""}

<h2>Cómo se paga</h2>
<table>${c.hitos.map((h) => `<tr><td>${h.nombre}</td><td>${$(h.monto)}</td></tr>`).join("")}</table>
<p class="peq">Se paga a Resuelto PR Home Services LLC por ATH Móvil, tarjeta o transferencia. El último pago se libera solo cuando tú aceptas el trabajo terminado.</p>

<h2>La promesa Resuelto</h2>
<p><span class="ok">✓</span> Contratista verificado (Resuelto Verified: registro DACO, seguro, referencias).<br>
<span class="ok">✓</span> El precio de esta propuesta es el precio. Cualquier cambio de alcance lo apruebas tú por escrito antes de hacerse.<br>
<span class="ok">✓</span> Fotos de avance y una persona de Resuelto pendiente de tu proyecto de principio a fin.<br>
<span class="ok">✓</span> Garantía Resuelto: tu proyecto no termina hasta que el trabajo contratado se complete según este alcance. 12 meses en mano de obra.</p>

<a class="cta" href="${d.waLink}">Aceptar propuesta y reservar fecha</a>
<p class="peq">Al aceptar, te enviamos el contrato para firma y el enlace del depósito. La fecha de inicio se reserva al recibir el depósito.</p>
</body></html>`;
}

export function contratoClienteHTML(d: DatosPropuesta & { registroDaco?: string }): string {
  const p = d.proyecto, c = d.cot;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Contrato ${p.id} · Resuelto</title><style>${CSS}</style></head><body>
<div class="marca">resuelto<span>.</span></div>
<h1>Contrato de mejoras al hogar</h1>
<div class="peq">Proyecto ${p.id} · ${fechaLarga()} · Resuelto PR Home Services LLC · Registro de Contratistas DACO ${d.registroDaco ?? "[NÚMERO]"}</div>
<h2>1. Partes</h2><p><strong>Resuelto PR Home Services LLC</strong> ("Resuelto") y <strong>${p.nombre}</strong>, ${p.telefono} ("el Cliente"), propietario o autorizado de la propiedad en ${p.municipio}, Puerto Rico.</p>
<h2>2. Objeto</h2><p>Resuelto ejecutará, directamente o mediante contratistas verificados bajo su responsabilidad y supervisión, el siguiente trabajo: <strong>${d.categoriaNombre}</strong> conforme al alcance de la Propuesta ${p.id}, que forma parte de este contrato.</p>
<table>${d.partidas.map((x) => `<tr><td>${x.nombre}</td><td>${x.cantidad} ${x.unidad}</td></tr>`).join("")}</table>
<h2>3. Precio y forma de pago</h2><p>Precio total fijo: <strong>${$(c.precioFinal)}</strong>, pagadero a Resuelto según los hitos:</p>
<table>${c.hitos.map((h) => `<tr><td>${h.nombre}</td><td>${$(h.monto)}</td></tr>`).join("")}</table>
<p>El Cliente no realizará pagos directos a ningún contratista. La fecha de inicio se reserva al recibir el depósito.</p>
<h2>4. Cambios de alcance</h2><p>Cualquier trabajo adicional se cotiza por escrito y solo se ejecuta con la aprobación del Cliente. Sin aprobación escrita no hay cargos adicionales.</p>
<h2>5. Plazo</h2><p>${d.duracionDias ? `Duración estimada de ${d.duracionDias[0]} a ${d.duracionDias[1]} días hábiles` : "Duración estimada según la propuesta"}, sujeta a permisos, clima y disponibilidad de materiales, con aviso al Cliente ante cualquier cambio.</p>
<h2>6. Garantía</h2><p>Resuelto garantiza la mano de obra por 12 meses desde la aceptación. Los materiales llevan la garantía del fabricante. Ante un defecto de ejecución, Resuelto coordina la corrección sin costo para el Cliente.</p>
<h2>7. Aceptación</h2><p>Al terminar, Resuelto y el Cliente inspeccionan el trabajo. El último hito se paga al aceptar. Los puntos pendientes se listan por escrito y se corrigen antes del pago final.</p>
<h2>8. Cancelación</h2><p>[Cláusula de cancelación y derechos del consumidor conforme a DACO: la redacta el abogado.]</p>
<h2>9. Permisos</h2><p>${p.categoriaId === "poda-arboles" || p.categoriaId === "piscinas" || p.categoriaId === "remodelacion-general" ? "Los permisos requeridos se gestionan según lo indicado en la propuesta y su costo forma parte del precio cuando así se especifica." : "No se anticipan permisos para este alcance."}</p>
<div class="firma"><div>Resuelto PR Home Services LLC<br><br><span style="color:#fff">/firma_resuelto/</span></div><div>${p.nombre}<br><br><span style="color:#fff">/firma_cliente/</span></div></div>
</body></html>`;
}

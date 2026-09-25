/**
 * Contrato por trabajo: el documento que firma el proveedor al aceptar una oferta.
 * Genera HTML con marca (DocuSign lo convierte a PDF). Las cláusulas son un borrador
 * de negocio: el abogado fija el texto definitivo antes del primer envío real.
 */
import type { Oferta } from "./despacho.js";
import type { Proveedor } from "./proveedores.js";

const $ = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (iso: string) => new Date(iso).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", dateStyle: "long", timeStyle: "short" });

export function contratoHTML(o: Oferta, p: Proveedor): string {
  const esProyecto = o.tipo === "proyecto";
  const hitos = o.hitos?.length ? o.hitos : [{ nombre: "Pago único al completar y aceptar el trabajo", monto: o.pagoProveedor }];
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  body{font-family:Helvetica,Arial,sans-serif;color:#08243A;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.5;font-size:13px}
  h1{font-size:22px;color:#0F3D5E;margin:0 0 4px}h2{font-size:14px;color:#0F3D5E;margin:22px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}
  .marca{font-weight:800;font-size:26px;color:#0F3D5E;letter-spacing:-1px}.marca span{color:#F2621F}
  table{width:100%;border-collapse:collapse;margin:8px 0}td{padding:6px 8px;border-bottom:1px solid #eee;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}
  .firma{margin-top:36px;display:flex;gap:40px}.firma div{flex:1;border-top:1px solid #08243A;padding-top:6px;font-size:12px}
  .peq{font-size:11px;color:#5C6670}</style></head><body>
  <div class="marca">resuelto<span>.</span></div>
  <h1>Orden de trabajo y acuerdo de ejecución</h1>
  <div class="peq">Referencia ${o.referencia} · Oferta ${o.id} · Resuelto PR Home Services LLC</div>

  <h2>1. Partes</h2>
  <p><strong>Resuelto PR Home Services LLC</strong> ("Resuelto") y <strong>${p.nombre}</strong> (${p.tipo === "plomero" ? "plomero licenciado" : "contratista registrado en DACO"}, WhatsApp ${p.whatsapp}) ("el Proveedor").</p>

  <h2>2. Trabajo</h2>
  <table>
    <tr><td>Servicio / categoría</td><td>${o.categoriaNombre}</td></tr>
    <tr><td>Alcance</td><td style="text-align:left">${o.resumen}</td></tr>
    <tr><td>Zona</td><td>${o.municipio}</td></tr>
    <tr><td>${esProyecto ? "Inicio estimado" : "Ventana de llegada"}</td><td>${o.inicio ? fecha(o.inicio) : "por coordinar"}${o.fin ? " – " + new Date(o.fin).toLocaleTimeString("es-PR", { timeZone: "America/Puerto_Rico", hour: "2-digit", minute: "2-digit" }) : ""}</td></tr>
  </table>
  <p class="peq">La dirección exacta y el contacto del cliente se entregan al Proveedor dentro de la plataforma de Resuelto al confirmarse este acuerdo. El cliente es cliente de Resuelto.</p>

  <h2>3. Pago al Proveedor</h2>
  <table>${hitos.map((h) => `<tr><td>${h.nombre}</td><td>${$(h.monto)}</td></tr>`).join("")}<tr><td><strong>Total al Proveedor</strong></td><td><strong>${$(o.pagoProveedor)}</strong></td></tr></table>
  <p>${esProyecto ? "Los pagos se liberan por hitos contra fotos de avance e inspección de aceptación. El último hito queda retenido hasta la aceptación del cliente." : "Se liquida el viernes siguiente al trabajo completado y cobrado por Resuelto, junto con el reembolso de materiales con recibo más el 10% de manejo."} El cliente paga siempre a Resuelto; el Proveedor no recibe pagos del cliente por ningún medio.</p>

  <h2>4. Reglas de ejecución</h2>
  <ol>
    <li>Llegar en la ventana acordada y avisar 30 minutos antes desde la plataforma.</li>
    <li>Uniforme e identificación de Resuelto. Fotos de antes, después y de los recibos de materiales; sin fotos no se libera pago.</li>
    <li>El alcance es el que figura arriba. Cualquier cambio se reporta a Resuelto antes de ejecutarlo; Resuelto lo cotiza con el cliente.</li>
    <li>No entregar tarjetas, números personales ni cotizaciones por fuera. Toda comunicación con el cliente pasa por Resuelto.</li>
    <li>Dejar el área limpia y tratar al cliente con respeto.</li>
  </ol>

  <h2>5. Garantía</h2>
  <p>El Proveedor garantiza la mano de obra por ${esProyecto ? "12 meses" : "12 meses"}. Si el fallo es atribuible a la ejecución, realiza el re-trabajo sin costo en 48 horas. Resuelto respalda la garantía frente al cliente y cubre materiales del re-trabajo hasta el límite de su acuerdo marco.</p>

  <h2>6. Abandono e incumplimiento</h2>
  <p>Si el Proveedor no se presenta sin aviso o abandona el trabajo, Resuelto puede reasignarlo y descontar el costo de la siguiente liquidación. Tres faltas graves terminan la relación conforme al acuerdo marco.</p>

  <h2>7. Marco</h2>
  <p>Esta orden se rige por el acuerdo marco de ${p.tipo === "plomero" ? "plomero afiliado" : "contratista Resuelto Verified"} firmado por las partes, incluida la cláusula de no captación de clientes de Resuelto.</p>

  <div class="firma"><div>Por Resuelto PR Home Services LLC<br><br><span style="color:#fff">/firma_resuelto/</span></div><div>${p.nombre}<br><br><span style="color:#fff">/firma_proveedor/</span></div></div>
  <p class="peq">Aceptado en la plataforma el ${fecha(o.aceptadoEn ?? new Date().toISOString())}.</p>
</body></html>`;
}

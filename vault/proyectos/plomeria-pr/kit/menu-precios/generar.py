# Menú de precios para LLAMADAS (25/sep/2026, Elvin: "un documento que tenga todos los precios para llamarlo y ofrecerle").
# Uso interno (setter, Elvin, Aure). Sale de agente/data/menu.json: el mismo precio que da el agente por chat.
# Uso: python3 generar.py  →  menu-precios-interno.html/.pdf (membrete con kit/afiliacion/render.mjs)
import json, subprocess
from pathlib import Path
AQUI = Path(__file__).resolve().parent
DATA = AQUI / "../../agente/data"
M = json.loads((DATA / "menu.json").read_text())
T = json.loads((DATA / "territorios.json").read_text())["territorios"]
FEE, EMERG, MAT, GAR = M["cargo_coordinacion"], M["recargo_emergencia"], M["manejo_materiales_pct"], M["garantia_meses"]
DIAG = next(s for s in M["servicios"] if s["id"] == "diagnostico")["precio"]

def precio(s):
    if s.get("cotizacion"): return "Cotización en sitio"
    if s.get("rango"): return f"${s['rango'][0]:,} – ${s['rango'][1]:,}"
    return f"${s['precio']}"
def filas(nivel):
    return "".join(f"<tr><td><b>{s['nombre']}</b>{'<br><small>' + s['nota'] + '</small>' if s.get('nota') else ''}</td><td class='num'>{precio(s)}</td></tr>"
                   for s in M["servicios"] if s["nivel"] == nivel and s["id"] != "diagnostico")

pueblos = {t["id"]: t["municipios"] for t in T}
CSS = """@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1c2a36;font-size:10pt;line-height:1.4;margin:0}
h1,h2{font-family:'Sora';color:#0F3D5E;margin:0}h1{font-size:20pt;letter-spacing:-.5px}h2{font-size:12pt;margin:16px 0 6px}
.tag{font-family:'Sora';font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:#F2621F;font-weight:700}
.aviso{background:#FBF7F0;border-left:4px solid #F2621F;padding:8px 12px;font-size:9pt;margin:8px 0 10px}
.reglas{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;font-size:9.5pt}.reglas div{border-bottom:1px solid #e6e1d8;padding:4px 0}
table{width:100%;border-collapse:collapse;font-size:9.5pt}td,th{border-bottom:1px solid #e6e1d8;padding:5px 6px;text-align:left;vertical-align:top}
th{font-family:'Sora';font-size:8.5pt;color:#0F3D5E}.num{text-align:right;white-space:nowrap;font-family:'Sora';font-weight:700;color:#0F3D5E}
small{color:#5C6670;font-size:8pt}.caja{background:#0F3D5E;color:#fff;border-radius:10px;padding:10px 14px;margin:8px 0}.caja b{color:#FFB48E}
ol{margin:4px 0 4px 20px;padding:0}li{margin:3px 0}.pag{page-break-before:always}"""
HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="tag">Uso interno · para llamar y cerrar</div><h1>Menú de precios de Resuelto</h1>
<div class="aviso">Son los mismos precios que da el agente por chat (<i>agente/data/menu.json</i>). <b>Mano de obra con precio fijo</b>; el cliente paga <b>+ ${FEE} de coordinación</b> por visita. Nunca des un precio que no esté aquí: si no aparece, se agenda un diagnóstico de ${DIAG}.</div>
<h2>Las reglas que siempre se dicen</h2>
<div class="reglas">
<div><b>Coordinación:</b> + ${FEE} por visita (agenda, seguimiento, pago digital y garantía).</div>
<div><b>Garantía:</b> {GAR} meses en la mano de obra. Si falla, volvemos en 48 horas sin costo.</div>
<div><b>Diagnóstico:</b> ${DIAG}. Se acredita al trabajo si se hace con nosotros.</div>
<div><b>Emergencia:</b> + ${EMERG} (noche después de las 6 PM, fin de semana o feriado).</div>
<div><b>Ventana:</b> de 2 horas; el plomero avisa 30 minutos antes.</div>
<div><b>Pago:</b> por link de Resuelto (ATH Móvil o tarjeta). Nunca en efectivo al plomero.</div>
<div><b>Materiales:</b> aparte, al costo con recibo, y el cliente los aprueba antes de instalarlos.</div>
<div><b>Solo para ti:</b> los materiales llevan {MAT}% de manejo. No lo digas si no preguntan; si preguntan, di la verdad. Si el cliente ya los compró, no se cobra nada.</div>
</div>
<h2>Trabajos pequeños</h2><table><tr><th>Servicio</th><th class="num">Mano de obra</th></tr>{filas("P")}</table>
<h2>Trabajos medianos</h2><table><tr><th>Servicio</th><th class="num">Mano de obra</th></tr>{filas("M")}</table>
<h2>Trabajos grandes (precio fijo por escrito en sitio, antes de empezar)</h2><table><tr><th>Servicio</th><th class="num">Rango</th></tr>{filas("G")}</table>
<p><small>En los trabajos grandes se da el rango, el plomero confirma el precio fijo por escrito en sitio y se aparta el 50% al agendar.</small></p>
<div class="pag"></div>
<div class="tag">Uso interno</div><h1>Cómo ofrecerlo por teléfono</h1>
<h2>Dónde hay servicio hoy</h2>
<table><tr><th>Área</th><th>Plomero</th><th>Pueblos</th></tr>
<tr><td><b>Caguas (T3)</b></td><td>Edgar Arroyo</td><td>{", ".join(pueblos["T3"])}</td></tr>
<tr><td><b>Quebradillas (T5)</b></td><td>Samuel Feliciano</td><td>Quebradillas, Camuy, Hatillo, Arecibo <small>(el resto del Norte, confirmarlo con él)</small></td></tr></table>
<p><small>Fuera de esas zonas: se anota en la lista de espera y se le avisa cuando abramos. Los plomeros deciden qué trabajos cogen: la cita se confirma cuando el plomero la acepta.</small></p>
<h2>La llamada: primero escuchar, después vender</h2>
<div class="aviso"><b>El propósito no es vender rápido.</b> Es que el cliente se sienta atendido: saludar, presentarse, escuchar su problema y llegar a un diagnóstico. La venta sale sola de ahí.</div>
<ol>
<li><b>Saluda por su nombre:</b> "Hola, [nombre], ¿cómo estás?".</li>
<li><b>Preséntate:</b> "Te habla [tu nombre], de Resuelto PR. Estamos alrededor de la isla y ya estamos dando servicio en [su pueblo]".</li>
<li><b>Recuérdale por qué lo llamas:</b> "Nos escribiste por las redes por un problema de plomería: [lo que dijo]". Si no dijo cuál, pregunta: "Cuéntame, ¿qué está pasando, para ver cómo te podemos ayudar?".</li>
<li><b>Escucha y anota.</b> Deja que lo cuente completo. No interrumpas ni ofrezcas nada todavía.</li>
<li><b>Pide fotos del área</b> si no las mandó por las redes: "Para tenerlo en récord y que el plomero llegue preparado, ¿me mandas unas fotos por el mismo chat?".</li>
<li><b>Diagnóstico:</b>
  <br>• Si el problema está claro y está en el menú: "Eso es $[precio] fijo de mano de obra, más ${FEE} de coordinación, con {GAR} meses de garantía".
  <br>• Si no está claro o no está en el menú: ofrece la <b>visita de diagnóstico de ${DIAG}</b>. El plomero ve el problema y te da el precio fijo por escrito; si se hace el trabajo, los ${DIAG} se acreditan.</li>
<li><b>Cierra con horario, no con preguntas:</b> "¿Te sirve mañana de 10 a 12 o de 1 a 3?". Toma nombre completo, dirección exacta y un punto de referencia.</li>
<li><b>Cierre:</b> "Te confirmamos por mensaje cuando el plomero acepte; te avisa 30 minutos antes de llegar. El pago es por el link de Resuelto cuando termine".</li>
</ol>
<h2>Objeciones que salen</h2>
<table>
<tr><td><b>"¿Por qué ${FEE} de coordinación?"</b></td><td>Es lo que cubre la agenda, el aviso antes de llegar, el pago digital y la garantía por escrito. Si no llegamos en la ventana, no se cobra.</td></tr>
<tr><td><b>"¿Le puedo pagar en efectivo al plomero?"</b></td><td>No: se paga por el link de Resuelto, y así queda la garantía por escrito.</td></tr>
<tr><td><b>"¿Y los materiales?"</b></td><td>Al costo, con recibo, y los apruebas antes. Si ya los compraste, los usamos sin costo extra.</td></tr>
<tr><td><b>"Está caro"</b></td><td>Una vez: licenciado, precio fijo sin sorpresas, garantía de {GAR} meses. Si insiste, ofrece el diagnóstico de ${DIAG}, que se acredita.</td></tr>
<tr><td><b>"No es de la lista"</b></td><td>Diagnóstico de ${DIAG}: el plomero ve el trabajo y da el precio fijo por escrito antes de tocar nada.</td></tr>
</table>
<div class="caja"><b>Administradores de propiedades</b> (Airbnb, alquileres, condominios): precios del menú por unidad, historial de cada trabajo con fotos y <b>plan de mantenimiento desde $399 al mes</b>, a la medida. Toma cuántas propiedades o unidades maneja y en qué pueblos. Las áreas comunes de un condominio o un local comercial van como "Comercial" (cotización).</div>
</body></html>"""
h = AQUI / "menu-precios-interno.html"; h.write_text(HTML, encoding="utf-8")
subprocess.run(["node", str(AQUI / "../afiliacion/render.mjs"), str(h), str(AQUI / "menu-precios-interno.pdf"), "Menú de precios · uso interno · Resuelto PR Home Services LLC"], check=True)
print("✔", AQUI / "menu-precios-interno.pdf")

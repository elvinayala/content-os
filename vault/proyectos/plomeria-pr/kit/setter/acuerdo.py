# Acuerdo de servicios de la setter de clientes (26/sep/2026, Elvin: "hazle un acuerdo de servicio a la setter; envíaselo
# a Aure"). Contratista independiente, comisión del 6.5 % de la mano de obra cobrada + mínimo de arranque (SETTER-CLIENTES.md).
# Borrador para revisión del abogado. Uso: python3 acuerdo.py → acuerdo-setter.pdf
import subprocess
from pathlib import Path
AQUI = Path(__file__).resolve().parent
CSS = """@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1c2a36;font-size:9.6pt;line-height:1.45;margin:0}
h1,h2{font-family:'Sora';color:#0F3D5E;margin:0}h1{font-size:17pt}h2{font-size:10.5pt;margin:11px 0 3px}
.tag{font-family:'Sora';font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:#F2621F;font-weight:700}
p{margin:3px 0}ul{margin:2px 0 2px 18px;padding:0}li{margin:1px 0}
table{width:100%;border-collapse:collapse;margin:4px 0}td{border-bottom:1px solid #e6e1d8;padding:3px 6px}.n{font-family:'Sora';font-weight:700;color:#0F3D5E;white-space:nowrap}
.firmas{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:26px}.linea{border-top:1px solid #1c2a36;padding-top:4px;margin-top:38px;font-size:9pt}
.blank{display:inline-block;border-bottom:1px solid #1c2a36;min-width:190px}"""
HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="tag">Acuerdo de servicios · contratista independiente</div><h1>Setter de clientes</h1>
<p style="margin-top:8px">Este acuerdo se firma el <span class="blank" style="min-width:120px"></span> de 2026 entre <b>Resuelto PR Home Services LLC</b>, compañía de responsabilidad limitada organizada bajo las leyes de Puerto Rico, registro núm. 591463 del Departamento de Estado ("Resuelto"), y <span class="blank"></span>, mayor de edad, con teléfono 787-733-8072 ("la Setter").</p>

<h2>1. El servicio</h2>
<p>La Setter atiende a los clientes de plomería de Resuelto por teléfono y los convierte en citas: contesta las llamadas que entran al 787-956-1111 y se desvían a su celular, devuelve las llamadas perdidas y llama a quienes escribieron por las redes y dejaron su número. Agenda en la página de reserva de Resuelto con los precios del menú oficial y sigue el procedimiento (SOP) que Resuelto le entrega, que puede actualizarse por escrito.</p>

<h2>2. Contratista independiente</h2>
<p>La Setter no es empleada de Resuelto. Usa su propio celular y equipo, organiza su tiempo y puede prestar servicios a otros, siempre que no sean empresas de plomería o de servicios del hogar que compitan con Resuelto. Acuerdan una ventana de atención de <b>lunes a sábado, de 8:00 AM a 7:00 PM</b>, en la que las llamadas se desvían a su celular. Si no va a estar disponible, avisa con anticipación para que las llamadas pasen a la contestadora. Es responsable de sus contribuciones y de su seguro social. Resuelto le emitirá el Formulario 480.6A y hará las retenciones que exija la ley.</p>

<h2>3. Compensación</h2>
<table>
<tr><td>Por cada trabajo de plomería <b>completado y cobrado</b> que venga de su gestión</td><td class="n">6.5 % de la mano de obra cobrada</td></tr>
<tr><td>Por cada proyecto de remodelación de la División de Proyectos (baño, cocina, etc.) que el cliente firme y del que pague el depósito</td><td class="n">$100</td></tr>
<tr><td>Bono de la semana (lunes a domingo): 10 trabajos cobrados o más</td><td class="n">+$50</td></tr>
<tr><td>Bono de la semana: 20 trabajos cobrados o más (en lugar del de $50; es el máximo)</td><td class="n">+$100</td></tr>
<tr><td>Mínimo de arranque: primeras 8 semanas, si sus comisiones de la semana no llegan a esa cantidad, Resuelto completa la diferencia (máximo $800 en total)</td><td class="n">$100 por semana</td></tr></table>
<ul><li><b>Qué cuenta como su gestión:</b> la llamada entrante que atendió, la llamada que devolvió o el cliente de un aviso que ella llamó, si el cliente agenda dentro de los 7 días siguientes.</li>
<li>La comisión se calcula sobre la <b>mano de obra</b>: no incluye materiales, el cargo de coordinación, impuestos ni propinas. Las citas canceladas, los trabajos no cobrados y los reembolsos no generan comisión; si se reembolsa un trabajo ya pagado, se descuenta del próximo pago.</li>
<li>El mínimo de arranque aplica en las semanas en que cumplió la ventana de atención acordada.</li>
<li><b>Pago:</b> los viernes, por ATH Móvil o transferencia, con el detalle de cada trabajo cobrado hasta el miércoles anterior.</li></ul>

<h2>4. Reglas del servicio</h2>
<ul><li>Da solo los precios del menú oficial. No inventa precios, descuentos ni promociones.</li>
<li>Nunca cobra al cliente, no recibe dinero y no pide números de tarjeta por teléfono. Todo pago va a Resuelto por su enlace de pago.</li>
<li>No promete un plomero ni una hora exacta: la cita se confirma cuando un plomero la acepta.</li>
<li>No da el número personal de ningún plomero ni atiende a los clientes por fuera de Resuelto.</li>
<li>No graba las llamadas.</li>
<li>Trata a cada cliente con respeto y paciencia, y deja el resultado de cada llamada donde indica el SOP.</li></ul>

<h2>5. Clientes y confidencialidad</h2>
<p>Los clientes, sus datos, las conversaciones, los precios internos y los procesos de Resuelto son confidenciales y pertenecen a Resuelto. La Setter los usa solo para prestar este servicio, no los copia ni los comparte, y los devuelve o borra al terminar el acuerdo. Durante el acuerdo y por <b>12 meses</b> después, no dirigirá clientes de Resuelto a otro plomero o empresa.</p>

<h2>6. Duración y terminación</h2>
<p>El acuerdo empieza al firmarse y es por tiempo indefinido. Cualquiera de las partes lo puede terminar con <b>7 días</b> de aviso escrito (un mensaje de texto cuenta). Resuelto lo puede terminar de inmediato si la Setter cobra a un cliente, falsea una cita o un resultado, maltrata a un cliente o incumple la sección 5. Al terminar, Resuelto paga las comisiones de los trabajos que se cobren dentro de los 14 días siguientes.</p>

<h2>7. General</h2>
<p>Este es el acuerdo completo entre las partes. Cualquier cambio se hace por escrito. Se rige por las leyes de Puerto Rico.</p>

<div class="firmas"><div><div class="linea"><b>Resuelto PR Home Services LLC</b><br>Por: Elvin Ayala · Fecha: ____________</div></div>
<div><div class="linea"><b>La Setter</b><br>Nombre: ____________________ · Fecha: ________</div></div></div>
</body></html>"""
h = AQUI / "acuerdo-setter.html"; h.write_text(HTML, encoding="utf-8")
subprocess.run(["node", str(AQUI / "../afiliacion/render.mjs"), str(h), str(AQUI / "acuerdo-setter.pdf"), "Acuerdo de servicios · Setter de clientes · Resuelto PR Home Services LLC"], check=True)
print("✔", AQUI / "acuerdo-setter.pdf")

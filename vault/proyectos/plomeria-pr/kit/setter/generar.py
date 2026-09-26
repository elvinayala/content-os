# SOP de la setter de clientes (26/sep/2026, Elvin: "el rol de la setter completo, tipo SOP, breve y preciso, para Aure").
# Precios de agente/data/menu.json; comisiones de SETTER-CLIENTES.md. Uso: python3 generar.py → sop-setter.pdf
import json, subprocess
from pathlib import Path
AQUI = Path(__file__).resolve().parent
M = json.loads((AQUI / "../../agente/data/menu.json").read_text())
FEE, GAR = M["cargo_coordinacion"], M["garantia_meses"]
DIAG = next(s for s in M["servicios"] if s["id"] == "diagnostico")["precio"]
MENU = "app.resueltopr.com/kit/menu-precios-interno-r7q4.pdf"
CSS = """@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');
*{box-sizing:border-box}body{font-family:'DM Sans',sans-serif;color:#1c2a36;font-size:9.8pt;line-height:1.4;margin:0}
h1,h2{font-family:'Sora';color:#0F3D5E;margin:0}h1{font-size:19pt;letter-spacing:-.5px}h2{font-size:11.5pt;margin:13px 0 5px}
.tag{font-family:'Sora';font-size:8pt;letter-spacing:2px;text-transform:uppercase;color:#F2621F;font-weight:700}
.aviso{background:#FBF7F0;border-left:4px solid #F2621F;padding:7px 12px;margin:7px 0}
table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #e6e1d8;padding:4px 6px;text-align:left;vertical-align:top}
th{font-family:'Sora';font-size:8.5pt;color:#0F3D5E}.n{white-space:nowrap;font-family:'Sora';font-weight:700;color:#0F3D5E}
ol,ul{margin:3px 0 3px 18px;padding:0}li{margin:2px 0}.pag{page-break-before:always}small{color:#5C6670}"""
HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="tag">SOP · uso interno</div><h1>Setter de clientes · Resuelto PR</h1>
<div class="aviso"><b>Tu trabajo:</b> convertir cada persona que llama o deja su número en una cita agendada. No vendes rápido: escuchas, entiendes el problema y cierras con un horario. Horario: <b>lunes a sábado, 8 AM a 7 PM</b>.</div>

<h2>1. De dónde te llega el trabajo</h2>
<table><tr><th>Qué llega</th><th>Qué haces</th><th>Tiempo</th></tr>
<tr><td><b>Llamada entrante</b> al 787-956-1111 (sale en tu celular con ese número)</td><td>Contesta: "Resuelto PR, buenas, te habla [tu nombre]". Sigue el guion.</td><td class="n">al momento</td></tr>
<tr><td><b>📞 Llamada perdida</b> (aviso con número y mensaje de voz)</td><td>Devuelve la llamada. Al cliente ya le llegó un texto diciendo que lo llamamos.</td><td class="n">&lt; 15 min</td></tr>
<tr><td><b>📞 Llama para cerrar</b> (escribió por Messenger/IG, dio su número y no agendó)</td><td>Abre la conversación del aviso, lee lo que pidió y llámalo.</td><td class="n">&lt; 15 min</td></tr>
<tr><td><b>Cita sin plomero</b> (ningún plomero la aceptó)</td><td>Llama al cliente para moverle el día o la hora.</td><td class="n">&lt; 30 min</td></tr></table>

<h2>2. El guion (8 pasos)</h2>
<ol><li><b>Saluda</b> por su nombre.</li>
<li><b>Preséntate:</b> "de Resuelto PR; estamos alrededor de la isla y ya damos servicio en [su pueblo]".</li>
<li><b>Recuérdale</b> lo que escribió, o pregunta: "¿qué está pasando?".</li>
<li><b>Escucha y anota.</b> No interrumpas ni ofrezcas nada todavía.</li>
<li><b>Pide fotos del área</b> por texto al 787-956-1111 o por el chat donde escribió.</li>
<li><b>Da el precio del menú</b> ("$[precio] fijo de mano de obra + ${FEE} de coordinación, {GAR} meses de garantía"). Si no está claro o no está en el menú: <b>visita de diagnóstico de ${DIAG}</b>, que se acredita al trabajo.</li>
<li><b>Cierra con horario:</b> "¿Te sirve mañana de 10 a 12 o de 1 a 3?".</li>
<li><b>Agéndalo tú mismo</b> en <b>app.resueltopr.com/reservar</b> mientras sigues en la llamada (servicio, pueblo, día, ventana, nombre, teléfono, dirección y referencia). Dile: "Te confirmamos por texto cuando el plomero acepte".</li></ol>
<p><small>Precios y objeciones: menú interno en {MENU}.</small></p>

<h2>3. El pago (lo que le dices al cliente)</h2>
<p>El cliente <b>no paga nada al agendar</b> y <b>nunca le paga al plomero</b>. Cuando el plomero termina, al cliente le llega un <b>link de Resuelto</b> (tarjeta o ATH Móvil) con el desglose. La garantía de {GAR} meses queda por escrito con ese pago.</p>

<h2 class="pag">4. Reglas que no se rompen</h2>
<ul><li>Nunca des un precio que no esté en el menú ni inventes descuentos. Si no está: diagnóstico de ${DIAG}.</li>
<li>Materiales: solo si preguntan: "al costo, con recibo, y los apruebas antes". No menciones porcentajes.</li>
<li>No prometas un plomero ni una hora exacta: la cita queda en una ventana de 2 horas y se confirma cuando un plomero acepta. Los plomeros deciden qué trabajos cogen.</li>
<li>Nunca pidas números de tarjeta por teléfono. Nunca des el número personal de un plomero.</li>
<li>Pueblo sin servicio todavía: toma nombre, teléfono y pueblo y dile que le avisamos cuando lleguemos.</li>
<li>Un "no" es un no: una sola vez ofreces el diagnóstico; si no quiere, das las gracias y cierras.</li>
<li><b>Solo clientes.</b> Si te llama un plomero, un contratista o alguien buscando trabajo, no es tuyo: el reclutamiento lo lleva Yaileen. Dile que le escriba a Resuelto PR por Messenger o Instagram y ahí lo atienden.</li></ul>

<h2>5. Después de cada llamada</h2>
<p>Responde al aviso en el grupo de Telegram <b>"Resuelto · Ventas"</b> con una línea: <b>Agendó</b> (día y servicio) · <b>No contestó</b> (lo vuelves a intentar a las 2 horas; máximo 3 intentos) · <b>Lo pensará</b> (día y hora para volver a llamar) · <b>No le interesa</b> (motivo).</p>

<h2>6. Cómo se mide</h2>
<table><tr><td>Respuesta a los avisos</td><td class="n">&lt; 15 min</td></tr><tr><td>Llamadas que terminan en cita</td><td class="n">≥ 40 %</td></tr><tr><td>Citas que se completan y se cobran</td><td class="n">≥ 80 %</td></tr></table>

<h2>7. Cómo cobras</h2>
<p>Contratista independiente. Cobras <b>por trabajo completado y cobrado</b> (no por cita agendada), los viernes, por ATH Móvil o transferencia, con el detalle.</p>
<table><tr><td>Cada trabajo de plomería completado y cobrado</td><td class="n">6.5 % de la mano de obra</td></tr>
<tr><td><small>Ejemplos: destape $149 → $9.69 · calentador $279 → $18.14 · diagnóstico $69 → $4.49</small></td><td></td></tr>
<tr><td>Proyecto de remodelación (baño, cocina…) que el cliente firme y deposite</td><td class="n">$100</td></tr><tr><td>Bono de la semana: 10 trabajos cobrados o más</td><td class="n">+$50</td></tr><tr><td>Bono de la semana: 20 trabajos cobrados o más (máximo)</td><td class="n">+$100</td></tr>
<tr><td>Arranque: primeras 8 semanas, mínimo garantizado</td><td class="n">$100/semana (tope $800)</td></tr></table>
<p><small>Cuenta si el cliente vino de un aviso tuyo o de tu llamada, agendó dentro de 7 días y el trabajo se cobró.</small></p>

<h2>8. Primer día</h2>
<ol><li>Aure te agrega al grupo de Telegram "Resuelto · Ventas".</li><li>El 787-956-1111 ya se desvía a tu celular (lunes a sábado, 8 AM a 7 PM). <b>Apaga el buzón de voz de tu celular</b> (o pide a tu compañía que lo quite): si no, las llamadas que no contestes caen en tu buzón personal y no en el de Resuelto, y nadie se entera.</li>
<li>20 minutos de repaso del menú y del guion con Aure; una llamada de práctica.</li><li>Una reserva de prueba en app.resueltopr.com/reservar con Aure (se cancela después).</li></ol>
</body></html>"""
h = AQUI / "sop-setter.html"; h.write_text(HTML, encoding="utf-8")
subprocess.run(["node", str(AQUI / "../afiliacion/render.mjs"), str(h), str(AQUI / "sop-setter.pdf"), "SOP · Setter de clientes · Resuelto PR Home Services LLC"], check=True)
print("✔", AQUI / "sop-setter.pdf")

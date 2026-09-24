# Acuerdo de afiliación (provisional) + Kit de bienvenida para plomeros de Resuelto. 23/sep/2026.
# Fuente de los términos: kit/contrato-plomero-borrador.md (decisiones de Elvin) y agente/data/menu.json.
# Uso: python3 generar.py  → *.html + *.pdf (Chrome headless)
import json, os, subprocess, pathlib
AQUI = pathlib.Path(__file__).parent
MENU = json.load(open(AQUI / "../../agente/data/menu.json"))
LOGO = (AQUI / "../logo/logo-horizontal-azul.png").resolve().as_uri()
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap');

* { box-sizing: border-box; }
body { font-family: 'DM Sans', sans-serif; color: #1c2a36; font-size: 10.5pt; line-height: 1.45; margin: 0; }
h1, h2, h3 { font-family: 'Sora', sans-serif; color: #0F3D5E; margin: 0; }
h1 { font-size: 20pt; letter-spacing: -.5px; }
h2 { font-size: 12pt; margin: 16px 0 6px; }
h3 { font-size: 10.5pt; margin: 10px 0 4px; }
.top { border-bottom: 1px solid #e6e1d8; padding-bottom: 8px; margin-bottom: 12px; }
.top img { height: 34px; }
.tag { font-family: 'Sora'; font-size: 8pt; letter-spacing: 2px; text-transform: uppercase; color: #F2621F; font-weight: 700; }
.aviso { background: #FBF7F0; border-left: 4px solid #F2621F; padding: 8px 12px; font-size: 9pt; margin: 10px 0 14px; }
.campo { display: inline-block; border-bottom: 1px solid #8a97a3; min-width: 190px; height: 14px; }
.campo.l { min-width: 320px; } .campo.s { min-width: 110px; }
ol, ul { margin: 4px 0 4px 26px; padding: 0; } li { margin: 2px 0; }
.firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 16px; }
.firma { border-top: 1px solid #1c2a36; padding-top: 6px; font-size: 9pt; }
.hoja + .hoja { page-break-before: always; }
.trazo .campo { border-bottom: 0; }
.firma .trazo { min-height: 30px; border-bottom: 1px solid #1c2a36; margin-bottom: 6px; }
.firma { border-top: 0 !important; }
.chk { font-size: 11pt; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
td, th { border-bottom: 1px solid #e6e1d8; padding: 4px 6px; text-align: left; } th { color: #0F3D5E; font-family: 'Sora'; font-size: 9pt; }
.num { text-align: right; white-space: nowrap; }
.caja { background: #0F3D5E; color: #fff; border-radius: 10px; padding: 12px 16px; margin: 10px 0; }
.caja h2 { color: #fff; margin-top: 0; } .caja b { color: #FFB48E; }
.pasos li { margin: 5px 0; } .check li { list-style: "☐  "; }
.pie { font-size: 8pt; color: #5C6670; margin-top: 18px; }
"""

def cab(tag, titulo):
    return f'<div class="top"><div><div class="tag">{tag}</div><h1>{titulo}</h1></div></div>'

# ── Marcas que usa la firma electrónica (agente/src/firmas): el PDF en blanco las lleva igual (no se ven) ──
def campo(nombre, clase=""):
    return f'<span class="campo {clase}" data-campo="{nombre}"></span>'
def chk(nombre, etiqueta):
    return f'<span class="chk" data-check="{nombre}">☐</span> {etiqueta}'
def firma(quien, etiqueta, extra=""):
    return f'<div class="firma" data-firma="{quien}"><div class="trazo"></div>{etiqueta}{extra}</div>'
def hoja(n, titulo, html):
    return f'<section class="hoja" data-hoja="{n}" data-titulo="{titulo}">{html}</section>'

PROVISIONAL = """<div class="aviso"><b>Acuerdo provisional.</b> Rige desde su firma hasta que las partes firmen el contrato definitivo que prepara el abogado de Resuelto, o por <b>90 días</b>, lo que ocurra primero. Si el contrato definitivo no se firma en ese plazo, este acuerdo termina sin penalidad para ninguna de las partes, salvo lo dispuesto en las secciones 5, 6 y 9.</div>"""
RESUELTO_PARTE = """<b>Resuelto Home Services LLC</b>, compañía de responsabilidad limitada organizada bajo las leyes del Estado Libre Asociado de Puerto Rico, representada por Elvin Ayala ("Resuelto")"""
FIRMADO_EN = f"""<p>Firmado en {campo("lugar", "s")}, Puerto Rico, a {campo("dia", "s")} de {campo("mes", "s")} de 2026.</p>"""
FIRMA_RESUELTO = firma("resuelto", "Por Resuelto Home Services LLC<br>Elvin Ayala, fundador")

SEC = {
 1: """<h2>1. Relación</h2>
<p>El Plomero trabaja como <b>contratista independiente</b>, no como empleado. Mantiene por su cuenta su licencia, colegiación, vehículo, herramientas y sus clientes propios fuera de Resuelto. Resuelto no garantiza un volumen mínimo de trabajos. Resuelto emitirá la declaración informativa que corresponda según las leyes contributivas de Puerto Rico.</p>""",
 2: """<h2>2. Lo que pone Resuelto</h2>
<p>Los clientes y la publicidad pagada, la marca, la atención al cliente por WhatsApp, la cotización con precios publicados, la agenda y el despacho, el cobro al cliente, la facturación, la garantía al cliente y el servicio post-venta.</p>""",
 3: """<h2>3. Lo que pone el Plomero</h2>
<p>El trabajo bien hecho dentro de la ventana acordada, con licencia vigente, identificación de Resuelto, fotos de antes y después, recibo de materiales y trato respetuoso al cliente, siguiendo las Reglas de Oro (Anexo A).</p>""",
 4: f"""<h2>4. Pago</h2>
<ul>
<li><b>65% de la mano de obra</b> de cada trabajo completado y cobrado al cliente. Resuelto retiene el 35%.</li>
<li>El cargo de coordinación que paga el cliente (${MENU['cargo_coordinacion']}) es de Resuelto. El recargo de emergencia (+${MENU['recargo_emergencia']}) se reparte 65% / 35% igual que la mano de obra.</li>
<li><b>Materiales:</b> el Plomero los compra y entrega el recibo con foto. Resuelto le reembolsa el <b>100% del costo</b> y le paga un <b>10% adicional</b> por manejo. Si Resuelto suple un equipo mayor (cisterna, calentador, bomba), el Plomero cobra solo la mano de obra.</li>
<li><b>Liquidación semanal los viernes</b>, por ATH Móvil o transferencia, con estado de cuenta por trabajo. Solo se liquidan trabajos ya cobrados al cliente.</li>
</ul>""",
 5: """<h2>5. El cliente es de Resuelto</h2>
<p>Todo cliente atendido por medio de Resuelto es cliente de Resuelto. El Plomero no le dará tarjetas, números personales, redes ni cotizaciones por fuera, ni lo atenderá directamente mientras dure la relación ni durante <b>24 meses</b> después. Toda comunicación con el cliente pasa por el WhatsApp de Resuelto. Incumplir esta sección es causa de terminación inmediata y de una penalidad de <b>$2,500 por cliente</b>, más los gastos de cobro.</p>""",
 6: """<h2>6. Nunca cobra el Plomero</h2>
<p>El Plomero no cobra al cliente ni mano de obra ni materiales, por ningún medio. Todo pago va a Resuelto. Si un cliente insiste en pagar en efectivo, el Plomero lo recibe a nombre de Resuelto, lo reporta en el momento y lo deposita el mismo día.</p>""",
 7: f"""<h2>7. Garantía</h2>
<p>La mano de obra tiene <b>{MENU['garantia_meses']} meses</b> de garantía al cliente. Si el fallo es por la ejecución, el Plomero lo corrige sin costo en <b>48 horas</b>; Resuelto cubre materiales del re-trabajo hasta $150. Si el Plomero no responde, Resuelto asigna a otro y descuenta el costo de la siguiente liquidación.</p>""",
 8: """<h2>8. Calidad y terminación</h2>
<p>Calificación promedio mínima de <b>4.8</b>. <b>Tres faltas</b> (no presentarse sin aviso, cobrar directo, queja grave verificada, no enviar fotos de forma repetida) son causa de terminación. Cualquiera de las partes puede terminar con <b>15 días</b> de aviso por escrito (WhatsApp cuenta).</p>""",
 9: """<h2>9. Confidencialidad e imagen</h2>
<p>Precios, procesos y listas de clientes de Resuelto son confidenciales. El Plomero autoriza a Resuelto a usar su nombre, foto y las fotos de sus trabajos en su comunicación.</p>""",
 10: """<h2>10. Cumplimiento y seguro</h2>
<p>El Plomero declara que su licencia y colegiación están vigentes, cumple con la ley y el reglamento de plomería de Puerto Rico y avisará cualquier suspensión en 24 horas. Dentro de los <b>60 días</b> siguientes a la firma entregará evidencia de <b>seguro de responsabilidad pública por un mínimo de $300,000</b> por incidente, con <b>Resuelto Home Services LLC como asegurado adicional</b>, y la mantendrá vigente. Si no la entrega en ese plazo, Resuelto pausará las ofertas de trabajo hasta que la entregue. Cada parte responde por sus propios actos.</p>""",
}

HOJA_ACUERDO_1 = f"""{cab("Plomeros afiliados", "Acuerdo de afiliación")}
{PROVISIONAL}
<p><b>Entre</b> {RESUELTO_PARTE}, <b>y</b></p>
<p>Nombre: {campo("nombre", "l")} &nbsp; Teléfono: {campo("telefono", "s")}<br>
Dirección: {campo("direccion", "l")} &nbsp; Municipio: {campo("municipio", "s")}<br>
Licencia de plomero: {chk("lic_oficial", "Oficial")} {chk("lic_maestro", "Maestro")} · Núm. {campo("lic_num", "s")} · Colegiación núm. {campo("colegiacion", "s")} ("el Plomero").<br>
<i style="font-size:9pt">Si no tiene licencia, se firma el Acuerdo de ayudante (Anexo B) en lugar de este acuerdo.</i></p>
{SEC[1]}{SEC[2]}{SEC[3]}{SEC[4]}"""
HOJA_ACUERDO_2 = f"""{SEC[5]}{SEC[6]}{SEC[7]}{SEC[8]}{SEC[9]}{SEC[10]}
{FIRMADO_EN}
<div class="firmas">{firma("firmante", "El Plomero", ' · Nombre: ' + campo("nombre_firma"))}{FIRMA_RESUELTO}</div>"""
HOJA_REGLAS = f"""{cab("Anexo A · Se firma aparte y va contigo", "Reglas de oro")}
<ol class="pasos" style="font-size:11.5pt">
<li><b>El cliente es de Resuelto.</b> Ni tarjeta, ni número, ni cotización por fuera.</li>
<li><b>Nunca cobras tú.</b> Todo pago va a Resuelto. Efectivo se reporta y se deposita el mismo día.</li>
<li><b>Llegas en la ventana</b> de 2 horas y avisas 30 minutos antes. Si vas tarde, avisas antes de que empiece.</li>
<li><b>Identificación de Resuelto</b>, zapatones al entrar y te presentas: tu nombre, "de Resuelto", el trabajo y el precio confirmado.</li>
<li><b>Precio confirmado antes de tocar nada.</b> Cualquier cambio de alcance o precio se aprueba con el cliente y con Resuelto primero.</li>
<li><b>Fotos de antes, después y del recibo.</b> Sin fotos no se cierra el trabajo ni se paga.</li>
<li><b>Dejas el área limpia.</b></li>
<li><b>Garantía de 12 meses:</b> si falló tu trabajo, vuelves en 48 horas.</li>
<li><b>Calificación mínima 4.8.</b> Tres faltas y sales.</li>
<li><b>Te pagamos los viernes, siempre.</b></li>
</ol>
<div class="firmas">{firma("firmante", "Firma del Plomero / Ayudante")}<div class="firma"><div class="trazo">{campo("fecha")}</div>Fecha</div></div>"""
HOJA_AYUDANTE = f"""{cab("Anexo B · Sin licencia de plomero", "Acuerdo de ayudante")}
<div class="aviso">Para quien todavía no tiene licencia de plomero pero trae experiencia. En Puerto Rico la plomería la hace un plomero licenciado: el Ayudante trabaja <b>siempre acompañado y bajo la supervisión</b> de un plomero licenciado afiliado a Resuelto.</div>
<p><b>Entre</b> {RESUELTO_PARTE}, <b>y</b></p>
<p>Nombre: {campo("nombre", "l")} &nbsp; Teléfono: {campo("telefono", "s")}<br>
Municipio: {campo("municipio", "s")} &nbsp; Años de experiencia: {campo("anos", "s")} &nbsp; ¿Está sacando la licencia? {chk("sacando_si", "Sí")} {chk("sacando_no", "No")}</p>
<ol class="pasos">
<li><b>Trabajo acompañado.</b> El Ayudante no hace trabajos solo, no firma ni certifica trabajos y sigue las instrucciones del plomero licenciado a cargo.</li>
<li><b>Pago: $15 por hora</b> trabajada en trabajos de Resuelto, según las horas que confirme el plomero licenciado a cargo. Se liquida los viernes, por ATH Móvil o transferencia. Solo se liquidan trabajos cobrados al cliente.</li>
<li>Aplican igual las secciones <b>1</b> (relación), <b>5</b> (el cliente es de Resuelto), <b>6</b> (nunca cobra), <b>8</b> (calidad y terminación) y <b>9</b> (confidencialidad) del Acuerdo de afiliación, y las Reglas de Oro (Anexo A).</li>
<li><b>Cuando saque la licencia</b>, avisa a Resuelto con copia y pasa a firmar el Acuerdo de afiliación de plomero.</li>
<li>Este anexo también es provisional y sigue la misma vigencia del Acuerdo (90 días o el contrato definitivo).</li>
</ol>
{FIRMADO_EN}
<div class="firmas">{firma("firmante", "El Ayudante", ' · Nombre: ' + campo("nombre_firma"))}{FIRMA_RESUELTO}</div>"""
HOJA_AYUDANTE_SECCIONES = f"""{cab("Anexo B · Condiciones que aplican al ayudante", "Secciones del acuerdo")}
{PROVISIONAL}
<p style="font-size:9.5pt"><i>En estas secciones del Acuerdo de afiliación, "el Plomero" se refiere también al Ayudante.</i></p>
{SEC[1]}{SEC[5]}{SEC[6]}{SEC[8]}{SEC[9]}"""

def documento(hojas):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>' + "".join(hojas) + "</body></html>"

# PDF en blanco (para imprimir): acuerdo + reglas + ayudante, como antes
ACUERDO = documento([hoja(1, "Acuerdo · parte 1", HOJA_ACUERDO_1), hoja(2, "Acuerdo · parte 2 y firma", HOJA_ACUERDO_2), hoja(3, "Reglas de oro", HOJA_REGLAS), hoja(4, "Acuerdo de ayudante", HOJA_AYUDANTE)])
# Plantillas de la firma electrónica
PLANTILLAS = {
 "plomero": documento([hoja(1, "Acuerdo · parte 1", HOJA_ACUERDO_1), hoja(2, "Acuerdo · parte 2 y firma", HOJA_ACUERDO_2), hoja(3, "Reglas de oro", HOJA_REGLAS)]),
 "ayudante": documento([hoja(1, "Acuerdo de ayudante", HOJA_AYUDANTE), hoja(2, "Secciones que te aplican", HOJA_AYUDANTE_SECCIONES), hoja(3, "Reglas de oro", HOJA_REGLAS)]),
}

def precio(s):
    if s.get("cotizacion"): return "cotización"
    if s.get("rango"): return f"${s['rango'][0]:,}–${s['rango'][1]:,}"
    return f"${s['precio']}"
filas = "".join(f"<tr><td>{s['nombre']}</td><td class='num'>{precio(s)}</td></tr>" for s in MENU["servicios"] if s["nivel"] in ("P", "M"))

KIT = f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
{cab("Kit de bienvenida", "Bienvenido a Resuelto")}
<div class="caja"><h2>Tú haces la plomería. Nosotros hacemos el resto.</h2>
Nosotros conseguimos al cliente, le damos el precio antes de ir, lo agendamos y le cobramos. Tú llegas, haces el trabajo bien y <b>cobras los viernes</b>. Cualquier cosa, escríbenos al WhatsApp de Resuelto: <b>787-956-1111</b>.</div>

<h2>Tus primeros pasos (antes de tu primer trabajo)</h2>
<ul class="check">
<li>Acuerdo firmado y Reglas de Oro firmadas (Anexo A).</li>
<li>Foto de tu <b>licencia</b> y de tu <b>colegiación</b> (el ayudante: identificación con foto).</li>
<li>Foto de tu <b>identificación</b> con foto.</li>
<li><b>Certificado de antecedentes penales</b> (se saca en línea, gratis, en el portal de la Policía de Puerto Rico).</li>
<li>Tu <b>seguro de responsabilidad</b> (mínimo $300,000, con Resuelto como asegurado adicional): tienes <b>60 días</b> para entregarlo.</li>
<li>Cómo te pagamos: <b>ATH Móvil</b> o cuenta de banco (número de ruta y cuenta).</li>
<li>Tu seguro social o EIN para la declaración informativa.</li>
<li>Recibir tu <b>enlace de la app de Resuelto</b> e instalarla en el celular (te llegan los trabajos con aviso).</li>
</ul>

<h2>Cómo funciona un trabajo</h2>
<ol class="pasos">
<li><b>Te llega la oferta</b> a la app y por WhatsApp: qué es, dónde, la ventana y lo que te toca. <b>El primero que acepta se lo lleva</b> (en la app, o contestando "ACEPTO" con el número de la oferta).</li>
<li><b>30 minutos antes</b> avisas que vas de camino. Si te vas a atrasar, avisas antes de que empiece la ventana.</li>
<li><b>Llegas, te presentas</b> ("Soy ___, de Resuelto") y confirmas el trabajo y el precio. <b>Foto de antes.</b></li>
<li>Si el trabajo es distinto a lo cotizado, <b>no lo empiezas</b>: escribes a Resuelto y lo aprobamos con el cliente.</li>
<li>Haces el trabajo. <b>Foto de después y del recibo de materiales.</b> Dejas limpio.</li>
<li>El cliente <b>le paga a Resuelto</b> por el enlace de pago (ATH Móvil o tarjeta). Tú no cobras.</li>
<li>El <b>viernes</b> te llega tu pago con el estado de cuenta de la semana.</li>
</ol>

<div class="pag"></div>
{cab("Kit de bienvenida", "Cómo cobras")}
<div class="caja"><h2>Tu parte</h2>
<b>65% de la mano de obra</b> de cada trabajo cobrado · <b>materiales: 100% del costo + 10%</b> por manejo (con recibo y foto) · emergencias (+${MENU['recargo_emergencia']}): también 65% para ti · <b>pago todos los viernes</b> por ATH Móvil o transferencia.</div>
<p>Ejemplo: un reemplazo de bomba de cisterna de $249 de mano de obra → <b>$161.85</b> para ti, más el costo de la bomba si la compraste tú, más el 10% de ese costo.</p>

<h2>Lo que paga el cliente (mano de obra, precio fijo)</h2>
<p style="font-size:9pt">Más ${MENU['cargo_coordinacion']} de coordinación (de Resuelto) y los materiales. Los trabajos grandes (cisternas, calentadores solares, re-tuberías, remodelaciones) se cotizan en sitio y se firman antes de empezar.</p>
<table><tr><th>Servicio</th><th class="num">Mano de obra</th></tr>{filas}</table>

<h2>Garantía</h2>
<p>El cliente tiene <b>{MENU['garantia_meses']} meses de garantía</b> en la mano de obra. Si un trabajo tuyo falla, vuelves en <b>48 horas</b> sin costo; los materiales del re-trabajo los cubre Resuelto hasta $150.</p>

<div class="pag"></div>
{cab("Kit de bienvenida", "Las 10 reglas de oro")}
<ol class="pasos" style="font-size:12pt">
<li>El cliente es de Resuelto. Ni tarjeta, ni número, ni cotización por fuera.</li>
<li>Nunca cobras tú. Todo pago va a Resuelto.</li>
<li>Llegas en la ventana. Avisas 30 minutos antes.</li>
<li>Identificación de Resuelto, zapatones y te presentas.</li>
<li>Precio confirmado antes de tocar nada. Cambios, se aprueban primero.</li>
<li>Fotos de antes, después y recibo. Sin fotos no hay pago.</li>
<li>Dejas limpio.</li>
<li>Garantía de 12 meses: si falló, vuelves en 48 horas.</li>
<li>Calificación 4.8 mínimo. Tres faltas y sales.</li>
<li>Te pagamos los viernes, siempre.</li>
</ol>
<div class="caja" style="margin-top:22px"><h2>¿Dudas?</h2>WhatsApp de Resuelto: <b>787-956-1111</b> · resueltopr.com/plomeros</div>
<p class="pie">Resuelto Home Services LLC · Kit de bienvenida v1 · septiembre 2026</p>
</body></html>"""

DEST = AQUI / "../../agente/data/plantillas"
DEST.mkdir(parents=True, exist_ok=True)
import shutil
shutil.copyfile(AQUI / "../logo/logo-horizontal-blanco.png", DEST / "logo-blanco.png")  # membrete del PDF firmado
for tipo, html in PLANTILLAS.items():
    (DEST / f"contrato-{tipo}.html").write_text(html, encoding="utf-8"); print("✔ plantilla", tipo)

PIES = {"acuerdo-afiliacion-plomero": ("Acuerdo de afiliación de plomero · provisional · v1 sep 2026", True), "kit-bienvenida-plomero": ("Kit de bienvenida del plomero · v1 sep 2026", False)}
for nombre, html in (("acuerdo-afiliacion-plomero", ACUERDO), ("kit-bienvenida-plomero", KIT)):
    h = AQUI / f"{nombre}.html"; h.write_text(html, encoding="utf-8")
    pie, ini = PIES[nombre]
    subprocess.run(["node", str(AQUI / "render.mjs"), str(h), str(AQUI / (nombre + ".pdf")), pie] + (["--iniciales"] if ini else []), check=True)

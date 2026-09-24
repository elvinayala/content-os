# Genera "ISLA Cabo Rojo 5K — Gestiones y permisos" (PDF)
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, PageBreak, Flowable, KeepTogether, NextPageTemplate)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

SUP = "/System/Library/Fonts/Supplemental/"
pdfmetrics.registerFont(TTFont("Arial", SUP + "Arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", SUP + "Arial Bold.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Italic", SUP + "Arial Italic.ttf"))
pdfmetrics.registerFont(TTFont("DIN", SUP + "DIN Condensed Bold.ttf"))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold", italic="Arial-Italic", boldItalic="Arial-Bold")

INK = colors.HexColor("#111111")
MUTED = colors.HexColor("#5B5B5B")
ACCENT = colors.HexColor("#E0566F")      # rosado salina (Cabo Rojo)
ACCENT_SOFT = colors.HexColor("#FBE7EB")
LINE = colors.HexColor("#DADADA")
ZEBRA = colors.HexColor("#F6F6F6")
NEG = colors.HexColor("#B42318")
POS = colors.HexColor("#067647")

OUT = sys.argv[1]

s_body = ParagraphStyle("body", fontName="Arial", fontSize=9.5, leading=13.5, textColor=INK)
s_small = ParagraphStyle("small", parent=s_body, fontSize=8, leading=10.5)
s_small_b = ParagraphStyle("smallb", parent=s_small, fontName="Arial-Bold")
s_muted = ParagraphStyle("muted", parent=s_body, textColor=MUTED, fontSize=8.5, leading=12)
s_h1 = ParagraphStyle("h1", fontName="DIN", fontSize=30, leading=32, textColor=INK, spaceAfter=4)
s_h2 = ParagraphStyle("h2", fontName="DIN", fontSize=19, leading=22, textColor=INK, spaceBefore=10, spaceAfter=6)
s_h3 = ParagraphStyle("h3", fontName="Arial-Bold", fontSize=10.5, leading=14, textColor=INK, spaceBefore=6, spaceAfter=3)
s_kicker = ParagraphStyle("kicker", fontName="Arial-Bold", fontSize=8, leading=10, textColor=ACCENT)
s_bullet = ParagraphStyle("bullet", parent=s_body, leftIndent=12, bulletIndent=2, spaceAfter=2)
s_th = ParagraphStyle("th", fontName="Arial-Bold", fontSize=7.5, leading=9.5, textColor=colors.white)


class Check(Flowable):
    def __init__(self, size=8):
        super().__init__(); self.size = size
    def wrap(self, *a):
        return self.size, self.size
    def draw(self):
        self.canv.setStrokeColor(INK); self.canv.setLineWidth(0.7)
        self.canv.rect(0, 0, self.size, self.size)


class Rule(Flowable):
    def __init__(self, w, color=ACCENT, h=2.2):
        super().__init__(); self.w, self.color, self.h = w, color, h
    def wrap(self, *a):
        return self.w, self.h + 4
    def draw(self):
        self.canv.setFillColor(self.color); self.canv.rect(0, 2, self.w, self.h, stroke=0, fill=1)


W = letter[0] - 1.5 * inch


def P(t, st=s_small):
    return Paragraph(t, st)


def bullets(items):
    return [Paragraph(i, s_bullet, bulletText="•") for i in items]


def base_style(n_rows, header_bg=INK):
    st = [
        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    for r in range(1, n_rows):
        if r % 2 == 0:
            st.append(("BACKGROUND", (0, r), (-1, r), ZEBRA))
    return st


def checklist(code, title, rows, note=None):
    """rows: (qué, ante quién, fecha, costo, responsable)"""
    head = ["#", "Qué hay que solicitar / gestionar", "Ante quién · proveedor", "Fecha límite", "Costo est.", "Responsable", ""]
    data = [[P(h, s_th) for h in head]]
    for i, (que, quien, fecha, costo, resp) in enumerate(rows, 1):
        data.append([P(f"{code}{i}", s_small_b), P(que), P(quien), P(f"<b>{fecha}</b>"), P(costo), P(resp), Check()])
    cw = [0.36, 2.35, 1.5, 0.72, 0.72, 0.95, 0.4]
    t = Table(data, colWidths=[c * inch for c in cw], repeatRows=1)
    st = base_style(len(data))
    st += [("ALIGN", (6, 1), (6, -1), "CENTER"), ("VALIGN", (6, 1), (6, -1), "MIDDLE")]
    t.setStyle(TableStyle(st))
    out = [Paragraph(title, s_h2)]
    if note:
        out.append(Paragraph(note, s_muted)); out.append(Spacer(1, 4))
    out.append(t)
    return out


def simple_table(head, rows, cw, align_right_cols=(), bold_last=False, compact=False):
    data = [[P(h, s_th) for h in head]]
    for r in rows:
        data.append([c if isinstance(c, Flowable) else P(str(c)) for c in r])
    t = Table(data, colWidths=[c * inch for c in cw], repeatRows=1)
    st = base_style(len(data))
    for c in align_right_cols:
        st.append(("ALIGN", (c, 1), (c, -1), "RIGHT"))
    if compact:
        st += [("TOPPADDING", (0, 0), (-1, -1), 2.2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2)]
    if bold_last:
        st += [("BACKGROUND", (0, -1), (-1, -1), ACCENT_SOFT), ("LINEABOVE", (0, -1), (-1, -1), 1, INK)]
    t.setStyle(TableStyle(st))
    return t


def on_page(canv, doc):
    canv.saveState()
    canv.setFillColor(ACCENT); canv.rect(0.75 * inch, letter[1] - 0.52 * inch, 0.35 * inch, 3, stroke=0, fill=1)
    canv.setFont("DIN", 10); canv.setFillColor(INK)
    canv.drawString(1.18 * inch, letter[1] - 0.55 * inch, "ISLA RUN SERIES · CABO ROJO 5K")
    canv.setFont("Arial", 7.5); canv.setFillColor(MUTED)
    canv.drawRightString(letter[0] - 0.75 * inch, letter[1] - 0.55 * inch, "Gestiones y permisos · v1 · 23 sep 2026")
    canv.drawString(0.75 * inch, 0.5 * inch, "Estimados preliminares: confirmar costos con cotizaciones y plazos con cada agencia. No sustituye asesoría legal ni contable.")
    canv.drawRightString(letter[0] - 0.75 * inch, 0.5 * inch, f"{doc.page}")
    canv.restoreState()


def on_cover(canv, doc):
    canv.saveState()
    canv.setFillColor(INK); canv.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
    canv.setFillColor(ACCENT); canv.rect(0.75 * inch, 7.35 * inch, 1.1 * inch, 6, stroke=0, fill=1)
    canv.setFillColor(colors.white)
    canv.setFont("DIN", 92); canv.drawString(0.72 * inch, 5.95 * inch, "ISLA")
    canv.setFont("DIN", 30); canv.drawString(0.75 * inch, 5.45 * inch, "RUN SERIES")
    canv.setFillColor(ACCENT); canv.setFont("DIN", 40); canv.drawString(0.75 * inch, 4.55 * inch, "CABO ROJO 5K")
    canv.setFillColor(colors.white); canv.setFont("Arial-Bold", 15)
    canv.drawString(0.75 * inch, 3.95 * inch, "Gestiones, permisos y proveedores")
    canv.setFont("Arial", 11); canv.setFillColor(colors.HexColor("#BDBDBD"))
    canv.drawString(0.75 * inch, 3.65 * inch, "Todo lo que hay que solicitar y gestionar para salir el domingo 13 de diciembre de 2026.")
    canv.setFont("Arial", 9)
    y = 1.6 * inch
    for line in ["Preparado para Elvin Ayala y socios · 23 de septiembre de 2026 · v1",
                 "Fecha de carrera recomendada: domingo 13/dic/2026, salida 6:00 AM",
                 "Tope recomendado: 2,500 corredores · escenario base 1,800"]:
        canv.drawString(0.75 * inch, y, line); y -= 0.2 * inch
    canv.restoreState()


doc = BaseDocTemplate(OUT, pagesize=letter, leftMargin=0.75 * inch, rightMargin=0.75 * inch,
                      topMargin=0.85 * inch, bottomMargin=0.8 * inch,
                      title="ISLA Cabo Rojo 5K — Gestiones y permisos", author="ISLA Run Series")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
doc.addPageTemplates([PageTemplate(id="cover", frames=[frame], onPage=on_cover),
                      PageTemplate(id="body", frames=[frame], onPage=on_page)])

S = []
S.append(NextPageTemplate("body")); S.append(PageBreak())

# ---------- 1. Resumen ----------
S.append(Paragraph("RESUMEN", s_kicker))
S.append(Paragraph("Cómo usar este documento", s_h1)); S.append(Rule(0.6 * inch))
S += bullets([
    "Cada gestión tiene <b>fecha límite, costo estimado y responsable</b>. Marca la casilla cuando esté hecha <b>y</b> tengas el papel (permiso, contrato, recibo) guardado en la carpeta del evento.",
    "El <b>director de carrera</b> (uno de los socios) es el dueño de esta lista. Elvin solo aprueba: presupuesto &gt;$5K, precios, marca y compuertas.",
    "Claude y los agentes ponen la plataforma de inscripción, la landing, el contenido (Sofi/Lola), la pauta (Max, en pausa hasta que Elvin active) y el reporte semanal de inscritos.",
    "Los costos son <b>estimados</b> para presupuestar. Pide 3 cotizaciones por proveedor. Los plazos de agencias de gobierno cambian: confírmalos con cada una al radicar.",
])
S.append(Paragraph("Las 5 decisiones que destraban todo (esta semana)", s_h3))
S.append(simple_table(
    ["Decisión", "Recomendación", "Por qué"],
    [
        ["Fecha", "<b>Domingo 13/dic/2026, 6:00 AM</b>", "11 semanas: da tiempo a medallas custom (4–6 sem.) y a vender; esquiva Acción de Gracias."],
        ["Precios", "<b>$25 / $30 / $35 / $40</b> + cargo por servicio ~$2.50", "Con $20/25/30/35 el equilibrio está en ~2,650 corredores. Con estos, en ~2,000."],
        ["Tope", "<b>2,500</b> + lista de espera", "Un SOLD OUT construye marca; la base esperada es 1,800."],
        ["Ruta", "Salida y meta en el mismo punto; Boquerón o casco urbano", "Si toca carretera estatal suma DTOP + Policía de PR (más tiempo)."],
        ["Entidad", "LLC propia con los socios", "Cuentas, Stripe y data de corredores separadas de las agencias."],
    ], [0.9, 2.5, 3.6]))

S.append(Paragraph("Compuertas del piloto (dentro del plan de guerra Q4)", s_h3))
S.append(simple_table(
    ["Fecha", "Condición", "Si se cumple", "Si no"],
    [
        ["15/oct", "≥ 300 inscritos (Fundadores casi agotados)", "Se confirman proveedores y producción completa.", "Revisar precio/pauta/mensaje; bajar producción."],
        ["1/nov", "≥ 900 inscritos", "Orden de medallas (proyección +10 %).", "Formato lean: se recorta producción, se mantiene la experiencia base."],
        ["8/nov", "Tallas reales en el admin", "Orden de camisas (tallas + 10 %).", "Camisa garantizada solo a inscritos antes del 8/nov."],
        ["13/dic", "Carrera", "P&amp;L real → decisión ISLA #2 (¿Ponce, marzo?).", "—"],
    ], [0.6, 2.0, 2.3, 2.1]))

# ---------- 2. Municipio ----------
S.append(PageBreak())
S.append(Paragraph("MUNICIPIO DE CABO ROJO", s_kicker))
S.append(Paragraph("Qué pedirle al municipio (por escrito)", s_h1)); S.append(Rule(0.6 * inch))
S.append(Paragraph("El municipio ya está a bordo con ambulancias y policía. Cada cosa extra que aporte en especie es costo fijo que no pagas: "
                   "tarima, sonido, baños, limpieza y vallas valen <b>$5K–$8K</b>. Pídelo todo en <b>una sola carta</b> con la fecha, el horario, "
                   "el mapa de ruta y el estimado de asistencia, y consigue la respuesta firmada.", s_body))
S.append(Spacer(1, 6))
S.append(simple_table(
    ["", "Pedido al municipio", "Estado", "Valor aprox."],
    [
        [Check(), "<b>Policía Municipal</b> y control de tránsito en toda la ruta (confirmado)", "a bordo", "—"],
        [Check(), "<b>Ambulancias</b>: mínimo 2 (una en ruta, una en meta) (confirmado)", "a bordo", "—"],
        [Check(), "Permiso de uso de <b>plaza / malecón</b> y cierre de calles municipales (horario 3:30–10:30 AM)", "pedir", "—"],
        [Check(), "<b>Tarima + sonido</b> para salida, meta y premiación", "pedir", "$3,000"],
        [Check(), "<b>Baños portátiles</b> (~20 + 1 accesible) o acceso a baños públicos", "pedir", "$2,500"],
        [Check(), "<b>Vallas / barricadas</b> para corrales de salida y recta final", "pedir", "$1,000"],
        [Check(), "<b>Limpieza</b> y recogido de basura antes y después", "pedir", "$500"],
        [Check(), "Brigada de <b>Obras Públicas</b>: conos y cierre físico de calles", "pedir", "—"],
        [Check(), "<b>OMME</b> presente el día del evento y visto bueno del plan de emergencias", "pedir", "—"],
        [Check(), "Local para <b>recogido de paquetes</b> (11–12/dic): coliseo, centro comunal o similar", "pedir", "$750"],
        [Check(), "<b>Carta de endoso</b> del alcalde (sirve para auspiciadores y trámites estatales)", "pedir", "—"],
        [Check(), "Difusión en las redes del municipio y aviso a vecinos/comercios de la ruta", "pedir", "—"],
        [Check(), "Electricidad en salida/meta (o permiso para generador)", "pedir", "$400"],
    ], [0.3, 4.9, 0.8, 1.0], align_right_cols=(3,)))
S.append(Spacer(1, 6))
S.append(Paragraph("Consejo: ofrece a cambio la categoría <b>“Mejor caborrojeño/a”</b> en los premios, el logo del municipio en la camisa y el arco, y "
                   "un espacio en la villa. Eso le da al alcalde algo que mostrar.", s_muted))

# ---------- 3. Checklists ----------
S.append(PageBreak())
S.append(Paragraph("LISTA MAESTRA", s_kicker))
S.append(Paragraph("Todo lo que hay que solicitar y gestionar", s_h1)); S.append(Rule(0.6 * inch))
S.append(Paragraph("Ordenado por bloque. Las fechas son el <b>último día</b> aceptable; si se puede antes, mejor.", s_muted))

S += checklist("A", "A · Entidad, marca y cuentas", [
    ("<b>Acuerdo de socios</b> por escrito: % de participación, quién pone caja, quién decide, qué pasa si hay pérdida, quién es el director de carrera", "Abogado", "30/sep", "$500–1,500", "Elvin + socios"),
    ("Constituir la <b>LLC</b> (ej. ISLA Run Series LLC) + agente residente", "Departamento de Estado de PR (registro de corporaciones en línea)", "3/oct", "~$250 + agente", "Socio / abogado"),
    ("<b>EIN</b> (número patronal federal)", "IRS (en línea)", "3/oct", "$0", "Socio / contador"),
    ("<b>Registro de Comerciante</b> e IVU", "Hacienda (SURI)", "7/oct", "$0", "Contador"),
    ("<b>Patente municipal</b> de la LLC", "Municipio sede de la LLC", "según municipio", "según volumen", "Contador"),
    ("<b>Cuenta de banco</b> comercial de la LLC", "Banco", "7/oct", "$0", "Socio"),
    ("<b>Stripe</b> de ISLA (no el de las agencias): tarjeta, Apple Pay, Google Pay", "Stripe", "5/oct", "2.9% + $0.30 (lo paga el corredor)", "Elvin (datos bancarios)"),
    ("<b>ATH Móvil Business</b> con acceso al botón de pago / API", "ATH Móvil (Evertec)", "15/oct", "según tarifa", "Socio"),
    ("<b>Registro de marca</b> “ISLA Run Series” + logo (PR ahora, USPTO después). Antes: búsqueda de conflictos", "Depto. de Estado PR (Registro de Marcas) · USPTO", "15/oct", "tarifa vigente + abogado", "Abogado"),
    ("<b>Dominio</b> + correo (ej. islarun.pr / islarunseries.com)", "Registrador de dominios", "26/sep", "~$50/año", "Claude"),
    ("<b>Redes</b>: @islarunseries en IG, TikTok, FB (verificar disponibilidad)", "—", "27/sep", "$0", "Claude / Sofi"),
    ("<b>Meta Business</b> + cuenta de anuncios + pixel propios de ISLA", "Meta", "5/oct", "$0", "Elvin"),
])

S += checklist("B", "B · Permisos y autoridades", [
    ("<b>Solicitud formal del evento</b>: carta con fecha, horario, ruta + mapa, asistencia estimada, plan de seguridad y lista de pedidos (ver página del municipio)", "Alcaldía de Cabo Rojo (Oficina de Permisos / Recreación y Deportes)", "2/oct", "—", "Director de carrera"),
    ("<b>Cierre de calles municipales</b> y plan de tránsito", "Policía Municipal de Cabo Rojo", "15/oct", "—", "Director de carrera"),
    ("<b>Si la ruta usa carretera estatal</b> (ej. PR-100/101/307): permiso de uso y cierre de la vía", "DTOP (oficina regional de Mayagüez)", "20/oct", "consultar", "Director de carrera"),
    ("<b>Policía de PR</b> para tránsito en vías estatales", "Comandancia de Mayagüez / distrito de Cabo Rojo", "20/oct", "consultar", "Director de carrera"),
    ("<b>Plan de emergencias</b> aprobado (rutas de ambulancia, puesto médico, evacuación, clima)", "OMME Cabo Rojo (+ NMEAD si lo piden)", "15/nov", "—", "Director de carrera"),
    ("<b>Inspección de Bomberos</b> si hay tarima, carpas grandes, generador o cocina", "Negociado del Cuerpo de Bomberos", "20/nov", "consultar", "Director de carrera"),
    ("<b>Uso de playa / balneario / zona costera</b> si la ruta o la villa lo tocan (Boquerón)", "DRNA / Programa de Parques Nacionales", "20/oct", "consultar", "Director de carrera"),
    ("<b>Licencias sanitarias</b> de food trucks y vendedores (cada uno trae la suya; pedir copia)", "Departamento de Salud", "1/dic", "lo paga el vendedor", "Director de carrera"),
    ("<b>Drone</b>: piloto con licencia FAA Part 107 + autorización de espacio aéreo si aplica", "Proveedor de video / FAA", "1/dic", "incluido en video", "Proveedor"),
    ("<i>Opcional premium:</i> <b>sanción</b> de la Federación de Atletismo de PR", "FAPUR", "20/oct", "consultar", "Socio"),
    ("<i>Opcional premium:</i> <b>medición certificada</b> de la ruta (5K exactos)", "Medidor certificado", "15/nov", "$500–1,000", "Socio"),
], note="Radica todo lo estatal a más tardar el 20/oct. Si el municipio te ayuda a gestionarlo, mejor, pero guarda copia de cada aprobación.")

S += checklist("C", "C · Seguridad, salud y seguro", [
    ("<b>Seguro de responsabilidad pública</b> del evento (ej. $1M por ocurrencia) con el municipio como <b>asegurado adicional</b>; certificado en mano", "Corredor de seguros", "cotizar 7/oct · emitido 15/nov", "$1,500–2,500", "Socio"),
    ("<b>Ambulancias</b> confirmadas por escrito (mín. 2)", "Municipio", "1/nov", "a bordo", "Director de carrera"),
    ("<b>Puesto médico</b> en meta: paramédicos o enfermería, camillas, hielo, sombra", "Proveedor médico / municipio", "15/nov", "$400–800", "Director de carrera"),
    ("<b>Desfibriladores (DEA)</b>: uno en meta y uno a mitad de ruta, con persona entrenada", "Proveedor médico / municipio", "15/nov", "incluido", "Director de carrera"),
    ("<b>Plan de calor, lluvia y cancelación</b>: quién decide, a qué hora, cómo se avisa (email/WhatsApp/redes)", "Interno", "15/nov", "$0", "Director + Claude"),
    ("<b>Estaciones de agua</b>: km 2.5 + meta como mínimo (mesas, vasos, zafacones, voluntarios)", "Interno + auspiciador", "1/dic", "en presupuesto", "Director de carrera"),
    ("<b>Premios en efectivo</b>: pagar por transferencia o cheque, no efectivo en sitio; seguridad para la villa", "Interno", "6/dic", "$0", "Socio"),
])

S += checklist("D", "D · Legal y fiscal", [
    ("<b>Relevo de responsabilidad</b> digital (incluye menores con firma del tutor y uso de imagen)", "Abogado", "5/oct (antes de abrir)", "$300–800", "Abogado"),
    ("<b>Términos de inscripción</b>: no reembolsable, transferencia (fecha límite y fee), cambio de talla, cancelación por fuerza mayor", "Abogado", "5/oct", "incluido", "Abogado"),
    ("<b>Política de privacidad</b> y consentimiento de marketing (email/WhatsApp)", "Abogado", "5/oct", "incluido", "Abogado"),
    ("<b>Consulta fiscal</b>: ¿IVU en inscripciones y mercancía?; cómo reportar premios en efectivo (formularios 480.6 / W-9 de ganadores); auspicios en especie", "Contador", "10/oct", "$200–400", "Contador"),
    ("<b>Contrato modelo de auspicio</b>: entregables, fecha de logos (30/oct), pagos, exclusividad por categoría", "Abogado", "10/oct", "incluido", "Abogado"),
    ("<b>Contratos con proveedores</b> clave (timing, camisas, medallas) con fecha de entrega por escrito", "Cada proveedor", "al ordenar", "—", "Socio"),
    ("<b>Datos fiscales de ganadores</b> (ID + formulario) antes de pagar premios", "Ganadores", "13–20/dic", "—", "Socio"),
])

S += checklist("E", "E · Proveedores (3 cotizaciones cada uno)", [
    ("<b>Timing</b>: bib con chip desechable, alfombras de salida y meta, resultados en vivo. <b>Pedir su formato CSV</b> para importar inscritos", "Compañía de cronometraje", "cotizar 30/sep · contrato 15/oct", "~$3.50 / corredor", "Socio"),
    ("<b>Medallas custom</b> (pieza del mapa de PR) con cinta impresa. Exigir entrega ≤30 días por escrito; si no, ordenar el 26/oct", "Fabricante de medallas", "diseño 20/oct · orden 1/nov", "~$4.00 c/u", "Socio + Claude (diseño)"),
    ("<b>Camisas técnicas sublimadas</b> (unisex XS–XXL + corte de dama)", "Imprenta / sublimación", "diseño 30/oct · orden 8/nov", "~$6.50 c/u", "Socio + Claude (diseño)"),
    ("<b>Arco inflable</b> de salida/meta con marca + backdrop de premiación + banners", "Proveedor de branding", "15/nov", "~$4,000", "Socio"),
    ("<b>Tarima, sonido, DJ y animador</b> (si el municipio no los pone)", "Productor / DJ", "15/nov", "~$3,000", "Socio"),
    ("<b>Baños portátiles</b> (si el municipio no los pone)", "Proveedor de baños", "15/nov", "~$2,500", "Socio"),
    ("<b>Carpas, mesas, sillas, vallas, conos, cinta y marcadores de km</b>", "Alquiler de equipo", "15/nov", "~$2,000", "Socio"),
    ("<b>Foto y video</b>: 3–4 fotógrafos (ruta, meta, podio), 1 videógrafo, drone; material en 48 h", "Fotógrafos / productora", "1/nov", "~$3,000", "Socio + Sofi"),
    ("<b>Agua, hielo, frutas, vasos</b> (ideal: auspiciador de hidratación)", "Auspiciador / suplidor", "1/dic", "~$0.75 / corredor", "Socio"),
    ("<b>Bolsas e insertos</b> de auspiciadores", "Auspiciadores", "1/dic", "~$0.25 / corredor", "Socio"),
    ("<b>Radios</b> para staff y <b>generador</b> (si no hay corriente)", "Alquiler", "1/dic", "~$400", "Socio"),
])

S += checklist("F", "F · Operación del evento", [
    ("Designar al <b>director de carrera</b> (una sola persona responsable el día)", "Socios", "30/sep", "—", "Socios"),
    ("<b>Ruta final</b>: mapa, km, estaciones de agua, corrales por ritmo, zona de meta, villa", "Con el municipio", "15/oct", "—", "Director de carrera"),
    ("<b>Recogido de paquetes</b>: lugar, horario (11–12/dic), check-in con QR desde la plataforma", "Municipio + Claude", "1/nov", "—", "Director + Claude"),
    ("<b>Voluntarios</b>: 70–85 (clubes, escuelas, iglesias; horas comunitarias), camisa de staff y comida", "Comunidad", "15/nov", "~$1,500", "Director de carrera"),
    ("<b>Estacionamiento y shuttle</b> (si hace falta)", "Municipio / transporte", "15/nov", "consultar", "Director de carrera"),
    ("<b>Aviso a vecinos y comercios</b> de la ruta (volante + redes del municipio)", "Municipio", "1/dic", "~$100", "Director + Sofi"),
    ("<b>Layout de la villa</b> de auspiciadores (carpas, DJ, premiación, puesto médico)", "Interno", "1/dic", "—", "Director de carrera"),
    ("<b>Guion minuto a minuto</b> del día (3:30 montaje · 5:30 corrales · 6:00 salida · 7:30 premiación · 10:00 desmontaje)", "Interno", "6/dic", "—", "Director de carrera"),
    ("<b>Premiación</b>: lista de categorías, podio, backdrop, transferencias listas", "Interno + timing", "6/dic", "$5,000 premios", "Socio"),
    ("<b>Plan de contenido del día</b>: quién graba qué, piezas para 24 h y 7 días después", "Sofi / Lola", "6/dic", "—", "Claude + agentes"),
    ("<b>Exportar inscritos</b> al timing con bibs asignados", "Plataforma → timing", "9/dic", "—", "Claude"),
])

# ---------- 4. Cronograma ----------
S.append(PageBreak())
S.append(Paragraph("CRONOGRAMA", s_kicker))
S.append(Paragraph("De hoy al 13 de diciembre", s_h1)); S.append(Rule(0.6 * inch))
S.append(simple_table(
    ["Cuándo", "Qué pasa", "Quién"],
    [
        ["<b>23–30 sep</b>", "Acuerdo de socios · director de carrera · fecha y ruta tentativa con el municipio · pedir cotizaciones (timing, medallas, camisas, seguro) · dominio y redes · identidad de marca", "Socios · Claude"],
        ["<b>1–7 oct</b>", "Carta al municipio · LLC + EIN + banco + Stripe · relevo y términos (abogado) · deck de auspicios enviado · sesión de foto/video en Cabo Rojo · plataforma lista en modo prueba", "Socios · abogado · Claude"],
        ["<b>8 oct</b>", "<b>ABREN INSCRIPCIONES</b> · Fundadores (500 a $25, bib #0001–0500)", "Todos"],
        ["<b>8–31 oct</b>", "Pauta (Max) · clubes de corredores · influencers con código · cierre del auspiciador presentador · radicar lo estatal (20/oct)", "Max · Sofi · socios"],
        ["<b>15 oct</b>", "Compuerta 1: ≥ 300 inscritos · contrato de timing firmado · ATH Móvil activo", "Elvin aprueba"],
        ["<b>20–30 oct</b>", "Diseño final de medalla (20/oct) y camisa · <b>logos de auspiciadores cerrados (30/oct)</b>", "Claude · socios"],
        ["<b>1 nov</b>", "Compuerta 2: ≥ 900 inscritos → <b>orden de medallas</b>", "Elvin aprueba"],
        ["<b>8 nov</b>", "<b>Orden de camisas</b> con tallas reales + 10 %", "Socio"],
        ["<b>15–20 nov</b>", "Seguro emitido · permisos aprobados en mano · plan de emergencias · proveedores reservados · voluntarios reclutados", "Director de carrera"],
        ["<b>1 dic</b>", "Llegan medallas y camisas (revisar conteo y tallas) · cierre de transferencias · aviso a vecinos", "Socio"],
        ["<b>6 dic</b>", "Armado de paquetes · guion del día · lista de premiación", "Director · voluntarios"],
        ["<b>9 dic</b>", "Cierre de inscripciones online (o SOLD OUT antes) · exportar al timing", "Claude"],
        ["<b>11–12 dic</b>", "Recogido de paquetes con QR · montaje el 12 por la tarde · reunión de voluntarios y recorrido de ruta", "Director · voluntarios"],
        ["<b>13 dic</b>", "<b>CARRERA · 6:00 AM</b>", "Todos"],
        ["<b>14–20 dic</b>", "Resultados y fotos por bib · pago de premios (con datos fiscales) · encuesta · P&amp;L real · anuncio y preventa de ISLA #2 para inscritos", "Socios · Claude"],
    ], [0.85, 4.95, 1.2]))

# ---------- 5. Presupuesto ----------
S.append(PageBreak())
S.append(Paragraph("NÚMEROS", s_kicker))
S.append(Paragraph("Presupuesto por partida", s_h1)); S.append(Rule(0.6 * inch))
S.append(Paragraph("Estimados para planificar; se reemplazan con las cotizaciones. Ambulancias y policía los pone el municipio.", s_muted))
S.append(Paragraph("Costo variable (por corredor)", s_h3))
S.append(simple_table(["Partida", "Costo"], [
    ["Camisa técnica sublimada", "$6.50"], ["Medalla custom con cinta", "$4.00"],
    ["Bib + chip + servicio de timing", "$3.50"], ["Agua, hielo, fruta", "$0.75"], ["Bolsa e insertos", "$0.25"],
    ["<b>Total por corredor</b>", "<b>$15.00</b>"],
], [5.8, 1.2], align_right_cols=(1,), bold_last=True, compact=True))
S.append(Paragraph("Costo fijo", s_h3))
S.append(simple_table(["Partida", "Costo", "¿Lo puede poner el municipio?"], [
    ["Premios en efectivo", "$5,000", "—"], ["Publicidad (Meta)", "$8,000", "—"],
    ["Arco inflable, backdrops, banners, vallas con marca", "$4,000", "vallas sí"],
    ["Tarima, sonido, DJ, animador", "$3,000", "<b>sí</b>"], ["Foto, video, drone", "$3,000", "—"],
    ["Baños portátiles", "$2,500", "<b>sí</b>"], ["Seguro de responsabilidad", "$2,000", "—"],
    ["Carpas, mesas, conos, señalización de km", "$2,000", "parcial"],
    ["Staff y voluntarios (camisas, comida)", "$1,500", "—"], ["Recogido de paquetes (local, logística)", "$750", "<b>sí</b>"],
    ["Legal, contador, permisos", "$1,000", "—"], ["Limpieza", "$500", "<b>sí</b>"],
    ["Plataforma, dominio, email", "$300", "—"], ["Contingencia (10 %)", "$3,350", "—"],
    ["<b>Total fijo</b>", "<b>$36,900</b>", "<b>ahorro posible $5–8K</b>"],
], [4.3, 1.0, 1.7], align_right_cols=(1,), bold_last=True, compact=True))

S.append(Paragraph("Escenarios (con $7K de auspicios en efectivo)", s_h3))


def money(v):
    c = POS if v > 0 else (NEG if v < 0 else INK)
    sign = "+" if v > 0 else ("−" if v < 0 else "")
    return Paragraph(f'<font color="{c.hexval().replace("0x", "#")}"><b>{sign}${abs(v):,.0f}</b></font>', s_small)


rows = []
for n, ingA, resA, ingB, resB in [
    (1500, 35000, -17400, 42500, -9900), (2000, 50000, -9900, 60000, 100),
    (2500, 65000, -2400, 77500, 10100), (3000, 82500, 7600, 97500, 22600)]:
    rows.append([f"<b>{n:,}</b>", f"${ingA:,}", money(resA), f"${ingB:,}", money(resB), money(resB + 7000)])
S.append(simple_table(
    ["Corredores", "Ingreso $20/25/30/35", "Resultado", "Ingreso $25/30/35/40", "Resultado", "+ municipio en especie (−$7K)"],
    rows, [0.9, 1.25, 1.0, 1.25, 1.0, 1.6], align_right_cols=(1, 2, 3, 4, 5)))
S.append(Spacer(1, 4))
S.append(Paragraph("Escalones de 500 / 1,000 / 1,000 / 500. El cargo por servicio (~$2.50) cubre el procesamiento de pago y no cuenta como ingreso. "
                   "Extras opcionales (visera, paquete de fotos, VIP) pueden sumar ~$3 por corredor.", s_muted))

# ---------- 6. Auspicios y premios ----------
S.append(PageBreak())
S.append(Paragraph("AUSPICIOS Y PREMIOS", s_kicker))
S.append(Paragraph("Escalones de auspicio (meta: $15–20K)", s_h1)); S.append(Rule(0.6 * inch))
S.append(simple_table(["Escalón", "Cupos", "Precio", "Qué recibe"], [
    ["<b>Presentador</b>", "1", "$7,500–10,000", "“ISLA Cabo Rojo 5K presentado por…”, arco, frente de camisa, cinta de la medalla, menciones en tarima, contenido dedicado"],
    ["<b>Oficial</b>", "3", "$2,500", "Espalda de camisa, carpa en la villa, activación, 2 piezas de contenido"],
    ["<b>Hidratación / recuperación</b>", "2", "$1,000 + producto", "Estaciones de agua y meta con su marca"],
    ["<b>Local</b>", "10", "$500", "Logo pequeño en la espalda de la camisa + mesa en la villa"],
], [1.5, 0.5, 1.1, 3.9]))
S.append(Spacer(1, 4))
S.append(Paragraph("Prospectos: clientes de Level Up (ej. <b>Tinos</b>, en Cabo Rojo), comercios de Boquerón, marcas de bebidas y tiendas de running. "
                   "<b>Fecha límite de logos para la camisa: 30/oct.</b>", s_muted))

S.append(Paragraph("Premios: $5,000 repartidos", s_h2))
S.append(simple_table(["Categoría", "Premio", "Total"], [
    ["General masculino y femenino, 1.º / 2.º / 3.º", "$800 / $400 / $200 por género", "$2,800"],
    ["Master 40+ (M y F)", "$300 c/u", "$600"],
    ["Mejor caborrojeño y caborrojeña", "$200 c/u", "$400"],
    ["Club con más inscritos", "$500", "$500"],
    ["Categoría adaptada (M y F)", "$200 c/u", "$400"],
    ["Sorteo entre todos los que terminan", "$300", "$300"],
    ["<b>Total</b>", "", "<b>$5,000</b>"],
], [3.6, 2.4, 1.0], align_right_cols=(2,), bold_last=True))
S.append(Spacer(1, 4))
S.append(Paragraph("Grupos de edad (14–19, 20–29 … 60+): medallas o trofeos y producto de auspiciadores, no efectivo. "
                   "Así el corredor recreativo también siente que hay algo para él, y el premio de club empuja inscripciones en bloque.", s_muted))

S.append(Paragraph("Esta semana: las 7 primeras", s_h2))
for i, t in enumerate([
    "Firmar el acuerdo de socios y nombrar al director de carrera.",
    "Confirmar la fecha (13/dic) y la ruta tentativa con el municipio; mandar la carta con todos los pedidos.",
    "Pedir 3 cotizaciones: timing, medallas, camisas y seguro.",
    "Arrancar la LLC, el EIN y la cuenta de banco; abrir Stripe de ISLA.",
    "Mandarle al abogado el relevo, los términos y la privacidad (hay que tenerlos antes del 8/oct).",
    "Aprobar precios ($25/30/35/40 + cargo) y el tope de 2,500.",
    "Aprobar la identidad (logo ISLA, color de Cabo Rojo, concepto de medalla-mapa) para abrir el 8/oct.",
], 1):
    S.append(Paragraph(f"<b>{i}.</b> {t}", s_bullet))

doc.build(S)
print("ok", OUT)

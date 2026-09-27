#!/usr/bin/env python3
# Logo de AI Borinquen v2 (rebranding 27/sep/2026) — el coquí de circuitos, recreado en vector.
# Parte del logo de siempre (ref-logo-actual.png): coquí sentado de perfil, cuerpo verde arriba y
# azul abajo, trazos de circuito con nodos, puntos rojos, "PR" en el pecho, ondas de voz.
# Todo se dibuja en capas con ids (para animarlo en motion/) y los cortes blancos son MÁSCARA
# (transparentes): el logo funciona sobre fondo claro u oscuro.
#   python3 logo-generador.py            → 01-logo/*.svg
import os, sys

VERDE = "#3C9A3F"
AZUL = "#1E6FD0"
ROJO = "#E63946"
CORTE = 11  # grosor de los cortes (px en el viewBox 740×754)

# ── Formas ──────────────────────────────────────────────────────────────────
CUERPO = ("M735 150 C730 115 700 92 650 80 C600 70 540 72 490 95 C430 122 370 165 310 200 "
          "C230 245 140 272 80 300 C40 320 14 360 14 410 C14 460 44 490 100 494 "
          "C190 500 300 490 380 470 C430 458 460 430 480 390 C510 330 600 270 700 222 "
          "C730 205 742 180 735 150 Z")
# Todo lo que está por debajo de esta curva es azul (garganta, pecho, panza).
LIMITE_AZUL = ("M760 186 C680 200 590 212 510 232 C430 252 350 272 280 302 C200 336 110 380 0 400 "
               "L0 760 L760 760 Z")
MUSLO = ("M48 516 C80 488 170 482 250 492 C312 502 348 536 338 578 C328 618 282 644 212 650 "
         "C132 656 58 634 38 598 C26 572 30 538 48 516 Z")
BRAZO = "M470 360 C500 400 505 470 492 548"
MANO_VERDE_DEDOS = [("M530 576 L585 548", (598, 544)), ("M530 580 L640 574", (656, 574)), ("M530 584 L598 612", (610, 620))]
MANO_AZUL_DEDOS = [("M510 440 L610 428", (626, 426)), ("M510 446 L666 462", (682, 464)), ("M510 452 L620 498", (634, 504))]
PIE_DEDOS = [("M200 684 L330 652", (346, 648)), ("M200 690 L372 696", (390, 698)), ("M200 696 L320 732", (334, 738))]
OJO = (556, 140, 38)
FOSA = (684, 146, 10)
BOCA = "M738 178 C690 196 620 220 560 246"
# cortes que segmentan el lomo (como el logo original)
LOMO = [
    "M470 142 C420 172 375 202 330 228",
    "M300 246 C250 276 200 300 150 322",
    "M118 336 C90 350 66 366 52 384",
    "M110 452 C170 440 240 432 300 420",
]
# circuitos (cortes) con sus nodos (anillos) y los puntos rojos
CIRCUITOS = [
    "M522 170 C500 185 470 196 452 214 L430 262 L372 282",
    "M640 186 C600 204 560 222 520 238 L482 246",
    "M482 246 L452 300 L420 330",
    "M190 394 L226 392",
]
NODOS = [(482, 246, 13), (190, 394, 13), (372, 282, 11)]
ROJOS = [(346, 238, 16), (410, 336, 14), (382, 356, 6)]
# "PR" en el pecho (trazos de corte)
PR = [
    "M262 420 L278 352 L292 352 C326 352 328 390 284 390",  # P
    "M318 420 L334 352 L348 352 C382 352 384 390 340 390 L360 420",  # R
]
# ondas de voz arriba a la derecha + ecualizador sobre el lomo
ONDAS = [
    ("M548 32 C580 14 620 14 650 30", 0),
    ("M538 50 C576 30 624 30 660 50", 1),
    ("M556 66 C584 52 616 52 642 66", 2),
]
ONDAS_BOCA = ["M676 262 C700 272 712 292 708 318", "M696 250 C724 262 740 290 734 324"]
ECUALIZADOR = [(358, 130, 60), (378, 108, 90), (398, 120, 70), (418, 96, 100), (438, 112, 70), (300, 172, 40), (320, 160, 50), (340, 150, 55)]


def svg(uid="aib", verde=VERDE, azul=AZUL, rojo=ROJO, fondo=None, mono=None, size=740):
    if mono:
        verde = azul = rojo = mono
    c = []
    c.append(f'<svg viewBox="0 0 740 754" width="{size}" height="{size * 754 / 740:.0f}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AI Borinquen">')
    c.append("<defs>")
    c.append(f'<clipPath id="{uid}-cuerpo"><path d="{CUERPO}"/></clipPath>')
    # máscara: blanco = se ve, negro = corte
    corte = lambda d, w=CORTE: f'<path d="{d}" fill="none" stroke="#000" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
    m = [f'<mask id="{uid}-cortes" maskUnits="userSpaceOnUse" x="-20" y="-20" width="800" height="800">',
         '<rect x="-20" y="-20" width="800" height="800" fill="#fff"/>']
    m += [corte(d) for d in LOMO + CIRCUITOS + PR]
    m.append(corte(BOCA, 9))
    m += [f'<circle cx="{x}" cy="{y}" r="{r}" fill="#000"/>' for x, y, r in NODOS]
    m.append(f'<circle cx="{OJO[0]}" cy="{OJO[1]}" r="{OJO[2] + 12}" fill="#000"/>')
    m.append(f'<circle cx="{FOSA[0]}" cy="{FOSA[1]}" r="{FOSA[2]}" fill="#000"/>')
    # separación muslo / cuerpo y brazo / cuerpo
    m.append(f'<path d="{MUSLO}" fill="none" stroke="#000" stroke-width="{CORTE * 2}"/>')
    m.append(f'<path d="{BRAZO}" fill="none" stroke="#000" stroke-width="{58 + CORTE * 2}" stroke-linecap="round"/>')
    m.append(f'<circle cx="416" cy="462" r="{34 + CORTE}" fill="#000"/>')
    m.append("</mask>")
    # cortes del muslo (la rodilla, como el original)
    m.append(f'<mask id="{uid}-muslo" maskUnits="userSpaceOnUse" x="-20" y="-20" width="800" height="800">'
             '<rect x="-20" y="-20" width="800" height="800" fill="#fff"/>'
             + corte("M84 566 C140 534 236 530 304 556") + corte("M118 604 C170 590 230 590 270 604", 9) + "</mask>")
    m.append("</defs>")
    c += m
    if fondo:
        c.append(f'<rect width="740" height="754" fill="{fondo}"/>')

    # Cuerpo (verde arriba, azul abajo) con cortes
    c.append(f'<g id="cuerpo" mask="url(#{uid}-cortes)">')
    c.append(f'<path d="{CUERPO}" fill="{verde}"/>')
    c.append(f'<path d="{LIMITE_AZUL}" fill="{azul}" clip-path="url(#{uid}-cuerpo)"/>')
    c.append(f'<circle cx="40" cy="418" r="38" fill="{azul}"/>')  # rabadilla
    c.append("</g>")
    # Anillos de los nodos
    c.append('<g id="nodos">' + "".join(f'<circle cx="{x}" cy="{y}" r="{r - 5}" fill="none" stroke="{verde if y < 300 else azul}" stroke-width="5"/>' for x, y, r in NODOS) + "</g>")
    # Ojo
    c.append(f'<g id="ojo"><circle cx="{OJO[0]}" cy="{OJO[1]}" r="{OJO[2]}" fill="{azul}"/>'
             f'<circle cx="{OJO[0] + 12}" cy="{OJO[1] - 12}" r="10" fill="#fff"/></g>')
    # Muslo (verde) y pie (azul)
    c.append(f'<g id="pata-trasera"><path d="{MUSLO}" fill="{verde}" mask="url(#{uid}-muslo)"/>')
    c.append(f'<path d="M150 690 C160 660 200 662 230 676" fill="none" stroke="{azul}" stroke-width="44" stroke-linecap="round"/>')
    for d, (x, y) in PIE_DEDOS:
        c.append(f'<path d="{d}" fill="none" stroke="{azul}" stroke-width="18" stroke-linecap="round"/><circle cx="{x}" cy="{y}" r="17" fill="{azul}"/>')
    c.append("</g>")
    # Brazo y manos
    c.append(f'<g id="brazo"><path d="{BRAZO}" fill="none" stroke="{verde}" stroke-width="58" stroke-linecap="round"/>')
    c.append(f'<circle cx="416" cy="462" r="34" fill="{azul}"/>')
    for d, (x, y) in MANO_AZUL_DEDOS:
        c.append(f'<path d="{d}" fill="none" stroke="{azul}" stroke-width="18" stroke-linecap="round"/><circle cx="{x}" cy="{y}" r="17" fill="{azul}"/>')
    for d, (x, y) in MANO_VERDE_DEDOS:
        c.append(f'<path d="{d}" fill="none" stroke="{verde}" stroke-width="18" stroke-linecap="round"/><circle cx="{x}" cy="{y}" r="16" fill="{verde}"/>')
    c.append("</g>")
    # Puntos rojos (la "chispa" de la IA)
    c.append('<g id="rojos">' + "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{rojo}"/>' for x, y, r in ROJOS) + "</g>")
    # Voz: ondas y ecualizador
    c.append('<g id="ondas">')
    for d, i in ONDAS:
        c.append(f'<path d="{d}" fill="none" stroke="{azul}" stroke-width="7" stroke-linecap="round" opacity="{1 - i * 0.2:.1f}"/>')
    c.append(f'<circle cx="668" cy="50" r="7" fill="{rojo}"/>')
    for d in ONDAS_BOCA:
        c.append(f'<path d="{d}" fill="none" stroke="{azul}" stroke-width="7" stroke-linecap="round"/>')
    c.append("</g>")
    c.append('<g id="ecualizador">')
    for x, y, h in ECUALIZADOR:
        c.append(f'<path d="M{x} {y} L{x} {y - h * 0.5}" fill="none" stroke="{azul}" stroke-width="7" stroke-linecap="round"/>')
    c.append(f'<circle cx="300" cy="150" r="6" fill="{rojo}"/><circle cx="460" cy="60" r="6" fill="{rojo}"/>')
    c.append("</g>")
    c.append("</svg>")
    return "\n".join(c)


if __name__ == "__main__":
    base = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(base, "01-logo")
    os.makedirs(out, exist_ok=True)
    piezas = {
        "logo-color.svg": svg(),
        "logo-color-fondo-oscuro.svg": svg(uid="o", fondo="#050E0A"),
        "logo-una-tinta-blanco.svg": svg(uid="b", mono="#E8F3EC"),
        "logo-una-tinta-negro.svg": svg(uid="n", mono="#050E0A"),
        "logo-una-tinta-verde.svg": svg(uid="v", mono="#2BFF88"),
    }
    for n, s in piezas.items():
        open(os.path.join(out, n), "w").write(s)
    print("\n".join(piezas))

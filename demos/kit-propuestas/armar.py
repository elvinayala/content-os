#!/usr/bin/env python3
"""Arma una propuesta animada (HTML de un solo archivo) desde un JSON de datos del cliente.

Uso:  python3 armar.py datos.json [salida.html]

- El HTML sale autocontenido: logos y fotos van embebidos, así se abre en cualquier lado o se publica tal cual.
- Los videos de testimonios se cargan desde su link público (testimonios.json).
- Marca: "level-up" (negro + amarillo) o "ai-borinquen" (verde-negro + neón).
- Textos: *palabra* = color de la marca · **palabra** = color del cliente. Cada sección es opcional salvo portada y cierre.
"""
import base64, html, json, mimetypes, pathlib, re, sys

AQUI = pathlib.Path(__file__).parent
e = html.escape

MARCAS = {
    "level-up": {
        "nombre": "Level Up Media", "logo": "marca/lu-logo.png",
        "css": "",  # la base ya es Level Up
        "fuentes": "family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500",
    },
    "ai-borinquen": {
        "nombre": "AI Borinquen", "logo": "marca/aib-logo.png",
        "css": """:root { --fondo: #06110b; --superficie: #0c1c13; --superficie2: #11261a; --borde: #1f3a2a; --texto: #eef6f0; --gris: #9fb3a6; --gris2: #6e8577;
  --oro: #2bff88; --oro2: #8dffbf; --oro-rgb: 43,255,136; --sora: "Outfit", "Helvetica Neue", Arial, sans-serif; }""",
        "fuentes": "family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500",
    },
}

CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
PLAY = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#f5f1e8"/></svg>'


def txt(s):
    """Escapa y aplica *marca* / **cliente**; \\n = salto de línea."""
    s = e(s or "")
    s = re.sub(r"\*\*(.+?)\*\*", r'<span class="bronce">\1</span>', s)
    s = re.sub(r"\*(.+?)\*", r'<span class="oro">\1</span>', s)
    return s.replace("\n", "<br>")


def embeber(ruta, base):
    """Ruta local → data URI (para que el HTML sea un solo archivo). Los links https se dejan igual."""
    if not ruta:
        return ""
    if ruta.startswith("http") or ruta.startswith("data:"):
        return ruta
    p = (base / ruta) if not pathlib.Path(ruta).is_absolute() else pathlib.Path(ruta)
    if not p.exists():
        p = AQUI / ruta
    tipo = mimetypes.guess_type(str(p))[0] or "image/png"
    return f"data:{tipo};base64,{base64.b64encode(p.read_bytes()).decode()}"


def dinero(n):
    return f"${n:,.0f}"


def armar(datos, base):
    marca = MARCAS[datos.get("marca", "level-up")]
    c = datos["cliente"]
    logo_m = embeber(marca["logo"], AQUI)
    logo_c = embeber(c.get("logo"), base)
    S = []

    def slide(cuerpo, bloque):
        S.append((cuerpo, bloque))

    marcas_html = f'<div class="marcas pop"><img class="lu" src="{logo_m}" alt="{e(marca["nombre"])}">' + (
        f'<span class="x">×</span><img class="kas" src="{logo_c}" alt="{e(c["negocio"])}">' if logo_c else "") + "</div>"

    # 1 · Portada
    p = datos["portada"]
    fotos = [embeber(f, base) for f in c.get("fotos", [])][:3]
    vitrina = "".join(f'<div class="foto f{i + 1}"><img src="{f}" alt=""></div>' for i, f in enumerate(fotos))
    slide(f'''<div class="portada"{' style="width:1500px"' if not fotos else ''}>
      {marcas_html}
      <div class="ceja sube" style="--d:.3s">{e(p.get("ceja", "Propuesta para " + c["nombre"]))}</div>
      <h1 class="sube" style="--d:.45s">{txt(p["titulo"])}</h1>
      <p class="sub sube" style="--d:.65s">{txt(p.get("sub", ""))}</p>
      <div class="fecha aparece" style="--d:.9s">{e(c.get("fecha", ""))}</div>
    </div>
    <div class="vitrina">{vitrina}</div>''', p.get("pie", f'{c["negocio"]} × {marca["nombre"]}'))

    # 2 · Diagnóstico
    if d := datos.get("diagnostico"):
        tarj = "".join(f'<div class="diag pop" style="--d:{.35 + i * .18:.2f}s"><b>{e(t)}</b><span>{e(x)}</span></div>' for i, (t, x) in enumerate(d["puntos"][:4]))
        cols = min(4, len(d["puntos"]))
        slide(f'''<div class="cab"><div class="ceja sube">{e(d.get("ceja", "Lo que hablamos"))}</div>
      <h2 class="sube" style="--d:.1s">{txt(d["titulo"])}</h2></div>
    <div class="grid-diag" style="grid-template-columns:repeat({cols},1fr)">{tarj}</div>''', "Diagnóstico")

    # 3 · Meta
    if m := datos.get("meta"):
        slide(f'''<div class="centro">
      <div class="ceja sube">{e(m.get("ceja", "Tu meta"))}</div>
      <div class="meta-num pop" style="--d:.2s">{e(m["numero"])}<small>{e(m.get("unidad", ""))}</small></div>
      {'<div class="flecha-meta aparece" style="--d:.7s">↓</div><div class="meta-din pop" style="--d:.9s">' + e(m["valor"]) + '<small>' + e(m.get("valor_nota", "")) + '</small></div>' if m.get("valor") else ''}
      <p class="sub sube" style="--d:1.2s">{txt(m.get("nota", ""))}</p>
    </div>''', "La meta")

    # 4 · Plan
    if pl := datos.get("plan"):
        carriles = ""
        for i, car in enumerate(pl["carriles"][:3]):
            FIN = ' class="fin"'
            pasos = "<i>→</i>".join(f'<span{FIN if j == len(car["pasos"]) - 1 else ""}>{e(x)}</span>' for j, x in enumerate(car["pasos"]))
            carriles += f'<div class="carril pop" style="--d:{.4 + i * .4:.1f}s"><small>{e(car["nombre"])}</small><div class="pasos">{pasos}</div></div>'
        slide(f'''<div class="cab"><div class="ceja sube">{e(pl.get("ceja", "El plan"))}</div>
      <h2 class="sube" style="--d:.1s">{txt(pl["titulo"])}</h2></div>
    <div class="ruta">{carriles}</div>''', "El plan")

    # 5 · Ejemplo (anuncio + chat), marcado EJEMPLO
    if ej := datos.get("ejemplo"):
        a = ej.get("anuncio")
        tel_a = ""
        foto_a = embeber(a.get("foto"), base) if a and a.get("foto") else (fotos[0] if fotos else "")
        if a:
            tel_a = f'''<div class="tel pop" style="--d:.3s">
        <div class="fb-top"><img src="{logo_c or logo_m}" alt=""><div><b>{e(a.get("pagina", c["negocio"]))}</b><span>Publicidad</span></div></div>
        <p class="fb-txt">{e(a["texto"])}</p>
        {f'<img class="fb-foto" src="{foto_a}" alt="">' if foto_a else ''}
        <div class="fb-cta"><div><small>{e(a.get("web", "").upper())}</small><b>{e(a["producto"])}</b></div><span class="btn-fb">{e(a.get("boton", "Comprar"))}</span></div>
      </div>'''
        burbujas = ""
        for i, (quien, t) in enumerate(ej.get("chat", [])):
            clase = "yo" if quien == "cliente" else ("ag link" if quien == "enlace" else "ag")
            contenido = e(t) if quien != "enlace" else f'<b>{e(t)}</b><span>{e(ej.get("web", ""))}</span>'
            burbujas += f'<div class="b {clase} sube" style="--d:{1.0 + i * .6:.1f}s">{contenido}</div>'
        tel_c = f'''<div class="tel chat pop" style="--d:.6s">
        <div class="ms-top"><img src="{logo_c or logo_m}" alt=""><div><b>{e(c["negocio"])}</b><span>Responde en segundos</span></div></div>
        <div class="burbujas">{burbujas}</div>
      </div>''' if burbujas else ""
        slide(f'''<div class="cab"><div class="ceja sube">Así se ve · ejemplo</div>
      <h2 class="sube" style="--d:.1s">{txt(ej.get("titulo", "Del anuncio a la venta, *sin perder a nadie.*"))}</h2></div>
    <div class="telefonos">{tel_a}{tel_c}
      <div class="nota-ej aparece" style="--d:3s">EJEMPLO ILUSTRATIVO · {e(ej.get("nota", "precios y disponibilidad se configuran con tu información"))}</div>
    </div>''', "Ejemplo")

    # 6 · Prueba (testimonios aprobados de testimonios.json)
    if pr := datos.get("prueba"):
        lib = json.loads((AQUI / "testimonios.json").read_text())
        ts = [lib[k] for k in pr["testimonios"] if k in lib][:4]
        legal = '<div class="legal-p aparece" style="--d:1.4s">Resultados de clientes reales; cada negocio es distinto. Toca el video para verlo.</div>'
        if len(ts) == 1:
            t = ts[0]
            fondo = f"background-image:url({t['poster']})" if t.get("poster") else ""
            datos_t = f'<div class="num-p pop" style="--d:.9s"><b>{e(t["dato"][0])}</b><small>{e(t["dato"][1])}</small></div>' if t.get("dato") else ""
            slide(f'''<div class="cab"><div class="ceja sube">{e(pr.get("ceja", "Ya lo hicimos"))}</div>
      <h2 class="sube" style="--d:.1s">«{txt(t["cita"])}»</h2></div>
    <div class="prueba">
      <button type="button" class="video-h pop" style="--d:.35s;{fondo}" data-video="{t['video']}" aria-label="Ver el testimonio de {e(t['nombre'])}">
        {'' if t.get('poster') else f'<video class="mini-v" src="{t["video"]}#t=1" muted playsinline preload="metadata"></video>'}<div class="play">{PLAY}</div><span class="dur">{e(t.get('dur', ''))}</span></button>
      <div class="dato-p"><b class="sube" style="--d:.6s">{e(t["nombre"])}</b><span class="sube" style="--d:.7s">{e(t["negocio"])}</span>{datos_t}{legal}</div>
    </div>''', "Prueba")
        else:
            cards = ""
            for i, t in enumerate(ts):
                fondo = f"background-image:url({t['poster']})" if t.get("poster") else ""
                mini = '' if t.get('poster') else f'<video class="mini-v" src="{t["video"]}#t=1" muted playsinline preload="metadata"></video>'
                cards += f'''<div class="testi sube" style="--d:{.2 + i * .12:.2f}s"><button type="button" class="video" data-video="{t['video']}" aria-label="Ver el testimonio de {e(t['nombre'])}" style="{fondo}">{mini}<div class="play">{PLAY}</div><span class="dur">{e(t.get('dur', ''))}</span></button>
          <b>{e(t["nombre"])}</b><span>{e(t["negocio"])}</span><q>{txt(t["cita"]).replace('class="oro"', '').replace('<span >', '<em>').replace('</span>', '</em>')}</q></div>'''
            slide(f'''<div class="cab" style="text-align:center;align-items:center;left:0;right:0;top:110px"><div class="ceja sube">{e(pr.get("ceja", "Lo dicen ellos"))}</div>
      <h2 class="sube" style="--d:.1s">{txt(pr.get("titulo", "Resultados reales, *en su propia voz.*"))}</h2></div>
    <div class="testis" style="grid-template-columns:repeat({len(ts)},300px);justify-content:center;gap:40px;top:290px;left:0;right:0">{cards}</div>
    <div class="legal aparece" style="--d:1.2s">RESULTADOS DE CLIENTES REALES · CADA NEGOCIO ES DISTINTO · TOCA UN VIDEO PARA VERLO</div>''', "Prueba")

    # 7 · Servicios (uno por slide)
    for i, sv in enumerate(datos.get("servicios", [])):
        items = "".join(f'<li class="sube" style="--d:{.3 + j * .09:.2f}s"><i>{CHECK}</i>{e(t)}</li>' for j, t in enumerate(sv["incluye"]))
        slide(f'''<div class="servicio">
      <div class="lado-s">
        <div class="ceja sube">{e(sv.get("ceja", f"Servicio {i + 1}"))}</div>
        <h2 class="sube" style="--d:.1s">{txt(sv["nombre"])}</h2>
        <p class="sub sube" style="--d:.2s">{txt(sv.get("sub", ""))}</p>
        <div class="precio pop" style="--d:.5s"><small>INVERSIÓN</small><b>$<span data-cuenta="{int(sv["precio"])}">0</span></b><span>{e(sv.get("precio_nota", ""))}</span></div>
        {f'<div class="nota-s aparece" style="--d:1.2s">{e(sv["nota"])}</div>' if sv.get("nota") else ''}
      </div>
      <ul class="incluye">{items}</ul>
    </div>''', sv.get("pie", f"Servicio {i + 1}"))

    # 8 · Proyección (ilustrativa)
    if py := datos.get("proyeccion"):
        cols = ""
        alturas = [120, 252, 380]
        for j, col in enumerate(py["meses"][:3]):
            extra = f'<i>{e(col["cifra"])}</i>' if col.get("cifra") else ""
            ORO = ' class="oro"'
            cols += f'<div class="col-p"><div class="barra-p b{j + 1}" style="height:{alturas[j]}px">{extra}</div><b{ORO if j == 2 else ""}>{e(col["mes"])}</b><span>{e(col["texto"])}</span></div>'
        slide(f'''<div class="cab"><div class="ceja sube">{e(py.get("ceja", "Proyección · 3 meses"))}</div>
      <h2 class="sube" style="--d:.1s">{txt(py["titulo"])}</h2></div>
    <div class="proy">
      {f'<div class="meta-linea aparece" style="--d:1.2s"><span>{e(py["linea_meta"])}</span></div>' if py.get("linea_meta") else ''}
      {cols}
    </div>
    <div class="legal-proy aparece" style="--d:1.8s">{e(py.get("legal", "Proyección ilustrativa; los resultados dependen de tu producto, tu operación y tu inversión en anuncios."))}</div>''', "Proyección")

    # 9 · Inversión
    if inv := datos.get("inversion"):
        piezas = ""
        lista = inv.get("piezas") or [{"nombre": sv.get("corto", re.sub(r"\*", "", sv["nombre"])).upper(), "precio": sv["precio"]} for sv in datos.get("servicios", [])]
        suma = sum(x["precio"] for x in lista)
        bono = inv.get("bono", 0)
        total = suma - bono
        for j, x in enumerate(lista):
            if j:
                piezas += f'<div class="mas aparece" style="--d:{.5 + j * .5:.1f}s">+</div>'
            piezas += f'<div class="pieza pop" style="--d:{.4 + j * .5:.1f}s"><small>{e(x["nombre"].upper())}</small><b>$<span data-cuenta="{int(x["precio"])}">0</span></b></div>'
        if len(lista) > 1 or bono:
            piezas += f'''<div class="mas aparece" style="--d:1.2s">=</div>
        <div class="pieza total pop" style="--d:1.4s"><small>{"TOTAL CON TU BONO" if bono else "TOTAL"}</small>{f"<s>{dinero(suma)}</s>" if bono else ""}<b>$<span data-cuenta="{int(total)}" data-delay="1500">0</span></b></div>'''
        slide(f'''<div class="centro">
      <div class="ceja sube">{e(inv.get("ceja", "Tu inversión"))}</div>
      <h2 class="sube" style="--d:.1s">{txt(inv.get("titulo", "Todo el sistema, *en una sola mirada.*"))}</h2>
      <div class="suma">{piezas}</div>
      {f'<div class="bono pop" style="--d:1.9s"><b>🎁 Bono de {dinero(bono)}</b> {e(inv.get("bono_texto", "si tomas los servicios juntos."))}</div>' if bono else ''}
      {f'<p class="sub chico sube" style="--d:2.1s">{e(inv["nota"])}</p>' if inv.get("nota") else ''}
      {f'<div class="klarna aparece" style="--d:2.4s"><img src="{embeber("marca/klarna.svg", AQUI)}" alt="Klarna"><span>¿Prefieres pagar en cuotas? Financiamiento disponible con Klarna.</span></div>' if inv.get("klarna") else ''}
    </div>''', "Inversión")

    # 10 · Cómo arrancamos
    if ar := datos.get("arranque"):
        fases = "".join(f'<div class="hito-k pop" style="--d:{.4 + i * .25:.2f}s"><small>{e(a)}</small><b>{e(b)}</b><span>{e(x)}</span></div>' for i, (a, b, x) in enumerate(ar["pasos"][:4]))
        slide(f'''<div class="cab"><div class="ceja sube">{e(ar.get("ceja", "Cómo arrancamos"))}</div>
      <h2 class="sube" style="--d:.1s">{txt(ar.get("titulo", "De la firma a los *resultados.*"))}</h2></div>
    <div class="linea-k" style="grid-template-columns:repeat({min(4, len(ar["pasos"]))},1fr)"><div class="riel aparece" style="--d:.3s"></div>{fases}</div>''', "Cómo arrancamos")

    # 11 · Cierre
    ci = datos["cierre"]
    slide(f'''<div class="centro">
      {marcas_html}
      <h2 class="grande sube" style="--d:.3s">{txt(ci["titulo"])}</h2>
      <p class="sub sube" style="--d:.55s">{txt(ci.get("sub", ""))}</p>
      <div class="firma-k aparece" style="--d:.9s">{e(ci.get("firma", marca["nombre"] + " · Elvin Ayala"))}</div>
    </div>''', "Próximo paso")

    # ── ensamblar
    N = len(S)
    secciones = ""
    for i, (cuerpo, bloque) in enumerate(S):
        secciones += f'''
    <section class="slide{' activa' if i == 0 else ''}" id="s{i + 1}">
      {'' if i in (0, N - 1) else f'<img class="logo-esq" src="{logo_m}" alt="">'}
      {cuerpo}
      <div class="pie"><span>{e(bloque)}</span><span>{i + 1:02d} / {N:02d}</span></div>
    </section>'''
    acento = c.get("acento", "#c39a6b")
    css = (AQUI / "motor/base.css").read_text() + (AQUI / "motor/kit.css").read_text() + marca["css"] + f"""
:root {{ --bronce: {acento}; --bronce2: {acento}; }}
.mini-v {{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }}
.video-h .play, .testi .video .play {{ z-index: 2; }}"""
    titulo = datos.get("titulo_pestana", f'Propuesta {c["negocio"]} · {marca["nombre"]}')
    return f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>{e(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?{marca["fuentes"]}&display=swap">
<style>{css}</style></head><body>
<div id="visor">
  <div id="escenario">{secciones}
    <div class="cine" id="cine" hidden><video id="cineVideo" controls playsinline preload="metadata"></video><button type="button" class="cerrar" id="cineCerrar" aria-label="Cerrar video">✕</button></div>
  </div>
</div>
<div class="girar" id="girar"><span>📱 <b>Gira el teléfono</b> para verla en grande. Toca a la derecha para avanzar.</span><button type="button" id="cerrarGirar" aria-label="Cerrar aviso">✕</button></div>
<div class="progreso" aria-hidden="true"><i id="barra"></i></div>
<div class="controles" id="controles">
  <button type="button" id="btnAnt" aria-label="Slide anterior">‹</button>
  <span class="pag" id="pag">1 / {N}</span>
  <button type="button" id="btnSig" aria-label="Slide siguiente">›</button>
  <button type="button" id="btnRep" aria-label="Repetir la animación" title="Repetir animación (R)">↻</button>
  <button type="button" id="btnFull" aria-label="Pantalla completa" title="Pantalla completa (F)">⛶</button>
</div>
<script>{(AQUI / "motor/motor.js").read_text()}</script>
</body></html>
''', N


if __name__ == "__main__":
    entrada = pathlib.Path(sys.argv[1])
    datos = json.loads(entrada.read_text())
    salida = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else entrada.with_suffix(".html")
    pagina, n = armar(datos, entrada.parent)
    salida.write_text(pagina)
    print(f"✓ {salida} · {n} slides · {len(pagina) / 1e6:.1f} MB")

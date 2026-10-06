#!/usr/bin/env python3
# Propuesta animada para KAS (Kassandra Reyes) · Level Up Media · 5/oct/2026.
# Motor y marca = la demo de closers de Level Up (level-up-demo-ventas/index.html); acentos bronce de KAS en lo que es de ella.
# Datos: el resumen de la llamada de Elvin (5/oct) + su IG (@kas.brandpr) y su tienda (kasbrandpr.com, precios $35–$125).
import html, re, pathlib

AQUI = pathlib.Path(__file__).parent
base = (AQUI.parent / "level-up-demo-ventas" / "index.html").read_text()
estilo = re.search(r"<style>(.*?)</style>", base, re.S).group(1)
script = re.search(r"<script>(.*?)</script>", base, re.S).group(1)
script = script.replace("/^#s(\\d)$/", "/^#s(\\d+)$/")

e = html.escape
S = []  # (cuerpo, bloque)
def slide(cuerpo, bloque):
    S.append((cuerpo, bloque))

CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'

# ───────── 1 · Portada ─────────
slide('''<div class="portada">
      <div class="marcas pop"><img class="lu" src="img/lu-logo.png" alt="Level Up Media"><span class="x">×</span><img class="kas" src="img/kas-logo.png" alt="KAS"></div>
      <div class="ceja sube" style="--d:.3s">Propuesta para Kassandra Reyes</div>
      <h1 class="sube" style="--d:.45s">Que cada clienta que ve <span class="bronce">KAS</span><br>llegue a <span class="oro">comprar.</span></h1>
      <p class="sub sube" style="--d:.65s">Anuncios que llevan directo a tu tienda + un agente que contesta cada mensaje.</p>
      <div class="fecha aparece" style="--d:.9s">5 de octubre de 2026</div>
    </div>
    <div class="vitrina">
      <div class="foto f1"><img src="img/brillo.jpg" alt=""></div>
      <div class="foto f2"><img src="img/eva.jpg" alt=""></div>
      <div class="foto f3"><img src="img/elegancia.jpg" alt=""></div>
    </div>''', "KAS × Level Up")

# ───────── 2 · Lo que hablamos ─────────
DIAG = [("3 años", "con tu tienda online de calzado para mujer, en piel y con diseño propio."),
        ("35 a 55 años", "tu clienta ideal, y una gran parte está en Facebook."),
        ("Anuncios sin resultado", "probaste en Instagram sin mucho resultado, y Facebook no lo manejas todavía."),
        ("Mensajes sin respuesta", "muchas clientas escriben, no reciben respuesta a tiempo y no llegan a tu página.")]
tarj = "".join(f'<div class="diag pop" style="--d:{.35 + i * .18:.2f}s"><b>{e(t)}</b><span>{e(d)}</span></div>' for i, (t, d) in enumerate(DIAG))
slide(f'''<div class="cab"><div class="ceja sube">Lo que hablamos</div>
      <h2 class="sube" style="--d:.1s">Tienes el producto. Te falta que <span class="oro">te vean y te compren.</span></h2></div>
    <div class="grid-diag">{tarj}</div>''', "Diagnóstico")

# ───────── 3 · La meta ─────────
slide('''<div class="centro">
      <div class="ceja sube">Tu meta</div>
      <div class="meta-num pop" style="--d:.2s"><span data-cuenta="10">0</span>–<span data-cuenta="15">0</span><small>pares a la semana</small></div>
      <div class="flecha-meta aparece" style="--d:.7s">↓</div>
      <div class="meta-din pop" style="--d:.9s">≈ $4,000 – $5,000 <small>al mes en ventas</small></div>
      <p class="sub sube" style="--d:1.2s">Con los precios de tu tienda (de $80 a $125 la mayoría de tus modelos).</p>
    </div>''', "La meta")

# ───────── 4 · El plan: dos piezas ─────────
slide('''<div class="cab"><div class="ceja sube">El plan</div>
      <h2 class="sube" style="--d:.1s">Uno trae a la clienta. <span class="oro">El otro no la deja ir.</span></h2></div>
    <div class="ruta">
      <div class="carril pop" style="--d:.4s">
        <small>1 · MARKETING</small>
        <div class="pasos"><span>Anuncio en Facebook</span><i>→</i><span>Página del modelo</span><i>→</i><span class="fin">Compra</span></div>
      </div>
      <div class="carril pop" style="--d:.8s">
        <small>2 · AGENTE DE CHAT</small>
        <div class="pasos"><span>Te escribe</span><i>→</i><span>Respuesta en segundos</span><i>→</i><span>Enlace del modelo</span><i>→</i><span class="fin">Compra</span></div>
      </div>
    </div>''', "El plan")

# ───────── 5 · Cómo se ve (EJEMPLO) ─────────
slide('''<div class="cab"><div class="ceja sube">Así se ve · ejemplo</div>
      <h2 class="sube" style="--d:.1s">Del anuncio a la compra, <span class="oro">sin perder a nadie.</span></h2></div>
    <div class="telefonos">
      <div class="tel pop" style="--d:.3s">
        <div class="fb-top"><img src="img/kas-logo.png" alt=""><div><b>KAS Shoe designer</b><span>Publicidad</span></div></div>
        <p class="fb-txt">Elegancia y comodidad en piel. Diseño de Puerto Rico, envíos a PR y EE. UU. 👠</p>
        <img class="fb-foto" src="img/brillo.jpg" alt="">
        <div class="fb-cta"><div><small>KASBRANDPR.COM</small><b>Bianca · $125</b></div><span class="btn-fb">Comprar</span></div>
      </div>
      <div class="tel chat pop" style="--d:.6s">
        <div class="ms-top"><img src="img/kas-logo.png" alt=""><div><b>KAS</b><span>Responde en segundos</span></div></div>
        <div class="burbujas">
          <div class="b yo sube" style="--d:1.0s">Hola, ¿las Bianca las tienen en talla 7?</div>
          <div class="b ag sube" style="--d:1.7s">¡Hola! 😊 Sí, las Bianca en piel metalizada están en talla 7, a $125. Te dejo el enlace para comprarlas directo:</div>
          <div class="b ag link sube" style="--d:2.2s"><b>Bianca · KAS</b><span>kasbrandpr.com</span></div>
          <div class="b ag sube" style="--d:2.7s">¿Te ayudo con algo más, como el envío?</div>
        </div>
      </div>
      <div class="nota-ej aparece" style="--d:3s">EJEMPLO ILUSTRATIVO · tallas y disponibilidad se configuran con tu inventario</div>
    </div>''', "Ejemplo")


# ───────── Prueba: otra tienda online ─────────
PLAY = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#f5f1e8"/></svg>'
slide(f'''<div class="cab"><div class="ceja sube">Ya lo hicimos con otra tienda online</div>
      <h2 class="sube" style="--d:.1s">«Añadimos <span class="oro">15,000 clientes</span> desde que empezamos con ustedes.»</h2></div>
    <div class="prueba">
      <button type="button" class="video-h pop" style="--d:.35s;background-image:url(videos/yazan-sola.jpg)" data-video="videos/yazan-sola.mp4" aria-label="Ver el testimonio de Yazan, Sola Boutique">
        <div class="play">{PLAY}</div><span class="dur">0:53</span></button>
      <div class="dato-p">
        <img class="logo-sola pop" style="--d:.5s" src="img/sola-logo.png" alt="Sola Boutique">
        <b class="sube" style="--d:.6s">Yazan · Sola Boutique</b>
        <span class="sube" style="--d:.7s">Tienda en línea · Meta Ads + Shopify</span>
        <div class="num-p pop" style="--d:.9s"><b><span data-cuenta="15000">0</span>+</b><small>clientes nuevos</small></div>
        <div class="num-p pop" style="--d:1.1s"><b>25–30 %</b><small>más ventas en Shopify, en sus palabras</small></div>
        <div class="legal-p aparece" style="--d:1.4s">Resultados de un cliente real; cada negocio es distinto. Toca el video para verlo.</div>
      </div>
    </div>''', "Prueba")

# ───────── 6 · Servicio 1: Marketing DFY ─────────
DFY = ["Onboarding 1:1 y auditoría de tu marca, tu tienda y tus cuentas",
       "Estrategia de marketing para tu clienta ideal: mujeres de 35 a 55, con foco en Facebook",
       "Tu oferta y tus ángulos ganadores",
       "Estructura de tu contenido orgánico: qué publicar y por qué",
       "Creativos para anuncios con tu marca y tus modelos",
       "Campañas en Facebook e Instagram que llevan directo a la página de compra",
       "Píxel de Meta para medir cada compra y optimizar por ventas",
       "Optimización constante: se apaga lo que no vende y se escala lo que sí",
       "Tu equipo: estratega, diseñador y project manager, con reportes de resultados"]
items = "".join(f'<li class="sube" style="--d:{.3 + i * .09:.2f}s"><i>{CHECK}</i>{e(t)}</li>' for i, t in enumerate(DFY))
slide(f'''<div class="servicio">
      <div class="lado-s">
        <div class="ceja sube">Servicio 1</div>
        <h2 class="sube" style="--d:.1s">Marketing <span class="oro">hecho por nosotros</span></h2>
        <p class="sub sube" style="--d:.2s">Done For You · 3 meses. Nosotros lo hacemos; tú te enfocas en tu marca.</p>
        <div class="precio pop" style="--d:.5s"><small>INVERSIÓN</small><b>$<span data-cuenta="3500">0</span></b><span>pago único · 3 meses de servicio</span></div>
        <div class="nota-s aparece" style="--d:1.2s">La inversión en anuncios se paga aparte, directo a Meta.</div>
      </div>
      <ul class="incluye">{items}</ul>
    </div>''', "Marketing")

# ───────── 7 · Servicio 2: Agente de chat ─────────
AG = ["Entrenado con tu catálogo: modelos, precios, tallas, materiales y envíos a PR y EE. UU.",
      "Contesta en segundos, de día y de noche, en Messenger e Instagram",
      "Recomienda modelos y manda el enlace directo a la página de compra",
      "Resuelve dudas de tallas y envíos con el tono de KAS",
      "Le da seguimiento a la clienta que preguntó y no compró",
      "Te avisa cuando una clienta necesita hablar contigo",
      "En marcha en 15 días, y del día 16 al 45 lo afinamos con conversaciones reales"]
items2 = "".join(f'<li class="sube" style="--d:{.3 + i * .1:.2f}s"><i>{CHECK}</i>{e(t)}</li>' for i, t in enumerate(AG))
slide(f'''<div class="servicio">
      <div class="lado-s">
        <div class="ceja sube">Servicio 2</div>
        <h2 class="sube" style="--d:.1s">Agente de chat <span class="oro">que vende</span></h2>
        <p class="sub sube" style="--d:.2s">Para que ninguna clienta se quede sin respuesta ni sin llegar a tu página.</p>
        <div class="precio pop" style="--d:.5s"><small>INVERSIÓN</small><b>$<span data-cuenta="2000">0</span></b><span>pago único · sin mensualidad</span></div>
      </div>
      <ul class="incluye">{items2}</ul>
    </div>''', "Agente de chat")


# ───────── Proyección a 3 meses ─────────
slide('''<div class="cab"><div class="ceja sube">Proyección · 3 meses</div>
      <h2 class="sube" style="--d:.1s">Tu meta es el piso. <span class="oro">En el mes 3, escalamos.</span></h2></div>
    <div class="proy">
      <div class="meta-linea aparece" style="--d:1.2s"><span>Tu meta · 10–15 pares/semana</span></div>
      <div class="col-p"><div class="barra-p b1"></div><b>Mes 1</b><span>Arrancamos y aprendemos qué modelos y anuncios venden</span></div>
      <div class="col-p"><div class="barra-p b2"></div><b>Mes 2</b><span>Llegamos a tu meta: 10–15 pares a la semana</span></div>
      <div class="col-p"><div class="barra-p b3"><i>15+</i></div><b class="oro">Mes 3</b><span>La superamos: más presupuesto a lo que ya vende</span></div>
    </div>
    <div class="legal-proy aparece" style="--d:1.8s">Proyección ilustrativa con base en tu meta; los resultados dependen de tu producto, tu inventario y tu inversión en anuncios.</div>''', "Proyección")

# ───────── 8 · Inversión ─────────
slide('''<div class="centro">
      <div class="ceja sube">Tu inversión · una sola vez</div>
      <h2 class="sube" style="--d:.1s">Pagas una vez. <span class="oro">Sin mensualidades con nosotros.</span></h2>
      <div class="suma">
        <div class="pieza pop" style="--d:.4s"><small>MARKETING DFY · 3 MESES</small><b>$<span data-cuenta="3500">0</span></b></div>
        <div class="mas aparece" style="--d:.7s">+</div>
        <div class="pieza pop" style="--d:.9s"><small>AGENTE DE CHAT</small><b>$<span data-cuenta="2000">0</span></b></div>
        <div class="mas aparece" style="--d:1.2s">=</div>
        <div class="pieza total pop" style="--d:1.4s"><small>TOTAL CON TU BONO</small><s>$5,500</s><b>$<span data-cuenta="5000" data-delay="1500">0</span></b></div>
      </div>
      <div class="bono pop" style="--d:1.9s"><b>🎁 Bono de $500</b> si tomas los dos servicios juntos.</div>
      <p class="sub chico sube" style="--d:2.1s">Los anuncios se pagan aparte, directo a Meta, con el presupuesto que definamos en la estrategia.</p>
      <div class="klarna aparece" style="--d:2.4s"><img src="img/klarna.svg" alt="Klarna"><span>¿Prefieres pagar en cuotas? Financiamiento disponible con Klarna.</span></div>
    </div>''', "Inversión")

# ───────── 9 · Cómo arrancamos ─────────
FASES = [("Semana 1", "Onboarding", "Auditoría, accesos a tus cuentas y tu catálogo."),
         ("Día 15", "Agente en marcha", "Contestando en Messenger e Instagram."),
         ("Mes 1", "Campañas al aire", "Estrategia, creativos y anuncios hacia tu tienda."),
         ("Meses 2 y 3", "Optimizar y escalar", "Más de lo que vende; el agente afinado hasta el día 45.")]
fases = "".join(f'<div class="hito-k pop" style="--d:{.4 + i * .25:.2f}s"><small>{e(a)}</small><b>{e(b)}</b><span>{e(c)}</span></div>' for i, (a, b, c) in enumerate(FASES))
slide(f'''<div class="cab"><div class="ceja sube">Cómo arrancamos</div>
      <h2 class="sube" style="--d:.1s">De la firma a las <span class="oro">ventas.</span></h2></div>
    <div class="linea-k"><div class="riel aparece" style="--d:.3s"></div>{fases}</div>''', "Cómo arrancamos")

# ───────── 10 · Próximo paso ─────────
slide('''<div class="centro">
      <div class="marcas pop"><img class="lu" src="img/lu-logo.png" alt="Level Up Media"><span class="x">×</span><img class="kas" src="img/kas-logo.png" alt="KAS"></div>
      <h2 class="grande sube" style="--d:.3s">Nos vemos el <span class="oro">viernes 9 de octubre</span><br>a las 3:00 PM.</h2>
      <p class="sub sube" style="--d:.55s">Revisamos juntas la propuesta y, si estás lista, arrancamos con tu onboarding.</p>
      <div class="firma-k aparece" style="--d:.9s">Level Up Media · Elvin Ayala</div>
    </div>''', "Próximo paso")

N = len(S)
secciones = ""
for i, (cuerpo, bloque) in enumerate(S):
    secciones += f'''
    <section class="slide{' activa' if i == 0 else ''}" id="s{i + 1}">
      {'' if i in (0, N - 1) else '<img class="logo-esq" src="img/lu-logo.png" alt="">'}
      {cuerpo}
      <div class="pie"><span>{e(bloque)}</span><span>{i + 1:02d} / {N:02d}</span></div>
    </section>'''

extra = r'''
:root { --bronce: #c39a6b; --bronce2: #e6c7a0; }
.bronce { color: var(--bronce); }
.sub { font-family: var(--sora); font-size: 32px; color: var(--gris); line-height: 1.35; margin: 0; }
.centro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; text-align: center; padding: 0 160px; }
.cab { position: absolute; left: 140px; right: 140px; top: 150px; display: flex; flex-direction: column; gap: 18px; }
.cab h2 { font-size: 68px; line-height: 1.08; max-width: 1500px; }
.grande { font-size: 84px; line-height: 1.08; }
/* portada */
.portada { position: absolute; left: 140px; top: 0; bottom: 0; width: 900px; display: flex; flex-direction: column; justify-content: center; gap: 26px; }
.portada h1 { font-size: 92px; line-height: 1.04; }
.marcas { display: flex; align-items: center; gap: 30px; }
.marcas .lu { height: 92px; }
.marcas .kas { height: 112px; }
.marcas .x { font-family: var(--sora); font-size: 44px; color: var(--gris2); }
.fecha { font-family: var(--mono); font-size: 19px; letter-spacing: .24em; color: var(--gris2); text-transform: uppercase; }
.vitrina { position: absolute; right: 80px; top: 0; bottom: 0; width: 820px; }
.foto { position: absolute; border-radius: 26px; overflow: hidden; border: 2px solid rgba(195,154,107,.55); box-shadow: 0 40px 110px rgba(0,0,0,.6); }
.foto img { width: 100%; height: 100%; object-fit: cover; display: block; }
.f1 { width: 430px; height: 430px; left: 0; top: 130px; }
.f2 { width: 330px; height: 560px; right: 20px; top: 70px; }
.f3 { width: 360px; height: 360px; left: 210px; top: 600px; }
.activa .f1 { animation: flotaA 9s ease-in-out infinite, pop .9s cubic-bezier(.2,.8,.2,1) .3s both; }
.activa .f2 { animation: flotaB 10s ease-in-out infinite, pop .9s cubic-bezier(.2,.8,.2,1) .55s both; }
.activa .f3 { animation: flotaA 11s ease-in-out infinite reverse, pop .9s cubic-bezier(.2,.8,.2,1) .8s both; }
@keyframes flotaA { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-18px) rotate(1deg); } }
@keyframes flotaB { 0%,100% { transform: translateY(0) rotate(2deg); } 50% { transform: translateY(16px) rotate(-1deg); } }
/* diagnóstico */
.grid-diag { position: absolute; left: 140px; right: 140px; top: 470px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.diag { background: var(--superficie); border: 1px solid var(--borde); border-top: 3px solid var(--bronce); border-radius: 22px; padding: 30px; display: flex; flex-direction: column; gap: 14px; min-height: 300px; }
.diag b { font-family: var(--sora); font-size: 34px; line-height: 1.1; color: var(--texto); }
.diag span { font-size: 24px; line-height: 1.45; color: var(--gris); }
.diag:last-child { border-top-color: var(--oro); }
/* meta */
.meta-num { font-family: var(--sora); font-weight: 800; font-size: 210px; line-height: 1; letter-spacing: -.04em; color: var(--oro); }
.meta-num small, .meta-din small { display: block; font-family: var(--mono); font-weight: 400; font-size: 24px; letter-spacing: .26em; color: var(--gris); text-transform: uppercase; margin-top: 10px; }
.flecha-meta { font-size: 54px; color: var(--bronce); }
.meta-din { font-family: var(--sora); font-weight: 800; font-size: 86px; color: var(--texto); letter-spacing: -.02em; }
/* plan */
.ruta { position: absolute; left: 140px; right: 140px; top: 470px; display: flex; flex-direction: column; gap: 34px; }
.carril { background: var(--superficie); border: 1px solid var(--borde); border-radius: 24px; padding: 30px 36px; display: flex; flex-direction: column; gap: 18px; }
.carril small { font-family: var(--mono); font-size: 20px; letter-spacing: .24em; color: var(--oro); }
.pasos { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.pasos span { font-family: var(--sora); font-size: 32px; font-weight: 700; padding: 14px 24px; border-radius: 16px; border: 1px solid var(--borde); background: var(--superficie2); }
.pasos span.fin { background: var(--oro); color: #0b0b0b; border-color: var(--oro); }
.pasos i { font-style: normal; font-size: 36px; color: var(--bronce); }
.activa .carril .pasos span { animation: pop .6s cubic-bezier(.2,.8,.2,1) both; }
.activa .carril:first-child .pasos span:nth-child(1) { animation-delay: .6s; } .activa .carril:first-child .pasos span:nth-child(3) { animation-delay: .8s; } .activa .carril:first-child .pasos span:nth-child(5) { animation-delay: 1s; }
.activa .carril:last-child .pasos span:nth-child(1) { animation-delay: 1.2s; } .activa .carril:last-child .pasos span:nth-child(3) { animation-delay: 1.4s; } .activa .carril:last-child .pasos span:nth-child(5) { animation-delay: 1.6s; } .activa .carril:last-child .pasos span:nth-child(7) { animation-delay: 1.8s; }
/* teléfonos */
.telefonos { position: absolute; left: 0; right: 0; top: 300px; display: flex; justify-content: center; gap: 90px; }
.tel { width: 420px; height: 600px; border-radius: 44px; background: #fff; color: #1c1e21; padding: 22px; box-shadow: 0 40px 120px rgba(0,0,0,.6), 0 0 0 10px #1b1a16; display: flex; flex-direction: column; gap: 14px; overflow: hidden; font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; }
.fb-top, .ms-top { display: flex; align-items: center; gap: 12px; }
.fb-top img, .ms-top img { width: 46px; height: 46px; border-radius: 50%; background: #fff; border: 1px solid #e4e6eb; object-fit: contain; padding: 4px; }
.fb-top b, .ms-top b { display: block; font-size: 18px; } .fb-top span, .ms-top span { font-size: 14px; color: #65676b; }
.fb-txt { font-size: 17px; line-height: 1.4; margin: 0; }
.fb-foto { width: 100%; height: 300px; object-fit: cover; border-radius: 8px; }
.fb-cta { display: flex; justify-content: space-between; align-items: center; background: #f0f2f5; border-radius: 8px; padding: 12px 14px; }
.fb-cta small { font-size: 12px; color: #65676b; } .fb-cta b { display: block; font-size: 18px; }
.btn-fb { background: #1877f2; color: #fff; font-weight: 700; font-size: 16px; padding: 10px 18px; border-radius: 8px; }
.activa .btn-fb { animation: late 1.6s ease-in-out 1.2s infinite; }
@keyframes late { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(24,119,242,.2); } }
.chat { background: #fff; }
.burbujas { display: flex; flex-direction: column; gap: 12px; padding-top: 6px; }
.b { max-width: 82%; font-size: 17px; line-height: 1.38; padding: 12px 16px; border-radius: 20px; }
.b.yo { align-self: flex-end; background: #0084ff; color: #fff; border-bottom-right-radius: 6px; }
.b.ag { align-self: flex-start; background: #f0f0f0; border-bottom-left-radius: 6px; }
.b.link { border: 1px solid var(--bronce); background: #fbf6f0; display: flex; flex-direction: column; }
.b.link span { font-size: 14px; color: #8a6a44; }
.nota-ej { position: absolute; left: 0; right: 0; top: 655px; text-align: center; font-family: var(--mono); font-size: 16px; letter-spacing: .2em; color: var(--gris2); }
/* servicios */
.servicio { position: absolute; inset: 120px 120px 110px 140px; display: grid; grid-template-columns: 640px 1fr; gap: 80px; align-items: center; }
.lado-s { display: flex; flex-direction: column; gap: 22px; }
.lado-s h2 { font-size: 74px; line-height: 1.04; }
.precio { margin-top: 10px; background: var(--superficie); border: 2px solid var(--oro); border-radius: 26px; padding: 26px 32px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 0 60px rgba(245,206,26,.12); }
.precio small { font-family: var(--mono); font-size: 18px; letter-spacing: .26em; color: var(--gris); }
.precio b { font-family: var(--sora); font-size: 96px; line-height: 1; color: var(--oro); letter-spacing: -.03em; }
.precio > span { font-size: 24px; color: var(--gris); }
.nota-s { font-size: 21px; color: var(--gris2); }
.incluye { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.incluye li { display: flex; gap: 18px; align-items: flex-start; font-size: 27px; line-height: 1.35; color: var(--texto); }
.incluye i { flex: none; width: 38px; height: 38px; border-radius: 50%; background: rgba(195,154,107,.16); color: var(--bronce2); display: grid; place-items: center; margin-top: 2px; }
.incluye i svg { width: 22px; height: 22px; }
/* inversión */
.suma { display: flex; align-items: center; gap: 30px; margin-top: 20px; }
.pieza { width: 380px; padding: 34px; border-radius: 26px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 12px; }
.pieza small { font-family: var(--mono); font-size: 17px; letter-spacing: .22em; color: var(--gris); }
.pieza b { font-family: var(--sora); font-size: 80px; letter-spacing: -.03em; line-height: 1; }
.pieza.total { background: var(--oro); border-color: var(--oro); color: #0b0b0b; box-shadow: 0 0 80px rgba(245,206,26,.25); }
.pieza.total small { color: #3a3205; }
.mas { font-family: var(--sora); font-size: 64px; color: var(--bronce); }
/* línea de tiempo */
.linea-k { position: absolute; left: 140px; right: 140px; top: 500px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 26px; }
.riel { position: absolute; left: 0; right: 0; top: -34px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, var(--bronce), var(--oro)); }
.hito-k { position: relative; background: var(--superficie); border: 1px solid var(--borde); border-radius: 22px; padding: 30px; display: flex; flex-direction: column; gap: 10px; min-height: 260px; }
.hito-k::before { content: ""; position: absolute; left: 30px; top: -44px; width: 20px; height: 20px; border-radius: 50%; background: var(--oro); box-shadow: 0 0 20px rgba(245,206,26,.6); }
.hito-k small { font-family: var(--mono); font-size: 19px; letter-spacing: .2em; color: var(--oro); text-transform: uppercase; }
.hito-k b { font-family: var(--sora); font-size: 36px; }
.hito-k span { font-size: 24px; color: var(--gris); line-height: 1.4; }
.firma-k { font-family: var(--mono); font-size: 20px; letter-spacing: .26em; color: var(--oro); text-transform: uppercase; }/* prueba */
.prueba { position: absolute; left: 140px; right: 140px; top: 420px; display: grid; grid-template-columns: 1000px 1fr; gap: 60px; align-items: center; }
.video-h { position: relative; width: 1000px; aspect-ratio: 16 / 9; border-radius: 22px; overflow: hidden; border: 2px solid rgba(245,206,26,.45); background: #000 center / cover no-repeat; cursor: pointer; padding: 0; box-shadow: 0 40px 120px rgba(0,0,0,.6); }
.video-h .play { position: absolute; left: 50%; top: 50%; margin: -55px 0 0 -55px; width: 110px; height: 110px; }
.video-h .dur { right: 14px; bottom: 14px; }
.dato-p { display: flex; flex-direction: column; gap: 10px; }
.logo-sola { width: 210px; filter: brightness(1.2); margin-bottom: 6px; }
.dato-p > b { font-family: var(--sora); font-size: 34px; }
.dato-p > span { font-size: 22px; color: var(--gris); }
.num-p { margin-top: 12px; border-left: 3px solid var(--oro); padding-left: 18px; }
.num-p b { font-family: var(--sora); font-size: 60px; color: var(--oro); line-height: 1; letter-spacing: -.02em; }
.num-p small { display: block; font-size: 20px; color: var(--gris); margin-top: 4px; }
.legal-p { font-family: var(--mono); font-size: 14px; letter-spacing: .08em; color: var(--gris2); margin-top: 14px; line-height: 1.5; }
/* proyección */
.proy { position: absolute; left: 260px; right: 260px; top: 380px; height: 520px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 80px; align-items: end; }
.col-p { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.col-p b { font-family: var(--sora); font-size: 34px; }
.col-p span { font-size: 22px; color: var(--gris); line-height: 1.4; }
.barra-p { width: 100%; border-radius: 16px 16px 6px 6px; background: linear-gradient(180deg, rgba(195,154,107,.85), rgba(195,154,107,.35)); transform-origin: bottom; position: relative; }
.b1 { height: 120px; } .b2 { height: 252px; } .b3 { height: 380px; background: linear-gradient(180deg, var(--oro), rgba(245,206,26,.35)); box-shadow: 0 0 60px rgba(245,206,26,.25); }
.b3 i { position: absolute; top: 18px; left: 0; right: 0; text-align: center; font-style: normal; font-family: var(--sora); font-weight: 800; font-size: 54px; color: #0b0b0b; }
.activa .barra-p { animation: crece 1.1s cubic-bezier(.2,.8,.2,1) both; }
.activa .b1 { animation-delay: .4s; } .activa .b2 { animation-delay: .7s; } .activa .b3 { animation-delay: 1s; }
@keyframes crece { from { transform: scaleY(0); } to { transform: scaleY(1); } }
.meta-linea { position: absolute; left: -40px; right: -40px; bottom: 342px; border-top: 3px dashed var(--bronce); }
.meta-linea span { position: absolute; left: 0; top: -40px; font-family: var(--mono); font-size: 18px; letter-spacing: .14em; color: var(--bronce2); text-transform: uppercase; }
.legal-proy { position: absolute; left: 0; right: 0; bottom: 110px; text-align: center; font-family: var(--mono); font-size: 15px; letter-spacing: .08em; color: var(--gris2); }
/* inversión con bono */
.pieza.total s { font-family: var(--sora); font-size: 30px; color: #3a3205; opacity: .7; }
.bono { font-family: var(--sora); font-size: 32px; background: rgba(195,154,107,.12); border: 2px dashed var(--bronce); border-radius: 18px; padding: 16px 30px; }
.bono b { color: var(--bronce2); }
.sub.chico { font-size: 24px; }
.klarna { display: flex; align-items: center; gap: 14px; font-size: 20px; color: var(--gris); }
.klarna img { height: 34px; }

'''

pagina = f'''<title>Propuesta KAS · Level Up</title>
<meta name="robots" content="noindex,nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>{estilo}{extra}</style>

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

<script>{script}</script>
'''
(AQUI / "index.html").write_text(pagina)
print(N, "slides")

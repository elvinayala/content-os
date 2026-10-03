#!/usr/bin/env python3
# Arma la charla "Las conversaciones son dinero" (Elvin · Level Up Media). v3 (2/oct): 10 slides sin testimonios: agentes personalizados → AutoFlow (recepcionista) → marketing → ecosistema.
# Base visual = la demo de Level Up (lu-demo/index.html): mismo motor, marca y controles + panel de notas (tecla N).
import html, math, re, pathlib

AQUI = pathlib.Path(__file__).parent
base = (AQUI.parent / "lu-demo" / "index.html").read_text()
estilo = re.search(r"<style>(.*?)</style>", base, re.S).group(1)
script = re.search(r"<script>(.*?)</script>", base, re.S).group(1)

e = html.escape
def oro(t):  # *texto* = resaltado
    return re.sub(r"\*([^*]+)\*", r'<span class="oro">\1</span>', e(t))

PLAY = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#f5f1e8"/></svg>'

def video(src, poster, ancho=420, alto=746, etiqueta=""):
    return f'''<div class="vid pop" style="--d:.4s;width:{ancho}px;height:{alto}px">
          <video src="videos/{src}" poster="videos/{poster}" playsinline preload="metadata"></video>
          <div class="vplay"><div class="play">{PLAY}</div></div>{f'<span class="vtag">{e(etiqueta)}</span>' if etiqueta else ''}
        </div>'''

S = []  # (html del cuerpo, notas, bloque)
def slide(cuerpo, notas, bloque):
    S.append((cuerpo, notas, bloque))

# ───────── 1 · APERTURA (de Elvin, una línea) ─────────
slide('''<div class="centro">
      <img class="logo-grande pop" src="logo.png" alt="Level Up Media">
      <h1 class="mega sube" style="--d:.35s">Las conversaciones<br>son <span class="oro">dinero.</span></h1>
      <div class="sub sube" style="--d:.55s">Agentes de IA + marketing: el sistema que consigue clientes y los atiende.</div>
      <div class="firma sube" style="--d:.75s">Elvin Ayala · CEO, Level Up Media</div>
    </div>''',
 "Buenas. Gracias por la invitación [di el nombre del evento y de quien te invitó]. Soy Elvin Ayala, CEO de Level Up Media y de otros negocios digitales, y también tengo una empresa de inteligencia artificial. Y de mí, eso es todo. Vamos al grano.", "Apertura")

# ───────── 2 · AGENTES PERSONALIZADOS (la órbita de AI Borinquen) ─────────
AGENTES = [("Recepcionista IA", "AutoFlow · atiende 24/7"), ("Agente de ventas", "califica y cierra"), ("Agente de cobros", "recuerda pagos"),
           ("Agente de inventario", "existencias y pedidos"), ("Agente de reactivación", "revive leads dormidos"), ("Agente de reseñas", "cuida tu reputación")]
orb = ""; lineas = ""
for i, (t, d) in enumerate(AGENTES):
    a = -math.pi / 2 + i * 2 * math.pi / len(AGENTES); x = 380 + 300 * math.cos(a); y = 380 + 300 * math.sin(a)
    lineas += f'<line x1="380" y1="380" x2="{x:.0f}" y2="{y:.0f}"/>'
    orb += f'<div class="ancla" style="left:{x:.0f}px;top:{y:.0f}px"><div class="sat pop{" sat-oro" if i == 0 else ""}" style="--d:{0.8 + i * 0.18:.2f}s"><b>{e(t)}</b><span>{e(d)}</span></div></div>'
slide(f'''<div class="izq-metodo">
      <div class="ceja sube">Agentes de IA personalizados</div>
      <h2 class="sube" style="--d:.1s">Primero tu agente.<br><span class="oro">Después, todo lo demás.</span></h2>
      <p class="sube" style="--d:.25s">Tu Agente Personal es tu propio ChatGPT, entrenado 100 % con la información de tu negocio. De él nacen los demás.</p>
    </div>
    <div class="orbita">
      <svg viewBox="0 0 760 760" aria-hidden="true">
        <circle cx="380" cy="380" r="300" fill="none" stroke="rgba(245,206,26,.3)" stroke-width="2" stroke-dasharray="4 12"/>
        <g stroke="rgba(245,206,26,.25)" stroke-width="1.5">{lineas}</g>
      </svg>
      <div class="ancla" style="left:380px;top:380px"><div class="centro-orb pop" style="--d:.4s"><small>TU</small><b>Agente Personal</b><span>tu propio ChatGPT</span></div></div>
      {orb}
    </div>''',
 "Empiezo por lo que hacemos en nuestra empresa de IA, porque cambia cómo se ve un negocio. No vendemos un chatbot. Primero construimos tu Agente Personal: tu propio ChatGPT, entrenado 100% con la información de tu negocio, tus precios, tus reglas y tu forma de hablar. Y de ese agente nacen los demás, uno para cada trabajo: el que atiende, el que vende, el que cobra, el que lleva el inventario, el que revive a los clientes que se quedaron dormidos y el que cuida tus reseñas. Un empleado digital para cada puesto. Y el primero que casi todo negocio necesita es este: la recepcionista.", "Agentes de IA")

# ───────── 3 · AUTOFLOW · RECEPCIONISTA IA (cómo funciona) ─────────
PASOS = [("Contacta", "escribe o llama"), ("Responde", "en segundos"), ("Califica", "entiende qué necesita"),
         ("Agenda", "reserva o cobra"), ("Confirma", "y da seguimiento"), ("Registra", "todo en tu CRM")]
flujo = ""
for i, (t, d) in enumerate(PASOS):
    if i: flujo += f'<i class="aparece" style="--d:{0.55 + i * 0.22:.2f}s">→</i>'
    flujo += f'<div class="nodo6 pop{" oro-borde" if i == 1 else ""}" style="--d:{0.5 + i * 0.22:.2f}s"><small>{i + 1:02d}</small><b>{t}</b><span>{e(d)}</span></div>'
slide(f'''<div class="centro">
      <div class="ceja sube">AutoFlow · Recepcionista IA</div>
      <h2 class="grande sube" style="--d:.1s">Tu recepcionista que <span class="oro">nunca duerme.</span></h2>
      <div class="sub sube" style="--d:.3s">Chat y voz en web, WhatsApp, Instagram, Facebook y llamadas. En español e inglés, con tu marca y tu tono.</div>
      <div class="flujo6">{flujo}</div>
    </div>''',
 "Eso es AutoFlow, nuestra recepcionista con IA. Te la explico rápido, en el orden en que pasa. Un cliente te escribe por WhatsApp, Instagram, Facebook o tu página, o te llama. AutoFlow le responde en segundos, con chat o con voz, en español o en inglés. Lo califica: entiende qué necesita y si está listo. Le agenda la cita en tu calendario, o le cobra. Se la confirma y le da seguimiento para que no te deje plantado, y al que dijo «déjame pensarlo» lo vuelve a buscar. Y todo queda registrado en tu CRM. No es el menú del uno, dos, tres. Es un sistema completo, y tu equipo solo habla con gente calificada y con cita.", "AutoFlow")

# ───────── 4 · TIEMPO DE RESPUESTA ─────────
slide('''<div class="centro">
      <div class="ceja sube">Por qué importa</div>
      <h2 class="mega sube" style="--d:.1s">El que contesta <span class="oro">primero,</span><br>se queda con la venta.</h2>
      <div class="barras-cmp">
        <div class="fila aparece" style="--d:.8s"><span>Una persona</span><div class="barra-larga"><i></i></div><b>horas</b></div>
        <div class="fila aparece" style="--d:1.1s"><span>AutoFlow</span><div class="barra-corta"><i></i></div><b class="oro">segundos</b></div>
      </div>
      <div class="sub sube" style="--d:1.6s">Generar leads es importante. <span class="oro">Convertirlos es más importante.</span></div>
    </div>''',
 "¿Por qué empiezo por aquí? Levanta la mano rápido: ¿quién tiene ahora mismo en el teléfono un mensaje de un cliente nuevo que todavía no ha contestado?… Eso es dinero que se está yendo caminando. Generar leads es importante, pero convertirlos es más importante, y el punto más débil de casi todas las empresas es cuánto tardan en contestar. Muchas veces no le compran al mejor ni al más barato: le compran al primero que contesta. Una persona se tarda horas, porque come, duerme y atiende a otro cliente; y lo que entra de noche y el fin de semana se enfría. AutoFlow contesta en segundos, a las 3 de la tarde o a las 3 de la mañana. [Si te preguntan por estadísticas: no cites porcentajes; quédate con «horas contra segundos».]", "AutoFlow")

# ───────── 5 · IMPLEMENTACIÓN ─────────
FASES_IMP = [("F1 · Días 1–3", "Incorporación", "Reunión de arranque, información, objetivos y casos de uso."),
             ("F2 · Días 4–13", "Configuración", "Entrenamiento del agente y conexión con tus sistemas."),
             ("F3 · Día 15", "En marcha", "Validación final, capacitación de tu equipo y arranque real."),
             ("F4 · Días 16–45", "Optimización", "Ajustes de mensajes, reglas y flujos con conversaciones reales.")]
imp = "".join(f'<div class="fase-imp pop{" oro-borde" if i == 2 else ""}" style="--d:{0.6 + i * 0.25:.2f}s"><small>{f}</small><b>{t}</b><span>{e(d)}</span></div>' for i, (f, t, d) in enumerate(FASES_IMP))
slide(f'''<div class="centro">
      <div class="ceja sube">Cómo se instala</div>
      <h2 class="grande sube" style="--d:.1s">Tu sistema en marcha en <span class="oro">15 días.</span></h2>
      <div class="imp">{imp}</div>
      <div class="sub sube" style="--d:1.8s">Del día 45 en adelante: mantenimiento. Y mientras instalamos, capacitamos a tu gente.</div>
    </div>''',
 "¿Y cuánto toma? Esto no es un proyecto de seis meses. En los primeros tres días nos sentamos contigo: tu información, tus objetivos y qué quieres que haga el agente. Del día 4 al 13 lo entrenamos y lo conectamos con tus sistemas. El día 15 está en marcha, atendiendo clientes reales, y tu equipo ya sabe usarlo. Y del día 16 al 45 lo optimizamos con las conversaciones reales, ajustando mensajes y reglas hasta que quede fino. Del 45 en adelante, mantenimiento.", "AutoFlow")

# ───────── 6 · LO QUE VIENE ─────────
slide('''<div class="centro">
      <div class="ceja sube">Lo que viene</div>
      <h2 class="mega sube" style="--d:.1s">Las empresas se van<br>a mover a esto.</h2>
      <div class="sub sube" style="--d:.6s"><span class="oro">La pregunta es si tú vas primero.</span> Si lo haces igual todos los días, no lo tienes que hacer tú.</div>
    </div>''',
 "Y esto no es moda. Las empresas se van a mover a esto, igual que todo el mundo se movió a las redes sociales. La gente todavía piensa que la IA es un mito o cosa de otro país, y ya está pasando aquí, en negocios de Puerto Rico. La pregunta no es si va a pasar. Es si tú vas a ir primero o vas a llegar cuando tu competencia ya lo tenga. Y la regla es simple: si lo haces igual todos los días, no lo tienes que hacer tú.", "AutoFlow")

# ───────── MARKETING ─────────
slide('''<div class="centro">
      <div class="ceja sube">Marketing</div>
      <h2 class="mega sube" style="--d:.1s">El marketing es <span class="oro">la vena</span><br>de cada negocio.</h2>
      <div class="sub sube" style="--d:.6s">AutoFlow atiende a los clientes. El marketing es lo que los trae.</div>
    </div>''',
 "Ahora, AutoFlow atiende. Pero alguien tiene que traer a esos clientes. Y ahí entra el marketing. El marketing es la vena de cada negocio: si no corre, el negocio se seca, no importa lo bueno que seas. Y lo que más veo son dueños que viven de referidos o que le dan a Promocionar cuando se acuerdan. Si tu plan es que alguien te recomiende, no tienes un plan.", "Marketing")

slide('''<div class="centro">
      <div class="ceja sube">Marketing</div>
      <h2 class="grande sube" style="--d:.1s">No anuncios sueltos.<br><span class="oro">Una estrategia.</span></h2>
      <div class="versus">
        <div class="lado pop" style="--d:.6s"><small>LO QUE CASI TODOS HACEN</small><b>anuncios y estrategias sueltas</b></div>
        <div class="vs aparece" style="--d:.9s">vs.</div>
        <div class="lado oro-borde pop" style="--d:1.1s"><small>LO QUE FUNCIONA</small><b>una estrategia concreta, validada y aprobada</b></div>
      </div>
    </div>''',
 "Lo más importante en el marketing es tener una estrategia. No anuncios sueltos, no un poquito de aquí y un poquito de allá, sino una estrategia concreta, ya validada y aprobada, que sabes que funciona antes de meterle el dinero. Darle al botón azul sin estrategia es la forma más cara de tirar dinero. No porque Facebook no funcione, sino porque no hay nada detrás.", "Marketing")

# motor de 5 fases (mismo dibujo que la demo)
FASES = [("01", "Enganchar", "Captar la atención del cliente ideal."), ("02", "Solucionar", "Mostrar que resuelves su problema."),
         ("03", "Envolver", "Conectar emocionalmente con la marca."), ("04", "Fidelizar", "Retener y cuidar al cliente."), ("05", "Reproducir", "Escalar lo que ya funciona.")]
rayos = ""; fases = ""
for i, (n, t, d) in enumerate(FASES):
    a = -math.pi / 2 + i * 2 * math.pi / 5; x = 400 + 300 * math.cos(a); y = 400 + 300 * math.sin(a)
    rayos += f'<line x1="400" y1="400" x2="{x:.0f}" y2="{y:.0f}"/>'
    c = math.cos(a)
    st = "left:30px;top:-30px;text-align:left" if c > .2 else "left:-280px;top:-30px;text-align:right" if c < -.2 else "left:-125px;top:-150px;text-align:center"
    if y > 600: st = st.replace("top:-30px", "top:24px")
    fases += f'<div class="fase pop" style="left:{x:.0f}px;top:{y:.0f}px;--d:{0.9 + i * 0.3:.1f}s"><i></i><div style="{st}"><small>{n}</small><b>{t}</b><span>{d}</span></div></div>'
slide(f'''<div class="izq-metodo">
      <div class="ceja sube">Marketing · la estrategia</div>
      <h2 class="sube" style="--d:.1s">El motor de <span class="oro">crecimiento</span></h2>
      <p class="sube" style="--d:.25s">La estrategia validada: cinco fases que convierten a un desconocido en cliente que vuelve, con la automatización en el centro.</p>
    </div>
    <div class="motor">
      <svg viewBox="0 0 800 800" aria-hidden="true">
        <circle cx="400" cy="400" r="370" fill="none" stroke="rgba(245,206,26,.10)" stroke-width="1.5"/>
        <circle class="punteado" cx="400" cy="400" r="300" fill="none" stroke="rgba(245,206,26,.3)" stroke-width="2" stroke-dasharray="4 12"/>
        <circle class="aro" cx="400" cy="400" r="300" fill="none" stroke="#f5ce1a" stroke-width="3" transform="rotate(-90 400 400)"/>
        <g stroke="rgba(245,206,26,.3)" stroke-width="1.5">{rayos}</g>
      </svg>
      <div class="chispa"></div>
      <div class="nucleo pop" style="--d:.3s"><small>NÚCLEO</small><b>Automatizar</b></div>
      {fases}
    </div>''',
 "Esta es nuestra estrategia, y ya está validada con más de 100 negocios en Puerto Rico. Son cinco fases. Enganchar: captar la atención de tu cliente ideal, no de todo el mundo. Solucionar: mostrarle que tú resuelves su problema. Envolver: que conecte con tu marca y confíe. Fidelizar: cuidar al que ya te compró, porque ahí está el dinero que casi todos dejan en la mesa. Y Reproducir: escalar lo que ya funciona, subiendo la inversión poco a poco y vigilando las ventas reales, no los leads baratos. ¿Y qué hay en el centro? Automatizar. Ahí es donde entra AutoFlow.", "Marketing")

# ───────── 10 · EL ECOSISTEMA Y CIERRE ─────────
slide('''<div class="centro">
      <div class="ceja sube">El ecosistema completo</div>
      <h2 class="grande sube" style="--d:.1s">Las conversaciones son <span class="oro">dinero.</span></h2>
      <div class="eco">
        <div class="eco-pieza pop" style="--d:.5s"><small>MARKETING</small><b>consigue los clientes</b><span>una estrategia validada</span></div>
        <div class="eco-mas aparece" style="--d:.8s">+</div>
        <div class="eco-pieza pop" style="--d:1s"><small>AUTOFLOW</small><b>los atiende</b><span>responde, califica, agenda y da seguimiento</span></div>
        <div class="eco-mas aparece" style="--d:1.3s">=</div>
        <div class="eco-pieza oro-fondo pop" style="--d:1.5s"><small>TU NEGOCIO</small><b>predecible</b><span>un sistema que no depende de la suerte</span></div>
      </div>
      <img class="logo-cierre aparece" style="--d:1.9s" src="logo.png" alt="Level Up Media">
    </div>''',
 "Y aquí está la idea de hoy en una sola pantalla. Todo dueño de negocio puede tener un sistema predecible: marketing que te consigue los clientes, con una estrategia validada, más AutoFlow, que los atiende, los califica, les agenda y les da seguimiento. Eso es un ecosistema completo. Si tienes solo el marketing, pagas por clientes que nadie contesta. Si tienes solo la automatización, no tiene a quién atender. Juntos, dejas de depender de la suerte. Te dejo una tarea para esta noche: escríbele a tu propio negocio como si fueras un cliente nuevo y cuenta cuánto tardan en responderte. Si quieres ver cómo se vería esto en tu negocio, búscame [di tu Instagram o la palabra clave]. Las conversaciones son dinero. Gracias.", "Cierre")

# ───────── Armar ─────────
N = len(S)
secciones = ""
for i, (cuerpo, notas, bloque) in enumerate(S):
    secciones += f'''
    <section class="slide{' activa' if i == 0 else ''}" id="s{i + 1}" data-bloque="{e(bloque)}" data-notas="{e(notas)}">
      {'' if i in (0,) else '<img class="logo-esq" src="logo.png" alt="">'}
      {cuerpo}
      <div class="pie"><span>{e(bloque)}</span><span>{i + 1:02d} / {N:02d}</span></div>
    </section>'''

extra = r'''
/* ───── Charla ───── */
.centro { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; text-align: center; padding: 0 140px; }
.mega { font-size: 120px; line-height: 1.02; }
.grande { font-size: 84px; line-height: 1.06; }
.sub { font-family: var(--sora); font-size: 32px; color: var(--gris); max-width: 1300px; }
.firma { font-family: var(--mono); font-size: 22px; letter-spacing: .26em; color: var(--oro); text-transform: uppercase; }
.logo-grande { width: 360px; }
.cita { font-family: var(--sora); font-weight: 800; font-size: 108px; line-height: 1.08; letter-spacing: -.03em; max-width: 1500px; text-wrap: balance; }
.linea-tiempo { display: flex; gap: 70px; margin-top: 30px; }
.hito { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 330px; border-top: 3px solid var(--oro); padding-top: 22px; }
.hito b { font-family: var(--sora); font-size: 64px; }
.hito span { font-size: 24px; color: var(--gris); }
.dos-col { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 90px; padding: 0 140px; }
.col-txt { flex: 1; max-width: 860px; display: flex; flex-direction: column; gap: 26px; }
.col-txt h2 { font-size: 80px; line-height: 1.06; }
.col-txt p { font-family: var(--sora); font-size: 30px; color: var(--gris); margin: 0; line-height: 1.4; }
.vid { position: relative; flex: none; border-radius: 26px; overflow: hidden; border: 2px solid rgba(245,206,26,.45); box-shadow: 0 40px 120px rgba(0,0,0,.6); background: #000; cursor: pointer; }
.vid video { width: 100%; height: 100%; object-fit: cover; display: block; }
.vid .vplay { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,.25); transition: opacity .3s; }
.vid.reproduciendo .vplay { opacity: 0; pointer-events: none; }
.vid .vplay .play { position: relative; left: auto; top: auto; margin: 0; width: 110px; height: 110px; }
.vtag { position: absolute; left: 14px; bottom: 14px; font-family: var(--mono); font-size: 15px; letter-spacing: .1em; color: var(--texto); background: rgba(11,11,11,.7); padding: 5px 10px; border-radius: 8px; }
.vid.reproduciendo .vtag { opacity: 0; }
.cadena { display: flex; align-items: center; gap: 26px; margin-top: 20px; }
.eslabon { width: 380px; padding: 30px; border-radius: 24px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 8px; }
.eslabon small { font-family: var(--mono); color: var(--oro); font-size: 18px; letter-spacing: .2em; }
.eslabon b { font-family: var(--sora); font-size: 44px; }
.eslabon span { color: var(--gris); font-size: 22px; }
.flecha { font-size: 60px; color: var(--oro); }
.ecuacion { display: flex; align-items: center; gap: 30px; font-family: var(--sora); font-weight: 800; font-size: 64px; letter-spacing: .04em; margin-top: 20px; }
.ecuacion span { padding: 16px 34px; border-radius: 18px; border: 2px solid var(--borde); }
.ecuacion i { font-style: normal; color: var(--oro); }
.oro-fondo { background: var(--oro); color: #0b0b0b; border-color: var(--oro) !important; }
.lista4 { flex: 1; max-width: 760px; display: flex; flex-direction: column; gap: 18px; }
.item { display: flex; gap: 22px; align-items: center; padding: 24px 28px; border-radius: 20px; background: var(--superficie); border: 1px solid var(--borde); }
.item b { font-family: var(--mono); font-size: 24px; color: var(--oro); }
.item span { font-size: 26px; color: var(--gris); line-height: 1.35; }
.item strong { color: var(--texto); font-family: var(--sora); }
.versus { display: flex; align-items: center; gap: 40px; margin-top: 20px; }
.lado { width: 520px; padding: 34px; border-radius: 24px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 10px; }
.lado small { font-family: var(--mono); font-size: 20px; letter-spacing: .24em; color: var(--gris); }
.lado b { font-family: var(--sora); font-size: 42px; }
.oro-borde { border: 2px solid var(--oro) !important; box-shadow: 0 0 50px rgba(245,206,26,.15); }
.oro-borde small { color: var(--oro); }
.vs { font-family: var(--sora); font-size: 40px; color: var(--gris); }
.dato-pie { font-family: var(--sora); font-size: 34px; margin-top: 10px; }
.izq-metodo { position: absolute; left: 110px; top: 340px; width: 600px; display: flex; flex-direction: column; gap: 22px; }
.izq-metodo h2 { font-size: 80px; }
.izq-metodo p { font-size: 28px; line-height: 1.45; color: var(--gris); margin: 0; }
.embudo { display: flex; gap: 22px; margin-top: 20px; }
.paso { width: 330px; padding: 28px; border-radius: 22px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 6px; }
.paso b { font-family: var(--sora); font-size: 40px; }
.paso span { color: var(--gris); font-size: 22px; }
.reloj { width: 120px; height: 160px; position: relative; }
.reloj .arena { position: absolute; inset: 0; border: 4px solid var(--oro); border-radius: 12px; clip-path: polygon(0 0, 100% 0, 55% 50%, 100% 100%, 0 100%, 45% 50%); background: linear-gradient(180deg, rgba(245,206,26,.6) 0%, rgba(245,206,26,.6) 30%, transparent 30%, transparent 70%, rgba(245,206,26,.6) 70%); }
.activa .reloj { animation: gira-reloj 3s ease-in-out infinite; }
@keyframes gira-reloj { 0%, 70% { transform: rotate(0); } 85%, 100% { transform: rotate(180deg); } }
.votos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 16px; width: 1500px; }
.voto { padding: 30px 20px; border-radius: 20px; background: var(--superficie); border: 1px solid var(--borde); font-family: var(--sora); font-size: 30px; font-weight: 700; }
.voto.rojo { border-color: #ff5a4e; color: #ff8d84; }
.barras-cmp { display: flex; flex-direction: column; gap: 26px; width: 1300px; margin-top: 20px; }
.barras-cmp .fila { display: grid; grid-template-columns: 240px 1fr 200px; align-items: center; gap: 24px; font-family: var(--sora); font-size: 32px; text-align: left; }
.barras-cmp span { color: var(--gris); }
.barras-cmp b { font-size: 40px; }
.barra-larga, .barra-corta { height: 26px; border-radius: 13px; background: var(--superficie2); overflow: hidden; }
.barra-larga i, .barra-corta i { display: block; height: 100%; border-radius: 13px; }
.barra-larga i { background: #6b675d; width: 0; }
.barra-corta i { background: var(--oro); width: 0; }
.activa .barra-larga i { animation: llena 2.6s cubic-bezier(.4,.1,.2,1) 1s forwards; }
.activa .barra-corta i { animation: llena-c .5s ease 1.4s forwards; }
@keyframes llena { to { width: 100%; } }
@keyframes llena-c { to { width: 4%; } }
.flujo { display: flex; align-items: center; gap: 18px; margin-top: 20px; }
.flujo i { font-style: normal; color: var(--oro); font-size: 44px; }
.nodo { width: 300px; padding: 26px; border-radius: 22px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 6px; }
.nodo b { font-family: var(--sora); font-size: 34px; }
.nodo span { color: var(--gris); font-size: 21px; }
.tres-iconos { display: flex; gap: 30px; margin-top: 10px; }
.ico { width: 300px; padding: 30px; border-radius: 22px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 6px; }
.ico b { font-family: var(--sora); font-size: 46px; color: var(--oro); }
.ico span { color: var(--gris); font-size: 22px; }
.organigrama { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; max-width: 1500px; }
.puesto { padding: 22px 34px; border-radius: 999px; border: 2px solid rgba(245,206,26,.5); font-family: var(--sora); font-size: 30px; font-weight: 700; }
.grid-casos { position: absolute; left: 90px; right: 90px; top: 290px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; }
.mini { background: var(--superficie); border: 1px solid var(--borde); border-radius: 18px; overflow: hidden; display: flex; flex-direction: column; }
.mini img { width: 100%; height: 150px; object-fit: cover; object-position: top left; background: #fff; }
.mini b { font-family: var(--sora); font-size: 21px; padding: 14px 18px 0; }
.mini span { font-family: var(--sora); font-weight: 800; font-size: 32px; color: var(--oro); padding: 4px 18px 18px; }
.cien { font-family: var(--sora); font-weight: 800; font-size: 150px; color: var(--oro); line-height: 1; letter-spacing: -.04em; }
.cien small { display: block; font-family: var(--mono); font-weight: 400; font-size: 22px; letter-spacing: .24em; color: var(--gris); text-transform: uppercase; margin-top: 8px; }
.preguntas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: 1600px; }
.preg { padding: 30px; border-radius: 22px; background: var(--superficie); border: 1px solid var(--borde); text-align: left; display: flex; flex-direction: column; gap: 10px; }
.preg b { font-family: var(--mono); font-size: 20px; letter-spacing: .2em; color: var(--oro); text-transform: uppercase; }
.preg span { font-family: var(--sora); font-size: 34px; font-weight: 700; line-height: 1.25; }
.tarea { max-width: 1400px; padding: 26px 36px; border-radius: 20px; background: var(--oro); color: #0b0b0b; font-family: var(--sora); font-size: 30px; line-height: 1.35; }
.logo-cierre { width: 260px; margin-top: 10px; }
.cita-chica { font-family: var(--sora); font-weight: 800; font-size: 44px; line-height: 1.18; letter-spacing: -.02em; border-left: 4px solid var(--oro); padding-left: 26px; }
.cita-chica small { display: block; font-family: var(--inter); font-weight: 400; font-size: 21px; letter-spacing: 0; color: var(--gris); margin-top: 12px; line-height: 1.4; }
.pasos6 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; width: 1500px; margin-top: 10px; }
.paso6 { text-align: left; padding: 26px 30px; border-radius: 22px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 6px; }
.paso6 small { font-family: var(--mono); color: var(--oro); font-size: 18px; letter-spacing: .2em; }
.paso6 b { font-family: var(--sora); font-size: 40px; }
.paso6 span { color: var(--gris); font-size: 23px; }
.eco { display: flex; align-items: stretch; gap: 22px; margin-top: 20px; }
.eco-pieza { width: 420px; padding: 32px; border-radius: 24px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 8px; text-align: left; }
.eco-pieza small { font-family: var(--mono); font-size: 18px; letter-spacing: .22em; color: var(--oro); }
.eco-pieza b { font-family: var(--sora); font-size: 42px; line-height: 1.1; }
.eco-pieza span { font-size: 23px; color: var(--gris); line-height: 1.35; }
.eco-pieza.oro-fondo { background: var(--oro); border-color: var(--oro); color: #0b0b0b; box-shadow: 0 0 60px rgba(245,206,26,.25); }
.eco-pieza.oro-fondo small, .eco-pieza.oro-fondo span, .eco-pieza.oro-fondo b { color: #0b0b0b; }
.eco-mas { align-self: center; font-family: var(--sora); font-size: 64px; color: var(--oro); }
.orbita { position: absolute; right: 190px; top: 170px; width: 760px; height: 760px; }
.orbita svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.ancla { position: absolute; width: 0; height: 0; display: flex; align-items: center; justify-content: center; }
.centro-orb { flex: none; width: 250px; height: 250px; border-radius: 50%; background: var(--oro); color: #0b0b0b; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; box-shadow: 0 0 90px rgba(245,206,26,.35); }
.centro-orb small { font-family: var(--mono); font-size: 16px; letter-spacing: .24em; }
.centro-orb b { font-family: var(--sora); font-size: 34px; line-height: 1.05; }
.centro-orb span { font-size: 19px; }
.sat { flex: none; width: 230px; padding: 16px 18px; border-radius: 18px; background: var(--superficie); border: 1px solid var(--borde); text-align: center; display: flex; flex-direction: column; gap: 4px; }
.sat b { font-family: var(--sora); font-size: 22px; line-height: 1.15; }
.sat span { font-size: 17px; color: var(--gris); }
.sat-oro { border: 2px solid var(--oro); box-shadow: 0 0 50px rgba(245,206,26,.2); }
.sat-oro b { color: var(--oro); }
.flujo6 { display: flex; align-items: center; gap: 12px; margin-top: 18px; }
.flujo6 i { font-style: normal; color: var(--oro); font-size: 34px; }
.nodo6 { width: 222px; padding: 22px 20px; border-radius: 20px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 6px; text-align: left; }
.nodo6 small { font-family: var(--mono); color: var(--oro); font-size: 16px; letter-spacing: .2em; }
.nodo6 b { font-family: var(--sora); font-size: 32px; }
.nodo6 span { color: var(--gris); font-size: 20px; line-height: 1.3; }
.imp { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; width: 1600px; margin-top: 10px; }
.fase-imp { text-align: left; padding: 26px 28px; border-radius: 22px; background: var(--superficie); border: 1px solid var(--borde); display: flex; flex-direction: column; gap: 8px; }
.fase-imp small { font-family: var(--mono); color: var(--oro); font-size: 17px; letter-spacing: .16em; text-transform: uppercase; }
.fase-imp b { font-family: var(--sora); font-size: 38px; }
.fase-imp span { color: var(--gris); font-size: 22px; line-height: 1.35; }
/* Panel de notas del speaker (tecla N) */
.notas { position: fixed; left: 16px; right: 16px; bottom: 76px; z-index: 30; max-height: 42vh; overflow: auto; background: rgba(15,14,12,.97); border: 1px solid rgba(245,206,26,.5); border-radius: 16px; padding: 18px 22px; color: var(--texto); font: 400 19px/1.5 var(--inter); box-shadow: 0 20px 60px rgba(0,0,0,.6); }
.notas header { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-family: var(--mono); font-size: 13px; letter-spacing: .14em; color: var(--oro); text-transform: uppercase; margin-bottom: 8px; }
.notas header button { background: none; border: 1px solid var(--borde); color: var(--texto); border-radius: 8px; width: 30px; height: 30px; cursor: pointer; }
.notas .sig { margin-top: 10px; font-size: 14px; color: var(--gris); }
'''

atajo = r'''
  // Videos dentro de las slides: tocar = reproducir/pausar (no avanza la slide)
  document.querySelectorAll(".vid").forEach((v) => {
    const el = v.querySelector("video");
    v.addEventListener("click", (ev) => { ev.stopPropagation(); if (el.paused) { el.play().catch(() => {}); v.classList.add("reproduciendo"); } else { el.pause(); v.classList.remove("reproduciendo"); } });
    el.addEventListener("ended", () => v.classList.remove("reproduciendo"));
  });
  // Solo toca los que están sonando: quitar una clase que no está igual "cambia" el atributo y el observador entraba en bucle
  const pararVideos = () => document.querySelectorAll(".vid.reproduciendo").forEach((v) => { v.querySelector("video").pause(); v.classList.remove("reproduciendo"); });
  // Notas del speaker (N) con reloj de la charla
  const panel = document.getElementById("notas"), notasTxt = document.getElementById("notasTxt"), notasMeta = document.getElementById("notasMeta"), notasSig = document.getElementById("notasSig");
  let t0 = null;
  const pintarNotas = () => {
    const s = document.querySelector(".slide.activa"); if (!s) return;
    const i = [...document.querySelectorAll(".slide")].indexOf(s);
    const sig = document.querySelectorAll(".slide")[i + 1];
    notasTxt.textContent = s.dataset.notas || "";
    const m = t0 ? Math.floor((Date.now() - t0) / 60000) : 0, sg = t0 ? Math.floor((Date.now() - t0) / 1000) % 60 : 0;
    notasMeta.textContent = `${s.dataset.bloque} · slide ${i + 1} · ${String(m).padStart(2, "0")}:${String(sg).padStart(2, "0")}`;
    notasSig.textContent = sig ? "Sigue: " + (sig.dataset.notas || "").slice(0, 90) + "…" : "Última slide.";
  };
  setInterval(() => { if (!panel.hidden) pintarNotas(); }, 1000);
  document.getElementById("notasCerrar").addEventListener("click", (ev) => { ev.stopPropagation(); panel.hidden = true; });
  panel.addEventListener("click", (ev) => ev.stopPropagation());
  window.addEventListener("keydown", (ev) => { if (ev.key === "n" || ev.key === "N") { panel.hidden = !panel.hidden; if (!t0) t0 = Date.now(); pintarNotas(); } }, true);
  // Al cambiar de slide: pausar lo que suene y refrescar las notas (solo mira las slides, no los videos)
  let ultima = document.querySelector(".slide.activa");
  new MutationObserver(() => {
    const s = document.querySelector(".slide.activa");
    if (s && s !== ultima) { ultima = s; pararVideos(); if (!panel.hidden) pintarNotas(); }
  }).observe(document.getElementById("escenario"), { subtree: true, attributes: true, attributeFilter: ["class"] });
'''
script2 = script.replace("  let x0 = null;", atajo + "\n  let x0 = null;", 1)
script2 = script2.replace("/^#s(\\d)$/", "/^#s(\\d+)$/")

pagina = f'''<title>Las conversaciones son dinero</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>{estilo}{extra}</style>

<div id="visor">
  <div id="escenario">{secciones}
    <div class="cine" id="cine" hidden><video id="cineVideo" controls playsinline preload="metadata"></video><button type="button" class="cerrar" id="cineCerrar" aria-label="Cerrar video">✕</button></div>
  </div>
</div>

<div class="notas" id="notas" hidden><header><span id="notasMeta"></span><button type="button" id="notasCerrar" aria-label="Cerrar notas">✕</button></header><div id="notasTxt"></div><div class="sig" id="notasSig"></div></div>
<div class="girar" id="girar"><span>📱 <b>Gira el teléfono</b> para verla en grande. Toca a la derecha para avanzar.</span><button type="button" id="cerrarGirar" aria-label="Cerrar aviso">✕</button></div>
<div class="progreso" aria-hidden="true"><i id="barra"></i></div>
<div class="controles" id="controles">
  <button type="button" id="btnAnt" aria-label="Slide anterior">‹</button>
  <span class="pag" id="pag">1 / {N}</span>
  <button type="button" id="btnSig" aria-label="Slide siguiente">›</button>
  <button type="button" id="btnRep" aria-label="Repetir la animación" title="Repetir animación (R)">↻</button>
  <button type="button" id="btnFull" aria-label="Pantalla completa" title="Pantalla completa (F)">⛶</button>
</div>

<script>{script2}</script>
'''
(AQUI / "index.html").write_text(pagina)
print(N, "slides")

# Guion para el celular (notas.html): slide por slide, lo que dice Elvin
filas = ""
for i, (cuerpo, notas, bloque) in enumerate(S):
    titulo = re.sub(r"<[^>]+>", "", re.search(r"<h[12][^>]*>(.*?)</h[12]>|<div class=\"cita[^>]*>(.*?)</div>", cuerpo, re.S).group(0)).strip()
    filas += f'<article><header><span>{i + 1:02d} · {e(bloque)}</span><a href="index.html#s{i + 1}">abrir slide</a></header><h2>{e(titulo)}</h2><p>{e(notas)}</p></article>\n'
notas_html = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex,nofollow">
<title>Guion · Las conversaciones son dinero</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@600;800&family=Inter:wght@400;500&display=swap">
<style>:root{{color-scheme:dark}}body{{margin:0;background:#0b0b0b;color:#f5f1e8;font:400 18px/1.55 Inter,Arial,sans-serif;padding:24px 16px 60px}}
main{{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:16px}}h1{{font:800 30px/1.1 Sora,Arial,sans-serif;margin:0}}h1 span{{color:#f5ce1a}}
.intro{{color:#a3a097;font-size:15px}}article{{background:#141311;border:1px solid #2c2a24;border-radius:16px;padding:16px 18px}}
article header{{display:flex;justify-content:space-between;gap:10px;font:500 12px/1 monospace;letter-spacing:.14em;color:#f5ce1a;text-transform:uppercase}}
article header a{{color:#a3a097}}article h2{{font:800 20px/1.25 Sora,Arial,sans-serif;margin:10px 0 6px}}article p{{margin:0}}</style></head><body><main>
<h1>Las conversaciones son <span>dinero.</span></h1><div class="intro">Guion de Elvin · {N} slides · ~15–20 min. Lo que va entre [corchetes] es una indicación para ti, no se dice.</div>
{filas}</main></body></html>'''
(AQUI / "notas.html").write_text(notas_html)
print("notas.html listo")

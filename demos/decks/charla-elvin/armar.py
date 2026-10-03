#!/usr/bin/env python3
# Arma la charla "Las conversaciones son dinero" (Elvin · Level Up Media) desde el guion revisado.
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

# ───────── BLOQUE 1 · APERTURA ─────────
slide('''<div class="centro">
      <img class="logo-grande pop" src="logo.png" alt="Level Up Media">
      <h1 class="mega sube" style="--d:.35s">Las conversaciones<br>son <span class="oro">dinero.</span></h1>
      <div class="sub sube" style="--d:.55s">Marca, mercadeo y automatización: el sistema que trabaja mientras tú duermes.</div>
      <div class="firma sube" style="--d:.75s">Elvin Ayala · CEO, Level Up Media</div>
    </div>''',
 "Buenas. Primero, gracias por la invitación [di el nombre del evento y de quien te invitó]. Te voy a confesar algo antes de empezar: esta es la primera vez que me paro en una tarima como speaker. Y si me ves un poquito nervioso, es real. En los próximos 30 minutos te voy a hablar de tres cosas: marca, mercadeo y automatización. No te voy a dar teoría. Te voy a dar lo que hemos visto funcionar con negocios de aquí, de Puerto Rico, con nombres y con números.", "Apertura")

slide('''<div class="centro">
      <div class="cita sube">«Yo he sido un <span class="oro">fantasma</span>.»</div>
      <div class="linea-tiempo">
        <div class="hito pop" style="--d:.6s"><b>2021</b><span>Empecé a aprender marketing y ventas</span></div>
        <div class="hito pop" style="--d:.85s"><b>2024</b><span>Nace Level Up Media</span></div>
        <div class="hito pop" style="--d:1.1s"><b class="oro">+100</b><span>negocios en Puerto Rico</span></div>
      </div>
    </div>''',
 "Yo he sido un fantasma. Alguna gente me conoce, pero públicamente no. Yo era el que hacía los anuncios, el que estaba detrás, no la cara del negocio. Desde el 2021 estoy aprendiendo y practicando marketing y ventas, y en el 2024 nace Level Up Media. Y te digo la verdad: yo no crecí hasta que empecé a asociarme, a pagar mentorías y a invertir en sistemas y procesos. Hoy hemos trabajado con más de 100 negocios en Puerto Rico. Todo lo que te voy a enseñar lo aprendí haciéndolo, equivocándome y midiendo.", "Apertura")

slide(f'''<div class="dos-col">
      <div class="col-txt">
        <div class="ceja sube">Dr. Bryan Vega · Quiropráctico · Aguada</div>
        <h2 class="sube" style="--d:.1s">«Yo tenía <span class="oro">miedo</span>.»</h2>
        <p class="sube" style="--d:.25s">No sabía si iba a tener pacientes.</p>
      </div>
      {video("bryan-miedo.mp4", "bryan-miedo.jpg", etiqueta="0:22 · toca para reproducir")}
    </div>''',
 "[Pon el video: toca la pantalla del video.] Después del clip: Ese es el Dr. Bryan Vega, quiropráctico en Aguada. Cuando lo conocí no había abierto su oficina. Tenía miedo de abrir y que no llegara nadie. Y ese miedo lo tiene casi todo dueño de negocio que conozco: no saber si el mes que viene va a entrar gente. Lo que le cambió la historia no fue suerte ni un anuncio bonito. Fue montar un sistema desde el día uno. De eso se trata esta charla.", "Apertura")

slide('''<div class="centro">
      <h2 class="mega sube">No es suerte. <span class="oro">Es sistema.</span></h2>
      <div class="cadena">
        <div class="eslabon pop" style="--d:.5s"><small>01</small><b>Marca</b><span>A quién le hablas</span></div>
        <div class="flecha aparece" style="--d:.8s">→</div>
        <div class="eslabon pop" style="--d:1s"><small>02</small><b>Mercadeo</b><span>Que te vean, con estrategia</span></div>
        <div class="flecha aparece" style="--d:1.3s">→</div>
        <div class="eslabon pop" style="--d:1.5s"><small>03</small><b>Automatización</b><span>Qué pasa cuando te escriben</span></div>
      </div>
    </div>''',
 "Te voy a dar el mapa de hoy. Un negocio que crece de forma predecible tiene tres piezas. Primero, marca: a quién le hablas y qué le prometes. Segundo, mercadeo: cómo haces que esa persona te vea todos los días, con estrategia y no con suerte. Y tercero, automatización: qué pasa cuando esa persona por fin te escribe. La mayoría de los negocios tiene una o dos. Casi nadie tiene las tres conectadas. Y cuando una falla, se cae todo. Esto es más estratégico que técnico.", "Apertura")

# ───────── BLOQUE 2 · MARCA ─────────
slide('''<div class="centro">
      <div class="ceja sube">Marca</div>
      <h2 class="grande sube" style="--d:.1s">Cuando le hablas a todos,<br><span class="oro">no le hablas a nadie.</span></h2>
      <div class="ecuacion">
        <span class="pop" style="--d:.7s">DOLOR</span><i class="aparece" style="--d:.9s">+</i><span class="pop" style="--d:1.1s">DINERO</span><i class="aparece" style="--d:1.3s">=</i><span class="pop oro-fondo" style="--d:1.5s">NICHO</span>
      </div>
    </div>''',
 "El error número uno que veo es querer hablarle a todo el mundo. Cuando le hablas a todos, no le hablas a nadie. Un buen nicho tiene dos cosas: dolor y dinero. Un problema real y urgente, y gente dispuesta y capaz de pagar por resolverlo. Y suena al revés, pero mientras más caro el nicho, más fácil se vuelve todo lo demás: la oferta, el contenido y la venta. Uno de mis mentores me lo dijo claro: la manera de no atraer leads malos es no hablarle al cliente promedio en tu contenido.", "Marca")

slide('''<div class="dos-col">
      <div class="col-txt">
        <div class="ceja sube">Marca</div>
        <h2 class="sube" style="--d:.1s">Casi nadie tiene una <span class="oro">buena oferta.</span></h2>
        <p class="sube" style="--d:.25s">Si la persona entiende el valor, le suena barato. Si no lo entiende, te dice que es caro.</p>
      </div>
      <div class="lista4">
        <div class="item sube" style="--d:.5s"><b>01</b><span><strong>La promesa</strong> · «te llevo de aquí a aquí»</span></div>
        <div class="item sube" style="--d:.75s"><b>02</b><span><strong>El valor empaquetado</strong> · piezas que juntas valen más que el precio</span></div>
        <div class="item sube" style="--d:1s"><b>03</b><span><strong>La credibilidad</strong> · casos y testimonios</span></div>
        <div class="item sube" style="--d:1.25s"><b>04</b><span><strong>La reducción de riesgo</strong> · todo lo que le quita el miedo a comprar</span></div>
      </div>
    </div>''',
 "Puedes tener el mejor tráfico y el mejor embudo, pero si la oferta es débil no vas a vender. Y casi nadie tiene una buena oferta. Una oferta no es tu producto: es todo lo que la persona recibe a cambio de su dinero, bien empaquetado. Tiene cuatro ingredientes. La promesa: a dónde llega tu cliente. El valor empaquetado: varias piezas que juntas valen más que el precio. La credibilidad: casos y testimonios. Y la reducción de riesgo: todo lo que le quita el miedo a comprar.", "Marca")

slide('''<div class="centro">
      <div class="ceja sube">Marca</div>
      <h2 class="grande sube" style="--d:.1s">En Puerto Rico,<br>la gente <span class="oro">huele lo falso.</span></h2>
      <div class="versus">
        <div class="lado pop" style="--d:.6s"><small>LA IA</small><b>para el copy</b></div>
        <div class="vs aparece" style="--d:.9s">·</div>
        <div class="lado oro-borde pop" style="--d:1.1s"><small>LO REAL</small><b>para la conversión</b></div>
      </div>
    </div>''',
 "Nosotros somos una empresa AI first: todo lo que hacemos se apoya en inteligencia artificial. Pero aprendimos algo a golpes. Cuando le pusimos imágenes hechas con IA a un negocio de aquí, con cocinas que se veían de Estados Unidos, el puertorriqueño lo detectó y no convirtió. Lo que bajó el costo por lead fue la foto y el video reales: el trabajo, el equipo, el dueño hablando a cámara. En un negocio de property management, con video real, llegamos a $4.25 por lead. La IA te ayuda a escribir. La verdad es la que vende.", "Marca")

# ───────── BLOQUE 3 · MERCADEO ─────────
slide(f'''<div class="dos-col">
      <div class="col-txt">
        <div class="ceja sube">Mercadeo</div>
        <h2 class="sube" style="--d:.1s">Si tu plan es que alguien te recomiende, <span class="oro">no tienes un plan.</span></h2>
        <p class="sube" style="--d:.25s">Robert · RK Automatic Transmission · Caguas</p>
      </div>
      {video("robert.mp4", "robert.jpg", 560, 560, "0:09 · toca para reproducir")}
    </div>''',
 "Levanta la mano si tu negocio vive mayormente de referidos… Bien. Los referidos son una bendición, pero no son un plan. Si tu plan para conseguir clientes es que alguien te recomiende, lo que tienes es suerte, y la suerte se acaba. Si mañana se secan los referidos, ¿cuántos clientes te quedan? Robert, de RK Transmission en Caguas, vivía de recomendaciones. Escúchalo a él. [Pon el video.] No es que los referidos se fueran. Es que dejó de depender de ellos.", "Mercadeo")

slide('''<div class="centro">
      <div class="ceja sube">Mercadeo</div>
      <h2 class="grande sube" style="--d:.1s">Promocionar <span class="oro">no es una estrategia.</span></h2>
      <div class="versus">
        <div class="lado pop" style="--d:.6s"><small>EL BOTÓN AZUL</small><b>lotería</b></div>
        <div class="vs aparece" style="--d:.9s">vs.</div>
        <div class="lado oro-borde pop" style="--d:1.1s"><small>UN SISTEMA</small><b>tráfico + ventas + automatización</b></div>
      </div>
      <div class="dato-pie sube" style="--d:1.5s">Tinos · Cabo Rojo · <span class="oro">$30K → $100K</span> al mes</div>
    </div>''',
 "Muchos dueños me dicen: «yo mismo le doy a Promocionar». Darle al botón azul es la forma más cara de tirar dinero. No porque Facebook no funcione, sino porque no hay estrategia detrás. Te lo pongo con un caso. Oliver Santiago tiene Tinos, un restaurante en Cabo Rojo, y pasó de facturar $30K a $100K al mes. ¿Cómo? No fue un anuncio. Fue un sistema: oferta, estrategia, anuncios con IA, automatización de los leads y escalar lo que funciona. Eso es lo que vendemos: sistema, no marketing suelto.", "Mercadeo")

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
      <div class="ceja sube">Mercadeo · el método</div>
      <h2 class="sube" style="--d:.1s">El motor de <span class="oro">crecimiento</span></h2>
      <p class="sube" style="--d:.25s">Cinco fases que convierten a un desconocido en cliente que vuelve — y luego lo automatizan para escalar.</p>
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
 "Este es nuestro método, y son cinco fases. Enganchar: captar la atención de tu cliente ideal, no de todo el mundo. Solucionar: mostrarle que tú resuelves su problema. Envolver: que conecte emocionalmente con tu marca, que confíe. Fidelizar: retener y cuidar al que ya te compró, porque ahí está el dinero que casi todos dejan en la mesa. Y Reproducir: escalar lo que ya funciona. ¿Y qué hay en el centro? Automatizar. Porque si cada fase depende de que tú estés pendiente, el motor se apaga el día que te cansas.", "Mercadeo")

slide('''<div class="centro">
      <div class="ceja sube">Mercadeo</div>
      <h2 class="grande sube" style="--d:.1s">Los anuncios son <span class="oro">potenciador,</span><br>no principal.</h2>
      <div class="embudo">
        <div class="paso pop" style="--d:.6s"><b>El reel</b><span>te trae seguidores</span></div>
        <div class="paso pop" style="--d:.85s"><b>El carrusel</b><span>calienta</span></div>
        <div class="paso pop" style="--d:1.1s"><b>La historia</b><span>cierra</span></div>
        <div class="paso oro-borde pop" style="--d:1.4s"><b>+10–15 %</b><span>semanal a lo que ya funciona</span></div>
      </div>
    </div>''',
 "El contenido gana la confianza; el anuncio lo pone frente a mucha más gente. El reel te trae seguidores nuevos, el carrusel calienta a esa audiencia y la historia te cierra las ventas. Y cuando un contenido orgánico funciona, ahí le metes presupuesto: subes la inversión del 10 al 15% semanal, vigilando el retorno. Un secreto del día a día: no te dejes engañar por la métrica más barata. A veces un flyer sale a cinco pesos el resultado y un video a doce, pero la venta la trajo el video. Optimiza por ventas reales, no por leads baratos.", "Mercadeo")

# ───────── BLOQUE 4 · AUTOMATIZACIÓN ─────────
slide('''<div class="centro">
      <div class="ceja sube">Automatización</div>
      <h2 class="grande sube" style="--d:.1s">Generar leads es importante.<br><span class="oro">Convertirlos es más importante.</span></h2>
      <div class="reloj aparece" style="--d:.8s"><div class="arena"></div></div>
      <div class="sub sube" style="--d:1s">El punto más débil de casi todo negocio: cuánto tardas en contestar.</div>
    </div>''',
 "Hasta aquí hablamos de cómo traer gente. Ahora viene lo que casi nadie te dice. Generar leads es importante, pero es más importante convertir esos leads. Puedes tener la mejor marca y los mejores anuncios de Puerto Rico, y perder la venta en el momento más tonto: cuando la persona te escribe y nadie le contesta. En inglés le dicen speed to lead, la velocidad con la que respondes. Y para mí es el punto más débil de todas las empresas.", "Automatización")

slide('''<div class="centro">
      <div class="ceja sube">Ejercicio · saca tu teléfono</div>
      <h2 class="grande sube" style="--d:.1s">¿Cuánto tardaste en contestar el último mensaje de <span class="oro">un cliente nuevo?</span></h2>
      <div class="votos">
        <div class="voto pop" style="--d:.7s">Menos de 5 minutos</div>
        <div class="voto pop" style="--d:.9s">Menos de 1 hora</div>
        <div class="voto pop" style="--d:1.1s">Al otro día</div>
        <div class="voto rojo pop" style="--d:1.3s">Todavía no he contestado</div>
      </div>
    </div>''',
 "Vamos a hacer algo. Saca tu teléfono, abre tu WhatsApp o tu Instagram y busca el último mensaje que te escribió un cliente nuevo. ¿Cuánto tardaste en contestarle? Levanta la mano si fue en menos de cinco minutos… ¿Menos de una hora?… ¿Al otro día?… ¿Y quién tiene uno que todavía no ha contestado?… Tranquilo, no eres el único. Esto que acabamos de ver aquí es dinero que se fue caminando.", "Automatización")

slide('''<div class="centro">
      <div class="ceja sube">Automatización</div>
      <h2 class="mega sube" style="--d:.1s">El que contesta <span class="oro">primero,</span><br>se queda con la venta.</h2>
      <div class="barras-cmp">
        <div class="fila aparece" style="--d:.8s"><span>Una persona</span><div class="barra-larga"><i></i></div><b>horas</b></div>
        <div class="fila aparece" style="--d:1.1s"><span>Un sistema</span><div class="barra-corta"><i></i></div><b class="oro">segundos</b></div>
      </div>
    </div>''',
 "No le compran al mejor ni al más barato: muchas veces le compran al primero que contesta. Ahora compara. Una persona, por muy buena que sea, se tarda horas, porque come, duerme y atiende a otro cliente. Un sistema bien montado contesta en segundos. Eso no es tecnología por moda. Es la diferencia entre que la venta se quede contigo o se vaya a la competencia. [Si te preguntan por estadísticas: no cites porcentajes sin fuente; quédate con «horas contra segundos».]", "Automatización")

slide('''<div class="centro">
      <div class="ceja sube">Lcdo. Ernest Crisson Cancel · oficina legal · marketing + automatización</div>
      <div class="cita sube" style="--d:.15s">«Yo estoy <span class="oro">durmiendo</span>, pero lo veo cuando me despierto.»</div>
      <div class="sub sube" style="--d:.5s">25 a 50 mensajes al día, casi siempre de madrugada.</div>
    </div>''',
 "Te cuento el caso del licenciado Ernest Crisson, un abogado que trabaja con nosotros las dos cosas: el marketing y la automatización. Después de cuatro meses nos dijo esto: le entran entre 25 y 50 mensajes diarios, casi siempre de madrugada. Y en sus palabras: «Gracias a Dios que está el sistema, porque de otra manera no habría manera. Yo estoy durmiendo, pero lo veo cuando me despierto: el sistema ha seguido contactando, respondiendo al cliente.» Fíjate: los clientes no escriben cuando a ti te conviene. Escriben cuando tienen el problema.", "Automatización")

slide('''<div class="centro">
      <div class="ceja sube">Automatización</div>
      <h2 class="grande sube" style="--d:.1s">Con marketing resuelves un problema.<br><span class="oro">Con IA, resuelves dos.</span></h2>
      <div class="flujo">
        <div class="nodo pop" style="--d:.6s"><b>Responder</b><span>al instante</span></div><i class="aparece" style="--d:.8s">→</i>
        <div class="nodo pop" style="--d:.9s"><b>Precalificar</b><span>quién está listo</span></div><i class="aparece" style="--d:1.1s">→</i>
        <div class="nodo pop" style="--d:1.2s"><b>Agendar</b><span>en tu calendario</span></div><i class="aparece" style="--d:1.4s">→</i>
        <div class="nodo oro-borde pop" style="--d:1.5s"><b>Tu equipo cierra</b><span>solo con calificados</span></div>
      </div>
    </div>''',
 "Ojo con esto, porque aquí es donde mucha gente se equivoca con la IA. No se trata de que haga magia ni de que reemplace a tu gente. Se trata de ser quirúrgico: usarla al principio, para hablarle rápido al cliente y calificarlo, y que tus vendedores solo hablen con gente calificada. Con el marketing le resuelves al dueño un problema: que le lleguen clientes. Con los agentes de IA le resuelves dos: responder rápido y precalificar. Y con esos dos procesos puedes mejorar tus ventas sin meterle un dólar más a los anuncios.", "Automatización")

# ───────── BLOQUE 5 · AUTOFLOW Y PRUEBA ─────────
slide('''<div class="centro">
      <div class="ceja sube">AutoFlow · un ejemplo concreto</div>
      <h2 class="grande sube" style="--d:.1s">No vendemos software.<br><span class="oro">Construimos tu equipo digital.</span></h2>
      <div class="tres-iconos">
        <div class="ico pop" style="--d:.7s"><b>Chat</b><span>contesta</span></div>
        <div class="ico pop" style="--d:.95s"><b>Voz</b><span>atiende llamadas</span></div>
        <div class="ico pop" style="--d:1.2s"><b>CRM</b><span>precalifica y agenda</span></div>
      </div>
      <div class="dato-pie sube" style="--d:1.5s">Teo · Mano Santa PR · contestaba el <span class="oro">20 %</span> de sus leads → hoy contesta <span class="oro">en segundos</span></div>
    </div>''',
 "Te doy un ejemplo concreto. Nuestra empresa hermana, AI Borinquen, tiene un sistema que se llama AutoFlow: un asistente de chat, uno de voz y un CRM que contesta, precalifica y agenda citas solo. Pero no lo vendemos como un chatbot. Un chatbot te da el menú del uno, dos, tres. Esto es un empleado digital conectado a tu calendario. Teo, de Mano Santa PR, contestaba solo el 20% de sus leads. Hoy contesta en segundos. Y lo que más me gustó fue lo que dijo él: que le da tranquilidad saber que las conversaciones se siguen atendiendo.", "AutoFlow")

slide('''<div class="centro">
      <div class="ceja sube">La atención es solo una pieza</div>
      <h2 class="grande sube" style="--d:.1s">Si lo haces igual todos los días,<br><span class="oro">no lo tienes que hacer tú.</span></h2>
      <div class="organigrama">
        <div class="puesto pop" style="--d:.6s">El que cotiza</div><div class="puesto pop" style="--d:.75s">El que cobra</div>
        <div class="puesto pop" style="--d:.9s">El que lleva el inventario</div><div class="puesto pop" style="--d:1.05s">El que da seguimiento</div>
        <div class="puesto pop" style="--d:1.2s">El que recibe</div>
      </div>
      <div class="sub sube" style="--d:1.4s">Un agente por puesto · digitalizar tu negocio · aprender a usar la IA tú mismo</div>
    </div>''',
 "Y aquí quiero que me escuches bien: contestar mensajes es solo una parte. La automatización no es «el chatbot». Piensa en tu negocio como un organigrama: está el que cotiza, el que cobra, el que lleva el inventario, el que le da seguimiento a los que dijeron «déjame pensarlo». Cada uno de esos trabajos puede tener un agente de IA entrenado con tu negocio, tus precios y tu forma de hablar. La regla es simple: si lo haces igual todos los días, no lo tienes que hacer tú. [Opcional, 30 s: a las 5 de la mañana mi equipo de agentes tiene su reunión sin mí; yo llego y el plan del día ya está hecho.]", "AutoFlow")

CASOS = [("magdalys", "Magdalys", "Beauty Salon", "Más de $15K mensuales"), ("claro", "Edgard Cortés", "Franquicias Claro", "+1,400 conversaciones"),
         ("interior", "Home Interior Design", "", "+6,200 conversaciones"), ("grissel", "Dra. Grissel Villanueva", "", "+2,900 conversaciones"),
         ("rk", "RK Transmission", "", "Triplicó sus ventas"), ("lorelys", "Dra. Lorelys Mojica", "", "+3,500 conversaciones"),
         ("universidad", "Universidad Teológica Vida Abundante", "", "+2,800 conversaciones"), ("pepino", "Pepino Gun Gallery", "", "+3,300 conversaciones")]
tarjetas = "".join(f'<div class="mini sube" style="--d:{0.3 + i * 0.12:.2f}s"><img src="casos/{k}.jpg" alt=""><b>{e(n)}{(" · " + e(s)) if s else ""}</b><span>{e(d)}</span></div>' for i, (k, n, s, d) in enumerate(CASOS))
slide(f'''<div class="ceja sube" style="position:absolute;left:0;right:0;top:110px;text-align:center">Resultados de clientes reales</div>
    <h2 class="sube" style="--d:.1s;position:absolute;left:0;right:0;top:150px;text-align:center">Las conversaciones <span class="oro">son dinero.</span></h2>
    <div class="grid-casos">{tarjetas}</div>
    <div class="legal aparece" style="--d:1.4s">CADA NEGOCIO ES DISTINTO · ESTOS SON RESULTADOS DE ESOS CLIENTES, NO UNA PROMESA</div>''',
 "¿Te acuerdas del título de la charla? Las conversaciones son dinero. Mira estos números: son conversaciones reales de negocios de aquí. Home Interior Design, más de 6,200 conversaciones, desde 58 centavos. RK Transmission, más de 4,600 conversaciones, y triplicó sus ventas. Magdalys, con su salón de belleza, pasó de operar en números rojos a más de $15K mensuales. Te lo digo claro: cada negocio es distinto y nadie te puede garantizar un número. Lo que sí te puedo decir es que ninguno llegó ahí con un anuncio suelto. Todos tienen un sistema detrás.", "Prueba")

slide(f'''<div class="dos-col">
      <div class="col-txt">
        <div class="ceja sube">En sus palabras</div>
        <h2 class="sube" style="--d:.1s">«Y apenas van <span class="oro">ocho semanas</span>.»</h2>
        <p class="sube" style="--d:.25s">Dr. Bryan Vega · Robert · Magdalys · Reina · Oliver</p>
        <div class="cien pop" style="--d:.6s">+100<small>negocios en Puerto Rico</small></div>
      </div>
      {video("montaje.mp4", "montaje.jpg", etiqueta="0:34 · toca para reproducir")}
    </div>''',
 "¿Te acuerdas del Dr. Bryan Vega, el que tenía miedo de abrir su oficina? Mejor que lo escuches a él, y a Robert, Magdalys, Reina y Oliver. [Pon el montaje.] Hoy son más de cien negocios en Puerto Rico. Y te repito: cada caso es distinto. No te traje esto para prometerte nada. Te lo traje para que veas que esto no es un mito. Esto está pasando aquí, en Aguada, en Caguas, en Bayamón, en Mayagüez, en Cabo Rojo. [Las cifras de Bryan las dice él en el video: no las repitas.]", "Prueba")

# ───────── BLOQUE 6 · CIERRE ─────────
slide('''<div class="centro">
      <div class="ceja sube">Para llevarte</div>
      <h2 class="grande sube" style="--d:.1s">Tres preguntas</h2>
      <div class="preguntas">
        <div class="preg sube" style="--d:.5s"><b>Marca</b><span>¿A quién le estoy hablando de verdad?</span></div>
        <div class="preg sube" style="--d:.75s"><b>Mercadeo</b><span>¿Tengo un sistema o tengo suerte?</span></div>
        <div class="preg sube" style="--d:1s"><b>Automatización</b><span>¿Cuánto tardo en contestar?</span></div>
      </div>
      <div class="tarea pop" style="--d:1.4s"><b>Tarea de esta noche:</b> escríbele a tu propio negocio como si fueras un cliente nuevo y cuenta cuánto tardan en responderte.</div>
    </div>''',
 "No te quiero dejar con un montón de información. Te quiero dejar con tres preguntas. Una: ¿a quién le estoy hablando de verdad, o le hablo a todo el mundo? Dos: ¿tengo un sistema que me trae clientes, o vivo de referidos y de suerte? Tres: ¿cuánto tardo en contestar? Y te dejo una tarea para esta noche. Escríbele a tu propio negocio como si fueras un cliente nuevo, a las 9 de la noche. Mira el reloj y cuenta cuánto tardan en responderte. Ese número te va a decir más de tu negocio que cualquier charla.", "Cierre")

slide(f'''<div class="dos-col">
      <div class="col-txt">
        <h2 class="mega sube">Las conversaciones<br>son <span class="oro">dinero.</span></h2>
        <p class="sube" style="--d:.3s">«No lo pienses. Toma acción.» — Dr. Bryan Vega</p>
        <img class="logo-cierre aparece" style="--d:.7s" src="logo.png" alt="Level Up Media">
      </div>
      {video("bryan-accion.mp4", "bryan-accion.jpg", 380, 676, "toca para reproducir")}
    </div>''',
 "Hace treinta minutos te dije que yo había sido un fantasma. Hoy me paré aquí por primera vez, y te confieso que me daba miedo, igual que al Dr. Vega le daba miedo abrir su oficina. Pero aprendí algo: los resultados no le llegan al que tiene la idea perfecta. Le llegan al que construye el sistema y ejecuta. Si algo de lo que hablamos te hizo sentido y quieres conversar sobre tu negocio, búscame [di tu Instagram o la palabra clave]. Y como dice el Dr. Vega: no lo pienses. Toma acción. Gracias.", "Cierre")

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
  const pararVideos = () => document.querySelectorAll(".vid video").forEach((el) => { el.pause(); el.closest(".vid").classList.remove("reproduciendo"); });
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
  new MutationObserver(() => { pararVideos(); pintarNotas(); }).observe(document.getElementById("escenario"), { subtree: true, attributes: true, attributeFilter: ["class"] });
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
<h1>Las conversaciones son <span>dinero.</span></h1><div class="intro">Guion de Elvin · 22 slides · ~30 min. Lo que va entre [corchetes] es una indicación para ti, no se dice.</div>
{filas}</main></body></html>'''
(AQUI / "notas.html").write_text(notas_html)
print("notas.html listo")

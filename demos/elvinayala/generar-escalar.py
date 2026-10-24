#!/usr/bin/env python3
"""Genera escalar/index.html (quiz personal de Elvin: escalar negocios digitales a $10K–$20K/mes)
a partir del quiz de Shadow Operator (misma maquinaria: captura → pasos → loader → resultado → DM).
Uso: python3 generar-escalar.py"""
import re, os
AQUI = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(AQUI, 'aprende/index.html'), encoding='utf-8').read()

def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:80], s.count(a))
    s = s.replace(a, b)

def rep_re(pat, b):
    global s
    m = re.search(pat, s, re.S)
    assert m, pat[:80]
    s = s[:m.start()] + b + s[m.end():]

# ---------- cabecera / tema ----------
rep('<title>Auditoría de Negocio Digital · Shadow Operator</title>', '<title>Escala tu negocio digital · Elvin Ayala</title>')
rep('<!-- AUDITORIA DE NEGOCIO DIGITAL - SHADOW OPERATOR (marca personal de Elvin)', '<!-- ESCALA TU NEGOCIO DIGITAL A $10K-$20K - ELVIN AYALA (marca personal)')
# acento dorado cálido (se distingue del amarillo marcador de Shadow)
rep('--accent: #ffe14d;', '--accent: #e8c26a;')
s = s.replace('rgba(255,225,77,', 'rgba(232,194,106,')

# ---------- landing ----------
rep('<p class="eyebrow"><i></i>Auditoría de negocio digital · Shadow Operator</p>',
    '<p class="eyebrow"><i></i>Para creadores, coaches y negocios digitales</p>')
rep_re(r'<h1>Audita tu negocio digital y recibe un .*?</h1>',
       '<h1>Audita tu negocio digital y recibe un <mark>plan de 14 días</mark> para escalar a <em>$10K–$20K al mes</em>… en menos de 1 minuto.</h1>')
rep_re(r'<p class="sub">Entra tus números.*?</p>',
       '<p class="sub">Entra los números de tu negocio y te digo exactamente <b>cuál de tus 4 palancas te está frenando</b>: oferta, contenido, cierre o sistema. <b>Cuántas conversaciones te faltan</b>, cuánto dinero estás dejando en la mesa y qué arreglar primero.</p>')
rep('<span>Acepto recibir el resultado de mi auditoría y que Elvin o su equipo me escriban por DM o WhatsApp.</span>',
    '<span>Acepto recibir el resultado de mi auditoría y que Elvin o su equipo me escriban por DM o WhatsApp.</span>')
rep_re(r'<p class="bullet"><i></i><span><b>Mapa de los 4 fundamentos:</b>.*?</span></p>',
       '<p class="bullet"><i></i><span><b>Mapa de las 4 palancas:</b> la guía que uso para llevar negocios digitales de <b>$5K a $20K al mes</b>: cómo empaquetar la oferta, generar conversaciones todos los días, cerrar sin improvisar y montar el sistema para que el negocio no dependa de ti.</span></p>')
rep_re(r'<p class="hand">“Yo he sido un fantasma.*?”</p>',
       '<p class="hand">“Un negocio digital no se estanca por falta de seguidores. Se estanca porque la oferta no es clara, las conversaciones no entran, no se cierra con método o todo depende de ti. Eso se arregla en semanas.”</p>')
rep('Al cargar tus datos aceptas que Elvin o su equipo puedan contactarte para revisar tu negocio.', 'Al cargar tus datos aceptas que Elvin Ayala o su equipo puedan contactarte para revisar tu negocio.')

# ---------- footer ----------
rep('<p class="hand">nicho · oferta · contenido · estrategia</p>', '<p class="hand">oferta · contenido · cierre · sistema</p>')
rep_re(r'<p>Dos agencias construidas en silencio\..*?\$10K al mes\.</p>',
       '<p>Dos agencias construidas en silencio. Ahora ayudo a creadores, coaches y dueños de negocios digitales a escalar entre $10K y $20K al mes: oferta, contenido, ventas y sistemas operados con IA.</p>')
rep('<div class="logo">SHADOW<span>.</span>OPERATOR</div>', '<div class="logo">ELVIN<span>.</span>AYALA</div>')
rep('Shadow Operator · Elvin Ayala · Todos los derechos reservados.', 'Elvin Ayala · Todos los derechos reservados.')
rep('<span class="mono">SHADOW</span>', '<span class="mono">ELVIN</span>')

# ---------- badge de pasos / resultado ----------
rep('<span class="badge">Auditoría de negocio digital</span>', '<span class="badge">Escala tu negocio digital</span>')
rep('<span class="badge ink">Tu fundamento flojo</span>', '<span class="badge ink">Tu palanca floja</span>')
rep('<span class="badge" data-r="badge">Tu auditoría de negocio digital</span>', '<span class="badge" data-r="badge">Tu auditoría para escalar</span>')
rep('<h2>Revisando tus 4 fundamentos...</h2>', '<h2>Revisando tus 4 palancas...</h2>')
rep('<p>Comparando tus números con lo que he visto operando decenas de cuentas</p>', '<p>Comparando tus números con negocios digitales que ya escalaron</p>')
rep('Midiendo nicho, oferta, contenido y estrategia', 'Midiendo oferta, contenido, cierre y sistema')
rep('Calculando la matemática de tus $10K al mes', 'Calculando la matemática de tu meta')
rep('Detectando el fundamento que te está frenando', 'Detectando la palanca que te está frenando')
rep('<li><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>El Mapa de los 4 fundamentos</li>',
    '<li><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>El Mapa de las 4 palancas</li>')
rep('Escríbeme por DM y te lo mando completo, con la matemática de tus $10K hecha con tus números.', 'Escríbeme por DM y te lo mando completo, con la matemática de tu meta hecha con tus números.')
rep('y te mando tu plan de 14 días, tu métrica norte y el Mapa de los 4 fundamentos.', 'y te mando tu plan de 14 días, tu métrica norte y el Mapa de las 4 palancas.')

# ---------- pasos (markup) ----------
PASOS = '''        <!-- Paso: negocio -->
        <div data-step="negocio">
          <h2 data-title-negocio>Tu negocio</h2>
          <p class="lead">Las bases. Con esto calculo cuánto te falta para tu meta.</p>
          <label class="field"><span class="label">¿Qué tipo de negocio tienes?</span>
            <select class="input" data-q="tipo">
              <option value="">Elige una opción...</option>
              <option value="coach">Coaching, mentoría o consultoría</option>
              <option value="creador">Soy creador de contenido (monetizo mi audiencia)</option>
              <option value="curso">Curso o producto digital</option>
              <option value="comunidad">Comunidad o membresía</option>
              <option value="servicio">Agencia o servicio digital</option>
            </select></label>
          <label class="field"><span class="label">¿Cuánto factura tu negocio al mes hoy?</span>
            <select class="input" data-q="facturacion">
              <option value="">Elige un rango...</option>
              <option value="500">Menos de $1,000 / mes</option>
              <option value="2000">$1,000 a $3,000 / mes</option>
              <option value="4000">$3,000 a $5,000 / mes</option>
              <option value="7500">$5,000 a $10,000 / mes</option>
              <option value="15000">$10,000 a $20,000 / mes</option>
              <option value="25000">Más de $20,000 / mes</option>
            </select></label>
          <label class="field"><span class="label">¿A cuánto quieres llegar al mes?</span>
            <select class="input" data-q="meta">
              <option value="">Elige tu meta...</option>
              <option value="10000">$10,000 al mes</option>
              <option value="15000">$15,000 al mes</option>
              <option value="20000">$20,000 al mes</option>
            </select></label>
          <label class="field"><span class="label">¿Cuál es tu ticket promedio?</span><span class="hint">Lo que cobras por cliente o por venta, en USD. Si no sabes, pon lo que te gustaría cobrar.</span>
            <input class="input" data-q="ticket" type="number" min="0" step="1" inputmode="numeric" placeholder="Ej: 1500"></label>
        </div>
        <!-- Paso: oferta y audiencia -->
        <div data-step="oferta" hidden>
          <h2>Tu oferta y tu audiencia</h2>
          <p class="lead">Aquí se decide casi todo. Sé honesto: nadie más ve esto.</p>
          <label class="field"><span class="label">¿Cuántas personas te siguen o te escuchan?</span><span class="hint">Suma tu plataforma principal (Instagram, YouTube, lista de correo)</span>
            <select class="input" data-q="audiencia">
              <option value="">Elige un rango...</option>
              <option value="500">Menos de 2,500</option>
              <option value="5000">2,500 a 10,000</option>
              <option value="25000">10,000 a 50,000</option>
              <option value="100000">Más de 50,000</option>
            </select></label>
          <label class="field"><span class="label">¿Tu oferta es específica para un tipo de persona?</span>
            <select class="input" data-q="nicho">
              <option value="">Elige una opción...</option>
              <option value="claro">Sí: un nicho claro con un dolor urgente y dinero para resolverlo</option>
              <option value="amplio">Más o menos: le vendo a un público amplio</option>
              <option value="cambio">Cambio de enfoque cada par de meses</option>
            </select></label>
          <label class="field"><span class="label">¿Cuántos de estos 4 ingredientes tiene tu oferta hoy?</span><span class="hint">1) Una promesa concreta ("te llevo de X a Y") · 2) Un paquete de valor, no un solo producto · 3) Prueba o casos de que funciona · 4) Una garantía que quite el miedo</span>
            <select class="input" data-q="ingredientes">
              <option value="">Elige una opción...</option>
              <option value="0">Ninguno, no tengo una oferta armada</option>
              <option value="1">Uno</option>
              <option value="2">Dos</option>
              <option value="3">Tres</option>
              <option value="4">Los cuatro</option>
            </select></label>
        </div>
        <!-- Paso: ventas -->
        <div data-step="ventas" hidden>
          <h2>Tu contenido y tus ventas</h2>
          <p class="lead">Las conversaciones son dinero. Estima el último mes.</p>
          <label class="field"><span class="label">¿De dónde te llegan los clientes hoy?</span>
            <select class="input" data-q="fuente">
              <option value="">Elige una opción...</option>
              <option value="organico">Contenido orgánico (reels, historias, carruseles)</option>
              <option value="ads">Anuncios pagos</option>
              <option value="referidos">Referidos / boca a boca</option>
              <option value="dm">Prospección directa (DMs, mensajes, llamadas)</option>
              <option value="ninguna">Casi no me llegan clientes</option>
            </select></label>
          <label class="field"><span class="label">¿Cuántas conversaciones de venta tienes al mes?</span><span class="hint">DMs, llamadas o reuniones donde alguien pregunta por lo que vendes</span>
            <select class="input" data-q="conversaciones">
              <option value="">Elige un rango...</option>
              <option value="0">Ninguna</option>
              <option value="3">1 a 5</option>
              <option value="10">5 a 15</option>
              <option value="27">15 a 40</option>
              <option value="60">Más de 40</option>
            </select></label>
          <label class="field"><span class="label">¿Cuántos clientes cierras al mes?</span>
            <select class="input" data-q="cierres">
              <option value="">Elige un rango...</option>
              <option value="0">Ninguno</option>
              <option value="1.5">1 a 2</option>
              <option value="4">3 a 5</option>
              <option value="8">6 a 10</option>
              <option value="14">Más de 10</option>
            </select></label>
          <label class="field"><span class="label">¿Quién hace tus llamadas de venta?</span>
            <select class="input" data-q="quien">
              <option value="">Elige una opción...</option>
              <option value="yo">Yo mismo, todas</option>
              <option value="setter">Yo, con un setter que me agenda</option>
              <option value="closer">Un closer cierra por mí</option>
              <option value="nadie">Todavía no hago llamadas de venta</option>
            </select></label>
        </div>
        <!-- Paso condicional: sistema (solo si ya factura) -->
        <div data-step="sistema" hidden>
          <h2>Tu sistema y tu equipo</h2>
          <p class="lead">Ya vendes. Esto separa a quien tiene un negocio de quien tiene un trabajo.</p>
          <label class="field"><span class="label">¿Tienes un sistema de seguimiento?</span><span class="hint">Setter, secuencia de mensajes, CRM: algo que le escriba a los que no cerraron</span>
            <select class="input" data-q="seguimiento">
              <option value="">Elige una opción...</option>
              <option value="si">Sí, funciona sin que yo me acuerde</option>
              <option value="medio">A medias: le escribo cuando puedo</option>
              <option value="no">No, el que no compra se pierde</option>
            </select></label>
          <label class="field"><span class="label">¿Con quién trabajas hoy?</span>
            <select class="input" data-q="equipo">
              <option value="">Elige una opción...</option>
              <option value="solo">Solo yo, todo pasa por mí</option>
              <option value="free">Con 1 o 2 freelancers (edición, diseño)</option>
              <option value="pequeno">Con un equipo pequeño y roles claros</option>
              <option value="completo">Con un equipo completo (contenido, ventas y operación)</option>
            </select></label>
        </div>
        <!-- Paso: cuello de botella declarado -->
        <div data-step="cuello" hidden>
          <h2>¿Qué crees que te frena hoy?</h2>
          <p class="lead">Elige lo que más te duele. Lo cruzo con tus números para armar tu auditoría.</p>
          <div class="radios" role="radiogroup" data-q="cuello" aria-label="Qué te frena">
            <button type="button" class="radio" role="radio" data-v="oferta"><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i><span>La gente no ve el valor de lo que vendo o me dice que es caro</span></button>
            <button type="button" class="radio" role="radio" data-v="contenido"><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i><span>Publico y no me llegan suficientes conversaciones</span></button>
            <button type="button" class="radio" role="radio" data-v="cierre"><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i><span>Me llegan conversaciones, pero no cierro o se enfrían</span></button>
            <button type="button" class="radio" role="radio" data-v="sistema"><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i><span>Estoy saturado: todo depende de mí y no puedo delegar</span></button>
            <button type="button" class="radio" role="radio" data-v="techo"><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i><span>Llevo meses estancado en el mismo número</span></button>
            <button type="button" class="radio" role="radio" data-v="otro"><i><svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i><span>Otro (cuéntame)</span></button>
          </div>
          <div data-otro hidden style="margin-top:16px">
            <label class="field"><span class="label">Cuéntame en tus palabras qué te está frenando</span>
              <textarea class="input" data-q="frustracion" rows="4" placeholder="Lo más concreto posible: qué has intentado, qué pasó y dónde te trancas."></textarea></label>
          </div>
        </div>
'''
rep_re(r'        <!-- Paso: negocio -->.*?(?=        <p class="alert" data-alert hidden>)', PASOS)

# ---------- JS: config, datos, pasos, requeridos ----------
rep("marca: 'Shadow Operator',", "marca: 'Elvin Ayala · Escalar',")
rep("marcaId: 'shadow-operator',", "marcaId: 'elvin-escalar',")
rep("storageKey: 'so_auditoria_v1',", "storageKey: 'ea_escalar_v1',")
rep_re(r"    meta: 10000,.*?    umbralSistema: 500,[^\n]*\n",
       "    ticketDefault: 1500,    // si no sabe su ticket\n    cierreDefault: 0.2,     // tasa de cierre por defecto (1 de 5 conversaciones)\n    umbralSistema: 2000,    // muestra el paso \"sistema\" si ya factura (>= $1K-3K)\n")
rep_re(r"  var datos = \{ nombre: '', email: ''.*?frustracion: '' \};",
       "  var datos = { nombre: '', email: '', pais: '+1', telefono: '', negocio: '', optin: false,\n    tipo: '', facturacion: '', meta: '', ticket: '', audiencia: '', nicho: '', ingredientes: '', fuente: '', conversaciones: '', cierres: '', quien: '', seguimiento: '', equipo: '', cuello: '', frustracion: '' };")
rep("if (Number(datos.etapa) >= CONFIG.umbralSistema) base.push('sistema');", "if (Number(datos.facturacion) >= CONFIG.umbralSistema) base.push('sistema');")
rep_re(r"  var requeridos = \{.*?\};",
       "  var requeridos = { negocio: ['tipo','facturacion','meta','ticket'], oferta: ['audiencia','nicho','ingredientes'], ventas: ['fuente','conversaciones','cierres','quien'], sistema: ['seguimiento','equipo'], cuello: ['cuello'] };")
rep("fbq('track', 'Lead', { content_name: 'Auditoría de Negocio Digital' });", "fbq('track', 'Lead', { content_name: 'Escala tu negocio digital' });")
rep("fbq('trackCustom', 'AuditoriaCompletada', { fundamento: r.principal, score: r.score, faltan: r.convFaltan });", "fbq('trackCustom', 'AuditoriaCompletada', { palanca: r.principal, score: r.score, faltan: r.convFaltan });")

# ---------- JS: scoring + textos + render ----------
NUEVO_SCORING = r'''  /* ================== SCORING: LAS 4 PALANCAS ================== */
  var fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var pct = function (x) { return Math.round(x * 100) + '%'; };
  var NOMBRES = { oferta: 'Oferta', contenido: 'Audiencia y contenido', cierre: 'Cierre de ventas', sistema: 'Sistema y equipo' };
  var CUELLOS = { oferta: 'oferta', contenido: 'contenido', cierre: 'cierre', sistema: 'sistema', techo: null };
  var clamp = function (x) { return Math.max(0, Math.min(100, Math.round(x))); };

  function calcular(d) {
    var fact = Number(d.facturacion); var vende = fact >= CONFIG.umbralSistema;
    var ticket = Number(d.ticket) > 0 ? Number(d.ticket) : CONFIG.ticketDefault; var ticketEstimado = !(Number(d.ticket) > 0);
    var meta = Number(d.meta) || 15000;
    var conv = Number(d.conversaciones), cierres = Number(d.cierres), ingr = Number(d.ingredientes), aud = Number(d.audiencia);
    var tasa = conv > 0 ? Math.min(1, cierres / conv) : (cierres > 0 ? 0.5 : CONFIG.cierreDefault);
    var tasaEstimada = conv === 0;

    // Palancas 0-100
    var oferta = ({ 0: 8, 1: 30, 2: 55, 3: 78, 4: 96 })[ingr] || 8;
    oferta += ({ claro: 0, amplio: -12, cambio: -22 })[d.nicho] || 0;
    if (ticket < 500 && ingr >= 2) oferta -= 10;
    if (ticket >= 2000) oferta += 6;
    var contenido = ({ organico: 75, ads: 65, dm: 55, referidos: 35, ninguna: 8 })[d.fuente] || 8;
    contenido = contenido * .6 + (({ 500: 15, 5000: 40, 25000: 70, 100000: 90 })[aud] || 15) * .4;
    if (conv >= 15) contenido += 10; if (conv === 0) contenido -= 12;
    var cierre = conv === 0 ? 30 : (tasa >= .35 ? 92 : tasa >= .25 ? 78 : tasa >= .15 ? 58 : tasa > 0 ? 35 : 12);
    cierre += ({ yo: 0, setter: 6, closer: 10, nadie: -10 })[d.quien] || 0;
    var sistema = d.seguimiento ? (({ si: 60, medio: 30, no: 8 })[d.seguimiento] || 0) : (vende ? 15 : 30);
    sistema += d.equipo ? (({ solo: 0, free: 12, pequeno: 25, completo: 35 })[d.equipo] || 0) : 10;
    if (conv >= 40 && d.quien === 'yo') sistema -= 10;
    var F = { oferta: clamp(oferta), contenido: clamp(contenido), cierre: clamp(cierre), sistema: clamp(sistema) };
    var score = clamp((F.oferta + F.contenido + F.cierre + F.sistema) / 4);

    // Palanca floja = la más baja; la oferta gana si está a ≤ 12 pts; lo declarado gana si está a ≤ 12 pts
    var orden = ['oferta', 'contenido', 'cierre', 'sistema'].sort(function (a, b) { return F[a] - F[b]; });
    var declarado = CUELLOS[d.cuello] || null;
    var principal = orden[0];
    if (F.oferta - F[orden[0]] <= 12) principal = 'oferta'; // sin oferta no hay cierre ni sistema que valga
    if (declarado && F[declarado] - F[orden[0]] <= 12) principal = declarado;
    var secundario = orden.filter(function (k) { return k !== principal; })[0];
    if (F[secundario] >= 70) secundario = null;

    // La matemática de tu meta
    var brecha = Math.max(0, meta - fact);
    var clientesMeta = Math.ceil(meta / ticket);
    var convMeta = Math.ceil(clientesMeta / Math.max(tasa, 0.05));
    var convFaltan = Math.max(0, convMeta - conv);

    return { fact: fact, vende: vende, ticket: ticket, ticketEstimado: ticketEstimado, meta: meta, conv: conv, cierres: cierres, tasa: tasa, tasaEstimada: tasaEstimada, F: F, score: score,
      principal: principal, secundario: secundario, declarado: declarado, brecha: brecha, clientesMeta: clientesMeta, convMeta: convMeta, convFaltan: convFaltan,
      calificado: fact >= 4000 || (ticket >= 1000 && conv >= 5) };
  }

  function textos(r, d) {
    var nombre = d.nombre.split(' ')[0];
    var TIPO = { coach: 'coaching o consultoría', creador: 'tu audiencia como creador', curso: 'un curso o producto digital', comunidad: 'una comunidad', servicio: 'un servicio digital' };
    var FACT = { 500: 'facturas menos de $1,000 al mes', 2000: 'facturas entre $1,000 y $3,000 al mes', 4000: 'facturas entre $3,000 y $5,000 al mes', 7500: 'facturas entre $5,000 y $10,000 al mes', 15000: 'facturas entre $10,000 y $20,000 al mes', 25000: 'ya pasas de $20,000 al mes' };
    var CONV = { 0: 'ninguna conversación de venta', 3: '1 a 5 conversaciones', 10: '5 a 15 conversaciones', 27: '15 a 40 conversaciones', 60: 'más de 40 conversaciones' };
    var CIER = { 0: 'ningún cierre', 1.5: '1 o 2 cierres', 4: '3 a 5 cierres', 8: '6 a 10 cierres', 14: 'más de 10 cierres' };
    var base = '<b class="fact">' + nombre + '</b>, monetizas <b class="fact">' + (TIPO[d.tipo] || 'tu negocio digital') + '</b>' + (r.ticketEstimado ? ' (asumí un ticket de ' + fmt(r.ticket) + ' porque no lo definiste)' : ' a <b class="fact">' + fmt(r.ticket) + '</b>') + ', ' + (FACT[String(r.fact)] || '') + ', con <b class="fact">' + (CONV[r.conv] || r.conv + ' conversaciones') + '</b> y <b class="fact">' + (CIER[r.cierres] || r.cierres + ' cierres') + '</b> al mes. ';
    var mate = 'Para llegar a <b class="ink">' + fmt(r.meta) + ' al mes</b> con tu ticket necesitas <b>' + r.clientesMeta + ' clientes</b>' + (r.tasaEstimada ? ' y, con una tasa de cierre normal de 1 en 5, ' : ' y, con tu tasa de cierre de ' + pct(r.tasa) + ', ') + '<b>' + r.convMeta + ' conversaciones al mes</b>. Hoy te faltan <b>' + r.convFaltan + '</b>. ';
    var T = {
      oferta: { titulo: nombre + ', no te falta audiencia: te falta una oferta que se venda sola.', diag: base + mate + 'Puedes tener el mejor contenido y el mejor embudo; si la oferta es débil, no vas a vender. Una oferta no es un producto: es todo lo que la persona recibe a cambio de su dinero, empaquetado. La tuya tiene ' + (Number(d.ingredientes) || 0) + ' de los 4 ingredientes (promesa, paquete, prueba, garantía). Si la persona entiende el valor, le suena barato.',
        plan: ['Escribe tu promesa en una línea: "te llevo de [dónde está] a [dónde quiere estar] en [tiempo]".', 'Empaqueta 4 o 5 componentes que juntos valgan mucho más que el precio: programa, sesiones, plantillas, soporte y revisión.', 'Junta tu prueba: casos con número, capturas, testimonios. Si no tienes, ofrece a 2 clientes un trato por resultado a cambio de ser tu caso.', 'Agrega una garantía o condición que le quite el miedo a comprar, sin ponerte en riesgo.', 'Preséntala en 10 conversaciones esta semana. Lo que pregunten y donde duden son los ingredientes que te faltan.'],
        norte: 'Conversaciones donde presentas la oferta completa (meta: 10 por semana)', camino: 'Reempaquetar la oferta y subir el ticket antes de buscar más gente: entre $10K y $20K lo que se mueve es el precio por cliente, no los seguidores.' },
      contenido: { titulo: nombre + ', tienes algo que vender, pero no te llegan suficientes conversaciones.', diag: base + mate + 'Reels y carruseles no venden; traen y calientan. Se vende con historias y con conversaciones. Cada pieza necesita gancho, problema, prueba y un llamado a la acción; sin CTA no hay intención de compra. Viral no es ventas: el contenido de nicho, con estructura, es el que trae clientes de $1,000, $5,000 y $10,000.',
        plan: ['Define tus 3 ángulos ganadores: los 3 problemas de tu cliente ideal que, cuando los mencionas, la gente te escribe.', 'Escribe 15 guiones con IA en una tarde con la estructura gancho → problema → prueba → CTA, y corrígelos con tus frases.', 'Publica 1 reel al día con CTA de comentario ("comenta [PALABRA]") y contesta cada comentario por DM.', 'Sube 3 historias al día: una que califique, una que eduque y una que cierre con botón.', 'Haz el abridor: escríbele a quien vio tu historia y no te escribió. Las conversaciones son dinero.'],
        norte: 'Conversaciones nuevas por semana que salen de tu contenido (meta: 10)', camino: 'Contenido de nicho con estructura y CTA, más el abridor en historias. Primero conversaciones, después volumen.' },
      cierre: { titulo: nombre + ', te llegan conversaciones y se te están yendo los clientes. El cierre es tu palanca.', diag: base + mate + 'Tienes conversaciones, pero sin método de cierre cada llamada se improvisa y sin seguimiento el que no compra hoy se pierde. Tú no necesitas al lead: él te necesita a ti. Hay muchos dolores, pero hay uno que lo está puyando: ataca ese. Vender es un deporte; se entrena todos los días.',
        plan: ['Anota cada conversación de los últimos 60 días con su etapa (nuevo, habló, agendó, no compró) en un CRM sencillo.', 'Escribe tu guion de llamada: qué te trajo aquí, con qué te identificaste, dónde te duele, la oferta, el precio y seguir. Da el precio y sigue con la demostración.', 'Practica el guion en voz alta 15 minutos al día antes de cada llamada.', 'Diseña 5 toques de seguimiento (día 0, 1, 3, 7, 14) y prográmalos: nadie se pierde por falta de seguimiento.', 'Graba y revisa tus 5 mejores y 5 peores llamadas de la semana; si no puedes hacerlo tú, prueba con un setter.'],
        norte: 'Tasa de cierre (meta: 1 de cada 3 conversaciones) y seguimiento completo (100%)', camino: 'Método de cierre más seguimiento automático. Con lo que ya te llega puedes duplicar sin producir más contenido.' },
      sistema: { titulo: nombre + ', tu negocio depende de ti en cada paso. Ese es tu techo.', diag: base + mate + 'Cuando todo pasa por ti, el negocio crece hasta donde llegan tus horas y se detiene. El dueño del sistema, no el empleado de su propio negocio, es el que pasa de $10K a $20K. No necesitas dominar las herramientas, necesitas saber operarlas: la IA hace el trabajo pesado y tú das la lógica.',
        plan: ['Anota durante 3 días todo lo que haces y marca qué solo puedes hacer tú: vender, crear la oferta y la estrategia. Lo demás es delegable.', 'Documenta en un paso a paso lo más repetido (edición, seguimiento, onboarding) para que otro lo ejecute.', 'Pon un setter para agendar o un editor para tu contenido: el primero que te devuelva más horas que lo que cuesta.', 'Monta tu CRM y tus automatizaciones de seguimiento; usa IA para guiones, respuestas y reportes.', 'Mide cada semana horas tuyas en operación vs. en ventas y estrategia. Meta: menos de 10 horas operando.'],
        norte: 'Horas por semana en operación (meta: menos de 10) y conversaciones sin tu intervención', camino: 'Primer rol a delegar y automatizar el seguimiento. Para llegar a $20K el negocio tiene que correr sin ti en el día a día.' }
    };
    var t = T[r.principal] || T.oferta;
    if (r.fact >= 25000) { t.titulo = nombre + ', ya pasas de $20K. El siguiente nivel es el sistema y el equipo.'; t.camino = 'Delegar el sistema completo: setter, closer y contenido operado por otros o por IA, para que el negocio crezca sin ti en cada llamada.'; }
    return t;
  }

  function renderResultado(r) {
    var t = textos(r, datos);
    $('[data-r="badge"]').textContent = r.calificado ? 'Auditoría · Negocio con tracción' : 'Tu auditoría para escalar';
    $('[data-r="titulo"]').textContent = t.titulo;
    $('[data-r="intro"]').textContent = r.vende ? 'Ya vendes. Esto no es sobre "más contenido": es sobre la palanca que te tiene en el mismo número.' : 'Esta auditoría está armada con lo que acabas de entrar, no con una plantilla. Empezar a escalar es más ordenado de lo que parece.';
    $('[data-r="chip1"]').textContent = NOMBRES[r.principal];
    var c2 = $('[data-r="chip2"]'); c2.hidden = !r.secundario; if (r.secundario) c2.textContent = '+ ' + NOMBRES[r.secundario];
    $('[data-r="diagnostico"]').innerHTML = t.diag;
    $('[data-r="fund"]').innerHTML = ['oferta', 'contenido', 'cierre', 'sistema'].map(function (k) { return '<li class="' + (k === r.principal ? 'weak' : '') + '"><b>' + NOMBRES[k].split(' ')[0] + '</b><span class="bar"><i style="width:' + r.F[k] + '%"></i></span><small>' + r.F[k] + '</small></li>'; }).join('');
    $('[data-r="kpis"]').innerHTML = [
      ['Conversaciones que te faltan / mes', String(r.convFaltan), true], ['Brecha hasta ' + fmt(r.meta) + ' / mes', fmt(r.brecha), false], ['Clientes para tu meta', String(r.clientesMeta), false], ['Tu tasa de cierre', r.tasaEstimada ? '~' + pct(r.tasa) : pct(r.tasa), false]
    ].map(function (k) { return '<div class="kpi"><small>' + k[0] + '</small><strong class="' + (k[2] ? 'accent' : '') + '">' + k[1] + '</strong></div>'; }).join('');
    $('[data-r="ring"]').style.setProperty('--p', r.score); $('[data-r="score"]').textContent = r.score;
    $('[data-r="scoreTitulo"]').textContent = 'Tus 4 palancas: ' + (r.score >= 70 ? 'sólidas' : r.score >= 40 ? 'a medias' : 'por construir');
    $('[data-r="scoreTexto"]').textContent = r.score >= 70 ? 'Tienes base. Te falta afinar una palanca y escalar lo que ya funciona.' : r.score >= 40 ? 'Dos de las cuatro están bien; una te está tumbando el resto.' : 'Hoy el negocio se sostiene en esfuerzo, no en palancas. La buena noticia: esto se arregla en semanas, no en años.';
    $('[data-r="plan"]').innerHTML = t.plan.map(function (p, i) { return '<li><i>' + (i + 1) + '</i><span>' + p + '</span></li>'; }).join('');
    $('[data-r="norte"]').textContent = t.norte;
    $('[data-r="camino"]').textContent = t.camino;
    $('[data-r="finalTitulo"]').textContent = r.calificado ? '¿Quieres que lo veamos juntos?' : 'Escríbeme y te mando tu plan completo';
    var msg = 'Hola Elvin, soy ' + datos.nombre + ' (' + datos.negocio + '). Ya hice mi auditoría para escalar: palanca floja ' + NOMBRES[r.principal] + ', ' + r.score + '/100, me faltan ' + r.convFaltan + ' conversaciones al mes para llegar a ' + fmt(r.meta) + '. PLAN';
    var href = CONFIG.whatsapp ? 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg) : CONFIG.dm;
    $$('[data-cta]').forEach(function (a) { a.href = href; if (!a.__fbq) { a.__fbq = true; a.addEventListener('click', function () { try { if (window.fbq) fbq('track', 'Contact', { content_name: 'DM desde auditoría' }); } catch (e) {} }); } });
    try { if (window.fbq) fbq('trackCustom', 'AuditoriaCompletada', { palanca: r.principal, score: r.score, faltan: r.convFaltan }); } catch (e) {}
    var payload = { evento: 'resultado', marca: CONFIG.marca, datos: datos, resultado: r, principalNombre: NOMBRES[r.principal], tracking: tracking(), ts: new Date().toISOString() };
    try { localStorage.setItem(CONFIG.storageKey + '_resultado', JSON.stringify(payload)); } catch (e) {}
    try { root.dispatchEvent(new CustomEvent('so:resultado', { detail: payload, bubbles: true })); } catch (e) {}
    if (window.SO_AUDIT && typeof window.SO_AUDIT.onResultado === 'function') { try { window.SO_AUDIT.onResultado(payload); } catch (e) {} }
    enviarCRM('resultado', { resultado: r, principalNombre: NOMBRES[r.principal] });
    var sticky = $('[data-sticky]'); var finalEl = $('[data-final]'); var finalVisible = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { finalVisible = e.isIntersecting; }); upd(); }, { threshold: 0 }).observe(finalEl);
    function upd() { sticky.classList.toggle('hide', !(window.scrollY > 300 && !finalVisible)); }
    window.addEventListener('scroll', upd, { passive: true }); upd();
  }

'''
rep_re(r"  /\* ================== SCORING: LOS 4 FUNDAMENTOS ================== \*/.*?(?=  window\.SO_AUDIT = window\.SO_AUDIT \|\| \{\};)", NUEVO_SCORING)

# la regla del 1.º paso: el bloque de título usa "datos.nombre" igual; nada más que tocar
open(os.path.join(AQUI, 'escalar/index.html'), 'w', encoding='utf-8').write(s)
print('escalar/index.html generado:', len(s), 'caracteres')

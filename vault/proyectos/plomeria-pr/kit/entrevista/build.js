/**
 * Presentación de entrevista/cierre para candidatos (plomeros y contratistas).
 * Genera 2 archivos .pptx con el mismo diseño y notas del presentador en cada slide.
 *   node build.js
 */
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const Fa = require("react-icons/fa");
const sharp = require("sharp");

// ── Marca Resuelto ──
const C1 = "0F3D5E", C2 = "F2621F", C3 = "FBF7F0", C4 = "5C6670", C5 = "08243A", C6 = "1F9D6B", W = "FFFFFF";
const INK2 = "9FB8CA", SURF = "0C2A42", CARD = "FFFFFF", LINE = "E6E1D8";
const HF = "Arial", BF = "Calibri";

const iconCache = {};
async function icon(name, color) {
  const k = name + color;
  if (iconCache[k]) return iconCache[k];
  const svg = renderToStaticMarkup(React.createElement(Fa[name], { color: "#" + color, size: 256 }));
  const buf = await sharp(Buffer.from(svg)).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return (iconCache[k] = "image/png;base64," + buf.toString("base64"));
}

// ── helpers ──
function bg(s, color) { s.background = { color }; }
function t(s, text, o) { s.addText(text, { isTextBox: true, fontFace: BF, margin: 0, ...o }); }
function title(s, text, o = {}) {
  t(s, text, { x: 0.5, y: 0.4, w: 9, h: 0.8, fontFace: HF, fontSize: 30, bold: true, color: o.color ?? C1, valign: "top", ...o });
}
function eyebrow(s, text, o = {}) {
  t(s, text.toUpperCase(), { x: 0.5, y: 0.35, w: 9, h: 0.25, fontSize: 10, bold: true, color: o.color ?? C2, charSpacing: 3, ...o });
}
async function circleIcon(s, name, x, y, d, circle, ink) {
  s.addShape("ellipse", { x, y, w: d, h: d, fill: { color: circle }, line: { color: circle } });
  s.addImage({ data: await icon(name, ink), x: x + d * 0.25, y: y + d * 0.25, w: d * 0.5, h: d * 0.5 });
}
async function logo(s, x, y, scale = 1, ink = W) {
  const d = 0.55 * scale;
  s.addShape("roundRect", { x, y, w: d, h: d, fill: { color: C2 }, line: { color: C2 }, rectRadius: 0.12 * scale });
  s.addImage({ data: await icon("FaHome", W), x: x + d * 0.18, y: y + d * 0.18, w: d * 0.64, h: d * 0.64 });
  t(s, "resuelto", { x: x + d + 0.12 * scale, y: y - 0.06 * scale, w: 3 * scale, h: d + 0.12 * scale, fontFace: HF, fontSize: 30 * scale, bold: true, color: ink, valign: "middle" });
}
function footer(s, text, dark = false) {
  t(s, text, { x: 0.5, y: 5.2, w: 9, h: 0.25, fontSize: 9, color: dark ? INK2 : C4 });
}
function card(s, x, y, w, h, fill = CARD) {
  s.addShape("roundRect", { x, y, w, h, fill: { color: fill }, line: { color: fill === CARD ? LINE : fill, width: 0.75 }, rectRadius: 0.12, shadow: { type: "outer", color: "000000", blur: 6, offset: 2, angle: 90, opacity: 0.08 } });
}
function bigStat(s, x, y, w, big, label, color = C2, bigSize = 40, dark = false) {
  t(s, big, { x, y, w, h: 0.75, fontFace: HF, fontSize: bigSize, bold: true, color, valign: "bottom" });
  t(s, label, { x, y: y + 0.8, w, h: 1.2, fontSize: 12, color: dark ? INK2 : C4, valign: "top" });
}
function notes(s, text) { s.addNotes(text); }

// ── Contenido por público ──
const COMMON = {
  portadaSub: "Conversación de 20 minutos · Tu decisión al final",
  agenda: [
    ["FaUser", "Conocerte", "8 minutos tuyos. Cómo trabajas hoy, qué te sobra y qué te falta."],
    ["FaProjectDiagram", "Cómo funciona", "8 minutos míos. Qué hacemos nosotros, qué haces tú y cómo se paga."],
    ["FaHandshake", "Decidir", "4 minutos juntos. Si hay fit, arrancamos. Si no, quedamos bien."],
  ],
  mercado: [
    ["963", "plomeros colegiados en PR"],
    ["70%", "tiene más de 65 años"],
    ["20", "licencias nuevas en 2025"],
    ["1.22M", "viviendas · 54% de antes de 1980"],
  ],
};

const DATA = {
  plomeros: {
    archivo: "entrevista-plomeros.pptx",
    quien: "Plomero licenciado",
    url: "resueltopr.com/plomeros",
    tesis: ["Tú haces la plomería.", "Nosotros hacemos el resto."],
    anoto: ["Trabajos / semana", "Horas que no facturas", "Cotizaciones caídas", "Dinero que te deben"],
    mercado: {
      titulo: "El mercado se está quedando sin manos",
      stats: [["963", "plomeros colegiados en PR"], ["70%", "tiene más de 65 años"], ["20", "licencias nuevas en 2025"], ["1.22M", "viviendas · 54% de antes de 1980"]],
      texto: "Cada año hay más casas viejas y menos plomeros. El que se organice primero se queda con el mercado. Resuelto está construyendo la marca que los clientes van a recordar; tú eres quien la ejecuta en tu zona.",
      fuentes: "Fuentes: Colegio de Plomeros de PR, Censo 2020, DACO.",
      notas: `Aquí subes la visión: "Esto no es un lado extra. En 3 años, la mitad de los plomeros de hoy se retiran y las casas siguen ahí. Nosotros estamos construyendo la marca que va a atender ese mercado, y buscamos a los que van a estar en el camión."`,
    },
    portadaNotas: `ANTES DE ABRIR EL DECK (2 min): saluda por su nombre, pregúntale de dónde es y cuántos años lleva en el oficio. Que hable él primero. Postura: no estamos "ofreciendo trabajo"; estamos eligiendo con quién arrancar. Tono tranquilo, de par a par.
Frase de apertura: "Gracias por sacar el tiempo. Esto es una conversación, no una entrevista de empleo: yo te cuento cómo funciona, tú me cuentas cómo trabajas, y al final decidimos los dos si tiene sentido. ¿Te parece?"`,
    descubrir: [
      "¿Cuántos trabajos haces en una semana normal? ¿Y en una buena?",
      "¿Cuántas horas a la semana se te van en buscar clientes, cotizar, ir a ver y cobrar?",
      "De las cotizaciones del mes pasado, ¿cuántas no cerraron?",
      "¿Cuánto dinero te deben hoy de trabajos ya hechos?",
      "Si tuvieras 10 horas libres a la semana, ¿en qué las usarías?",
    ],
    descubrirNotas: `ESTE ES EL SLIDE MÁS IMPORTANTE. Pregunta, cállate y ANOTA LOS NÚMEROS que te dé (trabajos/semana, horas perdidas, cotizaciones caídas, dinero que le deben). Los vas a usar en los slides 8 y 9 con SUS números, no con los nuestros.
No vendas nada aquí. Si empieza a preguntar "¿y cuánto pagan?", responde: "Llego ahí en 3 minutos, y te lo voy a enseñar con tus propios números. Primero necesito entender cómo trabajas."
Señales de buen candidato: habla de sus clientes con respeto, se queja del cobro y del tiempo perdido (no del precio), tiene vehículo y herramientas, llegó puntual a esta llamada.`,
    problema: {
      titulo: "Lo que te roba el día no es la plomería",
      stats: [["40%", "de la semana de un plomero independiente se va en buscar, cotizar, ir a ver y cobrar. No se factura."], ["1 de 3", "cotizaciones no cierra. Fuiste, mediste, calculaste… y nada."], ["30–60 días", "tarda en llegar el dinero cuando el cliente 'te lo manda después'."]],
      notas: `Conecta con lo que te acaba de decir: "Tú me dijiste que pierdes X horas y que te deben $Y. Eso no es un problema tuyo, es el problema de TODOS los plomeros independientes de la isla. El oficio lo dominas; lo que te come es el negocio alrededor del oficio."
No exageres los números. Si sus números son mejores que estos, dilo: "Tú estás mejor que el promedio, y aun así estás perdiendo X horas."`,
    },
    hacemos: [
      ["FaBullhorn", "Traemos los clientes", "Publicidad, redes y marca pagadas por nosotros. $0 de tu bolsillo."],
      ["FaTag", "Precio fijo, publicado", "El cliente ya sabe el precio antes de que llegues. Cero discusiones en la puerta."],
      ["FaCalendarCheck", "Agendamos y confirmamos", "Ventana de 2 horas, recordatorio al cliente, dirección y fotos del problema en tu app."],
      ["FaCreditCard", "Cobramos nosotros", "El cliente paga a Resuelto por link. Tú nunca persigues un pago."],
      ["FaShieldAlt", "Garantía y reclamos", "12 meses de garantía la da la marca. Los reclamos los atiende Resuelto, no tú."],
      ["FaTruck", "Materiales", "Costo + 20%: 10% para ti, 10% para la marca. Compras tú, te reembolsamos."],
    ],
    hacemosNotas: `Recorre los 6 rápido (15 segundos cada uno). La frase ancla: "Todo lo que hoy haces gratis, lo hacemos nosotros. Tú solo haces lo que cobra."
Anticipa la duda: "Sí, tomamos una parte. Ahora te enseño exactamente cuánto y por qué te conviene igual."`,
    dia: [
      ["Alerta", "Te llega el trabajo a la app: qué es, dónde, cuándo y cuánto ganas."],
      ["Aceptas", "Un toque. El primero que acepta en la zona se lo lleva."],
      ["Llegas", "En la ventana de 2 horas. Avisas 30 min antes desde la app."],
      ["Resuelves", "Fotos antes y después. Si aparece algo extra, se cotiza en la app y el cliente aprueba."],
      ["Cobras", "Todos los viernes, lo de la semana, a tu cuenta. Con desglose."],
    ],
    diaNotas: `Cuéntalo como un día real: "Martes, 7:40 AM, te suena el celular: destape en Guaynabo, ventana 10–12, $97 para ti. Le das aceptar. Llegas, resuelves, fotos, te vas. Viernes cae el dinero." Simple. Sin drama.
Pregunta de control: "¿Ves algo de esto que no encaje con cómo trabajas hoy?"`,
    dinero: {
      titulo: "El trato, sin letra chiquita",
      filas: [["Mano de obra", "65% para ti · 35% Resuelto", C6], ["Materiales", "Costo + 20% → 10% tú · 10% marca", C1], ["Fee de coordinación", "$19 lo paga el cliente, no sale de tu parte", C1], ["Pago", "Viernes, semanal, con desglose por trabajo", C1], ["Publicidad, cobro, garantía", "$0 para ti. Lo paga la marca", C1]],
      ejemplo: { titulo: "Ejemplo real del menú", lineas: [["Destape simple", "$149"], ["Tu 65%", "$97"], ["Instalación de calentador", "$279"], ["Tu 65%", "$181"]] },
      notas: `Di el 35% de frente, sin pedir perdón: "De la mano de obra, 35% es de Resuelto. Con eso pagamos la publicidad, el agente que atiende 24/7, la garantía, el cobro y la app. Tú hoy pagas eso con tu tiempo; nosotros lo pagamos con dinero."
Si compara con lo que cobra solo: "Correcto, un destape tú lo cobras $150 completo. La pregunta no es cuánto ganas por trabajo, es cuántos trabajos haces por semana y cuánto tardas en cobrarlos." → pasa al slide siguiente.`,
    },
    semana: {
      titulo: "Tu semana con Resuelto (estimado)",
      cats: ["1 trabajo/día", "2 trabajos/día", "3 trabajos/día"],
      vals: [975, 1950, 2925],
      nota: "Estimado con el menú actual (mano de obra promedio ~$300 por trabajo · 65% · 5 días). Depende de la demanda de tu zona; no es una promesa.",
      notas: `Usa SUS números: "Tú me dijiste que haces X trabajos a la semana. Con Resuelto, 2 al día son 10 a la semana: ~$1,950 en tu cuenta el viernes, sin haber buscado uno solo."
Sé honesto con la rampa: "Las primeras 2–3 semanas van a ser menos mientras la zona arranca. Por eso empezamos con pocos plomeros por territorio: para que a los que entren no les falte trabajo."
Nunca digas "garantizado". Di "estimado" y "depende de la demanda".`,
    },
    comparar: {
      izq: ["Buscas tú los clientes", "Cotizas gratis y a veces no cierra", "Discutes el precio en la puerta", "Persigues el pago 30–60 días", "El reclamo te cae a ti", "Si te enfermas, no entra nada"],
      der: ["Los clientes te llegan a la app", "Precio fijo publicado; nada que cotizar", "El cliente ya aceptó el precio", "Te pagamos el viernes, siempre", "Resuelto da la garantía y atiende", "Sigues con tus clientes propios, sin conflicto"],
      notas: `Léelo en pares, izquierda → derecha. Al terminar: "¿Cuál de estas es la que más te pesa hoy?" Que elija una. Esa es la razón por la que va a firmar; anótala.`,
    },
    reglas: [
      ["FaUserShield", "El cliente es de Resuelto", "Ni tarjeta personal ni tu número. Si te pide directo, le dices que escriba a Resuelto. Es lo que protege tu pago y tu garantía."],
      ["FaBan", "Nunca cobras en efectivo ni directo", "Todo pago va por el link de Resuelto. Un cobro directo termina el trato ese mismo día."],
      ["FaClock", "Puntualidad real", "Ventana de 2 horas y aviso 30 min antes. Dos tardanzas sin aviso bajan tu prioridad en la app."],
      ["FaCamera", "Fotos antes y después", "Es tu protección ante cualquier reclamo. Sin fotos, el reclamo lo pagas tú."],
      ["FaShieldAlt", "Garantía de 12 meses", "Si falla tu mano de obra, vuelves sin costo. Resuelto pone la cara con el cliente."],
    ],
    reglasNotas: `Preséntalas como protección, no como castigo: "Estas 5 reglas son las que hacen que el viernes te paguemos sin excusas. Cada una protege tu dinero."
Pausa después de la regla 2 y mira a la cámara: "Esta es la única que no tiene segunda oportunidad. ¿Estás bien con eso?" Espera el sí.`,
    objeciones: [
      ["¿Y si un mes está flojo?", "Por eso limitamos plomeros por zona y arrancamos con 3 territorios, no 8. Mejor pocos con la agenda llena que muchos peleando por lo mismo."],
      ["¿Y si el cliente me quiere contratar directo?", "Le dices que escriba a Resuelto. Ese cliente vuelve a ti por la app, porque tú eres el plomero de su zona. Y sigues cobrando sin perseguirlo."],
      ["¿Y mis clientes de siempre?", "Son tuyos y siguen siendo tuyos. Resuelto no te pide exclusividad. Solo te pide que los de Resuelto sean de Resuelto."],
      ["¿Y si no me gusta?", "Contrato mes a mes, sin penalidad. Te vas cuando quieras avisando con 2 semanas para no dejar clientes colgados."],
    ],
    objecionesNotas: `Pregunta ANTES de mostrarlas: "¿Qué es lo que te frena?" Deja que la diga él. Luego responde con la del slide. Si dice una que no está aquí, la fórmula: reconoce ("tiene sentido que te preocupe") → aclara → pregunta de vuelta ("¿eso te resuelve la duda?").
No discutas el 65/35 en la entrevista. Si insiste: "El reparto es igual para todos los fundadores; lo que sí se revisa a los 90 días con datos es cuánto trabajo te llega."`,
    primeros: [
      ["FaMapMarkedAlt", "Cupo por zona", "10 cupos, uno por territorio. El que entra se queda con su zona y con la prioridad en la app."],
      ["FaStar", "Estatus fundador", "Tu foto y tu nombre en la página de Resuelto y en los primeros anuncios de tu zona."],
      ["FaGift", "Referidos: $200", "Por cada plomero que traigas y llegue a activo. Y $50 por cada cliente que refieras y cierre."],
      ["FaComments", "Voz en el menú", "Los fundadores revisan los precios del menú con nosotros cada 90 días."],
    ],
    primerosNotas: `Escasez real, no inventada: "Hoy hay X cupos abiertos en tu zona" (di el número real). "No te digo esto para presionarte; te lo digo porque si entra otro antes, la próxima apertura en tu zona es en 60–90 días."`,
    entrar: [
      ["Hoy", "Licencia vigente, ID, foto del vehículo y herramientas. Firmamos el acuerdo por DocuSign desde tu celular."],
      ["Día 1–2", "Instalas la app, verificamos tus documentos y te damos tu zona."],
      ["Día 3–5", "Primer trabajo acompañado: te mandamos uno sencillo y te llamamos al terminar."],
      ["Día 7", "Activo. Empiezan a llegarte trabajos y el viernes siguiente, tu primer pago."],
    ],
    entrarNotas: `"Del sí a tu primer pago pasan 10 días. No hay curso, no hay uniforme que comprar, no hay cuota."`,
    cierre: {
      pregunta: "¿Hay algo que te impida empezar la semana que viene?",
      a: ["Empezar ahora", "Firmamos hoy por DocuSign. Activo en 7 días. Tu cupo queda reservado."],
      b: ["Pensarlo 48 horas", "Fijamos ahora la fecha y hora de la llamada. Tu cupo se reserva 48 h; después vuelve a la lista."],
      notas: `CIERRE. Haz la pregunta y CÁLLATE. Aguanta el silencio, aunque duela.
Si dice que sí → "Perfecto. Te llega el DocuSign ahora mismo a tu WhatsApp; lo firmas mientras seguimos en la llamada." No cuelgues sin la firma o sin la fecha de seguimiento.
Si dice "lo tengo que pensar" → "Claro. ¿Qué es lo que quieres pensar: el reparto, la zona o el tiempo?" Resuelve esa. Luego: "Te reservo el cupo 48 horas. ¿Jueves a las 10 o a las 4?" Nunca "te llamo la semana que viene".
Si dice que no → agradece, pídele 2 nombres de plomeros que sí lo necesiten ($200 por cada uno que entre) y déjalo en lista de espera.`,
    },
  },

  contratistas: {
    archivo: "entrevista-contratistas.pptx",
    quien: "Contratista con registro DACO",
    url: "resueltopr.com/contratistas",
    tesis: ["Nosotros vendemos el proyecto.", "Tú lo ejecutas."],
    anoto: ["Cotizaciones / mes y % de cierre", "Horas por cotización perdida", "$ gastado en leads y anuncios", "Capacidad: proyectos / mes"],
    mercado: {
      titulo: "Las casas están viejas y nadie vende la remodelación bien",
      stats: [["1.22M", "viviendas en Puerto Rico"], ["54%", "construidas antes de 1980: baños, cocinas y pisos por renovar"], ["2 de 3", "cotizaciones de remodelación no cierran por desconfianza, no por precio"], ["0", "marcas en PR vendiendo remodelación con precio fijo, contrato y garantía"]],
      texto: "El dueño quiere remodelar y no lo hace por miedo: al contratista que no vuelve, al precio que cambia, al trabajo sin garantía. Resuelto le quita ese miedo con marca, contrato y DACO. Cuando el miedo desaparece, el proyecto se cierra. Y ese proyecto lo ejecutas tú.",
      fuentes: "Fuentes: Censo 2020 (viviendas por año de construcción), DACO, experiencia de campo.",
      notas: `Aquí subes la visión: "El problema del contratista bueno en PR no es la falta de casas por remodelar: hay 650 mil casas de más de 45 años. El problema es que el dueño no confía y no cierra. Nosotros vendemos confianza: marca, contrato con DACO, precio fijo y garantía. Con eso el proyecto se cierra, y buscamos a los pocos que lo ejecutan bien."
Si menciona a la competencia (directorios, Facebook Marketplace): "Ellos te venden el lead y te dejan solo vendiendo. Nosotros vendemos el proyecto y te lo entregamos cerrado."`,
    },
    portadaNotas: `ANTES DE ABRIR EL DECK (2 min): pregúntale qué tipo de proyectos hace más (baños, cocinas, pisos, poda…), en qué zonas y desde cuándo tiene el registro DACO. Que hable él.
Frase de apertura: "Esto no es una entrevista de empleo ni un directorio donde te apuntas. Te voy a enseñar cómo Resuelto vende proyectos y por qué necesitamos contratistas que los ejecuten bien. Al final decidimos los dos."`,
    descubrir: [
      "¿Cuántas cotizaciones haces al mes y cuántas cierras?",
      "¿Cuántas horas te toma una visita + cotización que no cierra?",
      "¿Cuánto llevas invertido este año en anuncios, páginas o leads que no dieron nada?",
      "¿Cuál fue el proyecto que más te dolió cobrar? ¿Cuánto tardó?",
      "Si el próximo mes te llegaran 2 proyectos vendidos y con depósito, ¿los podrías ejecutar?",
    ],
    descubrirNotas: `EL SLIDE MÁS IMPORTANTE. Pregunta, cállate y ANOTA: cotizaciones/mes, % de cierre, horas por cotización perdida, dinero gastado en leads, y sobre todo la última pregunta (capacidad). Esos números vuelven en los slides 8 y 9.
Si pregunta "¿cuánto cobran ustedes?": "Te lo enseño en 3 minutos con un proyecto real. Primero necesito entender cómo vendes hoy."
Buen candidato: DACO vigente, fotos de trabajos terminados, habla de acabados y tiempos con precisión, tiene cuadrilla o gente de confianza, no culpa a todos los clientes.`,
    problema: {
      titulo: "Cotizar gratis es tu trabajo más caro",
      stats: [["2 de 3", "cotizaciones de remodelación no cierran. Fuiste, mediste, hiciste números… gratis."], ["6–10 h", "de trabajo no pagado por cada proyecto que 'lo va a pensar'."], ["$300–800", "por lead en directorios y anuncios, y el lead lo recibe también tu competencia."]],
      notas: `Devuélvele sus números: "Tú me dijiste que cotizas X al mes y cierras Y. Eso son Z horas al mes regaladas. Y encima pagas por leads que le venden a tres más. El problema no es tu trabajo; es que estás pagando por vender, y vender no es lo tuyo."`,
    },
    hacemos: [
      ["FaBullhorn", "Conseguimos al cliente", "Marca, anuncios y agente 24/7 pagados por Resuelto. Cero cuotas para ti."],
      ["FaRulerCombined", "Cotizamos nosotros", "Un cotizador de Resuelto visita, mide y presenta el precio con nuestro Cost Book. Tú no vas a cotizar."],
      ["FaFileSignature", "Cerramos y cobramos el depósito", "Contrato con el cliente, 40% cobrado antes de que tú muevas un dedo."],
      ["FaClipboardList", "Alcance cerrado por escrito", "Partidas, cantidades, acabados y fecha. Lo que no está en el alcance, se cotiza aparte y el cliente lo aprueba."],
      ["FaMoneyCheckAlt", "Te pagamos por hitos", "40% al arrancar · 50% al avance con fotos · 10% a la aceptación."],
      ["FaShieldAlt", "Garantía y reclamos", "Resuelto responde ante el cliente. Tú respondes por tu ejecución, con reglas claras."],
    ],
    hacemosNotas: `Frase ancla: "Resuelto NO es un directorio. No te vendemos leads. Vendemos el proyecto, cobramos el depósito y te lo entregamos para ejecutar."
Repite "vendido, con depósito" al menos dos veces. Es lo que ningún directorio les da.`,
    dia: [
      ["Alerta", "Te llega a la app un proyecto CERRADO: alcance, fotos, fecha y cuánto recibes tú."],
      ["Aceptas", "Tienes hasta 4 horas. El primero que acepta en la zona y categoría se lo lleva."],
      ["Contrato", "Orden de trabajo por DocuSign con el alcance exacto. 40% a tu cuenta al arrancar."],
      ["Ejecutas", "Fotos de avance en la app. El Coordinador aprueba y sale el 50%."],
      ["Aceptación", "Recorrido con el cliente, firma en la app y el 10% final a los 15 días sin reclamo."],
    ],
    diaNotas: `Cuéntalo como caso: "Lunes te llega: baño completo en Guaynabo, 12 partidas, empieza el 3, $9,000 para ti. Aceptas. Firmas la orden. El miércoles tienes $3,600 en la cuenta y todavía no compraste un tubo."
Pregunta de control: "¿Qué parte de esto te preocupa?"`,
    dinero: {
      titulo: "El trato, sin letra chiquita",
      filas: [["Tu pago", "El costo de ejecución que TÚ dices que necesitas para hacerlo bien y ganar", C6], ["Precio al cliente", "Lo fija Resuelto con el Cost Book (tu costo + nuestro margen)", C1], ["Hitos", "40% al arrancar · 50% al avance con fotos · 10% a la aceptación", C1], ["Retención", "El 10% final se libera 15 días después de la aceptación sin reclamo", C1], ["Cuotas, leads, publicidad", "$0. Nunca pagas por entrar ni por recibir proyectos", C1]],
      ejemplo: { titulo: "Ejemplo: baño completo", lineas: [["Tu costo de ejecución", "$9,000"], ["Precio que cierra Resuelto", "$12,000"], ["Al arrancar (40%)", "$3,600"], ["Al avance (50%)", "$4,500"]] },
      notas: `Sé transparente con el margen: "Nosotros ponemos nuestro margen encima de tu costo. En este baño, $3,000. Con eso pagamos al cotizador, la publicidad, el agente, la garantía y el riesgo de cobro. Tú no ves ese margen porque no lo pagas tú: lo paga el cliente por la tranquilidad de contratar una empresa con DACO, contrato y garantía."
La pregunta clave del Cost Book: "¿Cuánto necesitas recibir para ejecutar este alcance correctamente y ganar dinero?" Ese es su número; no lo negociamos hacia abajo.`,
    },
    semana: {
      titulo: "Tu mes con Resuelto (estimado)",
      cats: ["1 proyecto/mes", "2 proyectos/mes", "3 proyectos/mes"],
      vals: [9000, 18000, 27000],
      nota: "Ejemplo con baños de ~$9,000 de ejecución. Los proyectos varían ($3,000 a $40,000). Depende de la demanda de tu categoría y zona; no es una promesa.",
      notas: `Vuelve a su respuesta de capacidad: "Me dijiste que podrías ejecutar 2 al mes. Eso son $18,000 de ejecución con depósito cobrado, sin haber ido a una sola cotización."
Rampa honesta: "El primer mes suele ser 1 proyecto; estamos abriendo la demanda por categoría. Por eso entran pocos por zona."`,
    },
    comparar: {
      izq: ["Cotizas gratis 2 de cada 3 veces", "Pagas por leads que también le venden a otros", "Discutes precio y alcance con el cliente", "Arrancas con tu dinero y cobras al final", "El reclamo y la garantía te caen a ti", "Ganas trabajo si eres el más barato"],
      der: ["Recibes proyectos ya vendidos", "Cero cuotas, cero leads", "Alcance y precio cerrados por escrito", "40% en tu cuenta antes de empezar", "Resuelto pone la cara; tú ejecutas", "Ganas trabajo si eres el mejor de tu zona"],
      notas: `Léelo en pares. Al final: "¿Cuál de estas te ha costado más dinero este año?" Que elija. Anótala; es su razón para firmar.`,
    },
    reglas: [
      ["FaUserShield", "El cliente es de Resuelto", "Sin tarjeta personal, sin número, sin 'la próxima me llamas directo'. Es lo que sostiene tu pago y tu garantía."],
      ["FaBan", "Nunca cobras al cliente", "Todo pago va a Resuelto. Cobrar directo o vender por fuera termina el acuerdo ese día."],
      ["FaClipboardList", "Ejecutas el alcance firmado", "Nada fuera del alcance sin aprobación en la app. Los extras se cotizan y el cliente los aprueba antes."],
      ["FaCamera", "Fotos y aceptación firmada", "Sin fotos no sale el 50%. Sin aceptación no sale el 10%. Es tu protección y la nuestra."],
      ["FaFileContract", "DACO, seguro y garantía 12 meses", "Corriges defectos de mano de obra en 10 días hábiles. Si no respondes, lo hace otro Verified y se descuenta."],
    ],
    reglasNotas: `"Estas reglas son las que hacen que el 40% te llegue antes de empezar. Cada una protege tu dinero."
Pausa en la regla 2: "Esta no tiene segunda oportunidad. ¿Estás bien con eso?" Espera el sí. Pausa en la 5: "¿Tu DACO está vigente y tienes seguro de responsabilidad?" Si no, pasa a lista de espera con los pasos para tenerlo.`,
    objeciones: [
      ["¿Y si el precio que ustedes cierran es bajo?", "El precio sale de TU costo: te preguntamos cuánto necesitas para ejecutar bien y ganar. Nosotros ponemos el margen encima. Nunca te pedimos bajar tu número."],
      ["¿Y si el cliente quiere cambios a mitad?", "Se cotiza en la app como extra, el cliente lo aprueba y se te paga. Lo que no está aprobado, no se ejecuta. Se acabó el 'ya que estás aquí'."],
      ["¿Y si tardan en pagarme?", "El 40% sale cuando el cliente depositó, antes de arrancar. El 50% al aprobar tus fotos. Resuelto nunca te adelanta menos de lo que el cliente ya pagó."],
      ["¿Y mis proyectos propios?", "Son tuyos. Sin exclusividad. Solo pedimos que lo de Resuelto se quede en Resuelto y que cumplas las fechas que aceptaste."],
    ],
    objecionesNotas: `Pregunta primero: "¿Qué es lo que te frena?" Deja que la diga. Responde con la del slide. Fórmula para las que no están: reconoce → aclara → pregunta de vuelta.
Si pide "más porcentaje": "Tú no cobras un porcentaje; cobras tu costo completo. Lo que se discute es tu número, y ese lo pones tú en la sesión de costos."`,
    primeros: [
      ["FaMapMarkedAlt", "Cupo por categoría y zona", "2–3 Verified por categoría en cada territorio. El que entra se queda con su zona y con prioridad en la app."],
      ["FaStar", "Resuelto Verified", "Sello, perfil en la web y nombre en las propuestas. Sube a Preferido con 5 proyectos sin reclamos."],
      ["FaGift", "Referidos: $150", "Por cada contratista que traigas y llegue a Verified. $100 por cada cliente que refieras y cierre proyecto."],
      ["FaComments", "Tu costo en el Cost Book", "Los fundadores fijan con nosotros los costos base de su categoría. Tu número define el mercado."],
    ],
    primerosNotas: `Escasez real: "En baños en Metro hay X cupos" (número real). "Si entra otro antes, la próxima apertura en tu categoría es cuando la demanda crezca, 60–90 días."`,
    entrar: [
      ["Hoy", "DACO vigente, seguro, 5 fotos de trabajos terminados y 2 referencias. Acuerdo marco por DocuSign."],
      ["Día 1–3", "Verificación de documentos y referencias. Sesión de costos de 45 min: tus números al Cost Book."],
      ["Día 4–7", "Instalas la app y recibes tu zona y categorías. Primer proyecto acompañado por el Coordinador."],
      ["Día 10", "Verified activo. Alertas de proyectos cerrados en tu categoría."],
    ],
    entrarNotas: `"Del sí al primer proyecto pasan unos 10 días. La sesión de costos es la clave: ahí pones tus números y de ahí salen los precios que vendemos."`,
    cierre: {
      pregunta: "¿Hay algo que te impida ejecutar tu primer proyecto con nosotros este mes?",
      a: ["Empezar ahora", "Firmamos el acuerdo marco hoy. Sesión de costos esta semana. Verified en 10 días."],
      b: ["Pensarlo 48 horas", "Fijamos ahora la fecha y hora de la llamada. Tu cupo en la categoría se reserva 48 h."],
      notas: `CIERRE. Haz la pregunta y CÁLLATE.
Sí → "Perfecto. Te llega el DocuSign al WhatsApp ahora; lo firmas mientras hablamos, y agendamos la sesión de costos: ¿miércoles o jueves?"
"Lo tengo que pensar" → "¿Qué quieres pensar: el modelo de pago, el alcance cerrado o las reglas?" Resuelve esa. Luego fecha exacta en 48 h. Nunca "te llamo".
No → agradece, pide 2 nombres de contratistas serios ($150 por cada uno que entre) y lista de espera.`,
    },
  },
};

// ── Construcción ──
async function build(key) {
  const D = DATA[key];
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Resuelto Home Services LLC";
  pres.title = `Resuelto · Conversación con ${D.quien}`;

  // 1 · Portada
  {
    const s = pres.addSlide(); bg(s, C5);
    s.addShape("ellipse", { x: 6.4, y: -2.2, w: 5.5, h: 5.5, fill: { color: C1 }, line: { color: C1 } });
    await logo(s, 0.6, 0.6, 1);
    t(s, D.tesis[0], { x: 0.6, y: 2.0, w: 8.8, h: 0.8, fontFace: HF, fontSize: 40, bold: true, color: W });
    t(s, D.tesis[1], { x: 0.6, y: 2.75, w: 8.8, h: 0.8, fontFace: HF, fontSize: 40, bold: true, color: C2 });
    t(s, `Conversación con: ${D.quien}`, { x: 0.6, y: 3.9, w: 8.8, h: 0.35, fontSize: 16, color: W });
    t(s, COMMON.portadaSub, { x: 0.6, y: 4.25, w: 8.8, h: 0.3, fontSize: 12, color: INK2 });
    footer(s, `Resuelto Home Services LLC · ${D.url} · Confidencial`, true);
    notes(s, D.portadaNotas);
  }

  // 2 · Cómo va esta conversación
  {
    const s = pres.addSlide(); bg(s, W);
    eyebrow(s, "20 minutos");
    title(s, "Cómo va esta conversación", { y: 0.6 });
    const xs = [0.5, 3.6, 6.7];
    for (let i = 0; i < 3; i++) {
      const [ic, h, d] = COMMON.agenda[i];
      card(s, xs[i], 1.8, 2.8, 2.9);
      await circleIcon(s, ic, xs[i] + 0.3, 2.1, 0.7, C2, W);
      t(s, `${i + 1}. ${h}`, { x: xs[i] + 0.3, y: 3.0, w: 2.2, h: 0.4, fontFace: HF, fontSize: 18, bold: true, color: C1 });
      t(s, d, { x: xs[i] + 0.3, y: 3.45, w: 2.2, h: 1.1, fontSize: 12, color: C4, valign: "top" });
    }
    footer(s, "Yo hablo 8 minutos. Tú hablas 12. Al final decidimos los dos.");
    notes(s, `Pon las reglas del juego: "Te voy a hacer 5 preguntas, después te enseño cómo funciona con tus números, y al final te voy a preguntar si quieres empezar. Si la respuesta es no, está perfecto." Esto baja la guardia y te da permiso para cerrar al final.`);
  }

  // 3 · Cuéntame de ti
  {
    const s = pres.addSlide(); bg(s, C3);
    eyebrow(s, "Paso 1 · Conocerte");
    title(s, "Cuéntame cómo trabajas hoy", { y: 0.6 });
    for (let i = 0; i < D.descubrir.length; i++) {
      const y = 1.55 + i * 0.68;
      s.addShape("ellipse", { x: 0.5, y: y + 0.05, w: 0.45, h: 0.45, fill: { color: C1 }, line: { color: C1 } });
      t(s, String(i + 1), { x: 0.5, y: y + 0.05, w: 0.45, h: 0.45, fontFace: HF, fontSize: 14, bold: true, color: W, align: "center", valign: "middle" });
      t(s, D.descubrir[i], { x: 1.15, y, w: 5.4, h: 0.58, fontSize: 15, color: C5, valign: "middle" });
    }
    card(s, 6.9, 1.55, 2.6, 3.3, W);
    await circleIcon(s, "FaPencilAlt", 7.15, 1.8, 0.55, C2, W);
    t(s, "Anoto tus números", { x: 7.15, y: 2.45, w: 2.2, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: C1 });
    t(s, D.anoto.map((x, i) => ({ text: x, options: { bullet: true, breakLine: i < D.anoto.length - 1 } })), { x: 7.15, y: 2.85, w: 2.2, h: 1.8, fontSize: 12, color: C4, paraSpaceAfter: 6, valign: "top" });
    footer(s, "Aquí hablas tú. Yo escucho y anoto.");
    notes(s, D.descubrirNotas);
  }

  // 4 · El problema
  {
    const s = pres.addSlide(); bg(s, W);
    eyebrow(s, "El problema");
    title(s, D.problema.titulo, { y: 0.6 });
    const xs = [0.5, 3.6, 6.7];
    for (let i = 0; i < 3; i++) {
      const [big, lab] = D.problema.stats[i];
      card(s, xs[i], 1.8, 2.8, 2.9, C3);
      bigStat(s, xs[i] + 0.3, 2.0, 2.3, big, lab, C2, big.length > 6 ? 28 : 38);
    }
    footer(s, "Promedios del oficio en PR. Tus números pueden ser mejores; el problema es el mismo.");
    notes(s, D.problema.notas);
  }

  // 5 · Por qué ahora
  {
    const s = pres.addSlide(); bg(s, C5);
    eyebrow(s, "Por qué ahora", { color: C2 });
    title(s, D.mercado.titulo, { y: 0.6, color: W, fontSize: D.mercado.titulo.length > 40 ? 26 : 30 });
    const xs = [0.5, 2.85, 5.2, 7.55];
    for (let i = 0; i < 4; i++) {
      const [big, lab] = D.mercado.stats[i];
      s.addShape("roundRect", { x: xs[i], y: 1.75, w: 2.0, h: 2.3, fill: { color: SURF }, line: { color: SURF }, rectRadius: 0.12 });
      bigStat(s, xs[i] + 0.2, 1.9, 1.7, big, lab, C2, 34, true);
    }
    t(s, D.mercado.texto, { x: 0.5, y: 4.2, w: 9, h: 0.9, fontSize: 13, color: W, valign: "top" });
    footer(s, D.mercado.fuentes, true);
    notes(s, D.mercado.notas);
  }

  // 6 · Qué hacemos nosotros
  {
    const s = pres.addSlide(); bg(s, W);
    eyebrow(s, "Paso 2 · Cómo funciona");
    title(s, `${D.tesis[0]} ${D.tesis[1]}`, { y: 0.6, fontSize: 26 });
    for (let i = 0; i < 6; i++) {
      const [ic, h, d] = D.hacemos[i];
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.5 + col * 3.1, y = 1.6 + row * 1.85;
      await circleIcon(s, ic, x, y, 0.55, C1, W);
      t(s, h, { x: x + 0.7, y, w: 2.3, h: 0.5, fontFace: HF, fontSize: 13, bold: true, color: C1, valign: "top" });
      t(s, d, { x: x + 0.7, y: y + 0.52, w: 2.3, h: 1.2, fontSize: 11, color: C4, valign: "top" });
    }
    footer(s, "Todo lo que hoy haces gratis, lo hacemos nosotros. Tú haces lo que cobra.");
    notes(s, D.hacemosNotas);
  }

  // 7 · Tu día con Resuelto (proceso)
  {
    const s = pres.addSlide(); bg(s, C3);
    eyebrow(s, "Paso 2 · Cómo funciona");
    title(s, key === "plomeros" ? "Así es un trabajo con Resuelto" : "Así es un proyecto con Resuelto", { y: 0.6 });
    const n = D.dia.length, w = 1.72, gap = 0.1, x0 = 0.5;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (w + gap);
      card(s, x, 1.7, w, 2.9, W);
      s.addShape("ellipse", { x: x + 0.2, y: 1.9, w: 0.5, h: 0.5, fill: { color: C2 }, line: { color: C2 } });
      t(s, String(i + 1), { x: x + 0.2, y: 1.9, w: 0.5, h: 0.5, fontFace: HF, fontSize: 14, bold: true, color: W, align: "center", valign: "middle" });
      t(s, D.dia[i][0], { x: x + 0.2, y: 2.55, w: w - 0.4, h: 0.35, fontFace: HF, fontSize: 15, bold: true, color: C1 });
      t(s, D.dia[i][1], { x: x + 0.2, y: 2.95, w: w - 0.4, h: 1.5, fontSize: 10.5, color: C4, valign: "top" });
      if (i < n - 1) s.addImage({ data: await icon("FaChevronRight", C2), x: x + w - 0.03, y: 3.0, w: 0.16, h: 0.16 });
    }
    footer(s, key === "plomeros" ? "El primero que acepta en la zona se lleva el trabajo. Si nadie acepta en 30 min, el Coordinador lo asigna a mano." : "El primero que acepta en zona y categoría se lleva el proyecto. Si nadie acepta en 4 horas, el Coordinador lo asigna a mano.");
    notes(s, D.diaNotas);
  }

  // 8 · El dinero
  {
    const s = pres.addSlide(); bg(s, W);
    eyebrow(s, "El dinero");
    title(s, D.dinero.titulo, { y: 0.6 });
    for (let i = 0; i < D.dinero.filas.length; i++) {
      const [k, v, c] = D.dinero.filas[i];
      const y = 1.6 + i * 0.66;
      s.addShape("rect", { x: 0.5, y: y + 0.55, w: 5.6, h: 0.01, fill: { color: LINE }, line: { color: LINE } });
      t(s, k, { x: 0.5, y, w: 1.9, h: 0.5, fontFace: HF, fontSize: 12, bold: true, color: c, valign: "middle" });
      t(s, v, { x: 2.45, y, w: 3.65, h: 0.5, fontSize: 12, color: C5, valign: "middle" });
    }
    card(s, 6.5, 1.6, 3.0, 3.2, C5);
    t(s, D.dinero.ejemplo.titulo.toUpperCase(), { x: 6.8, y: 1.85, w: 2.5, h: 0.3, fontSize: 10, bold: true, color: C2, charSpacing: 2 });
    for (let i = 0; i < 4; i++) {
      const [k, v] = D.dinero.ejemplo.lineas[i];
      const y = 2.25 + i * 0.6, strong = i % 2 === 1;
      t(s, k, { x: 6.8, y, w: 1.6, h: 0.5, fontSize: 11, color: strong ? W : INK2, valign: "middle" });
      t(s, v, { x: 8.3, y, w: 1.0, h: 0.5, fontFace: HF, fontSize: strong ? 18 : 14, bold: true, color: strong ? C2 : W, align: "right", valign: "middle" });
    }
    footer(s, key === "plomeros" ? "Del menú de Resuelto (precios publicados). Tu 65% es sobre mano de obra; materiales aparte." : "Ejemplo del Cost Book. Tu costo lo fijas tú en la sesión de costos; el precio al cliente lo fija Resuelto.");
    notes(s, D.dinero.notas);
  }

  // 9 · Tu semana / tu mes (gráfico nativo)
  {
    const s = pres.addSlide(); bg(s, C3);
    eyebrow(s, "El dinero");
    title(s, D.semana.titulo, { y: 0.6 });
    {
      const maxV = Math.max(...D.semana.vals), baseY = 4.55, maxH = 2.5, bw = 1.3, gap = 0.55, x0 = 0.75;
      s.addShape("rect", { x: 0.5, y: baseY, w: 5.8, h: 0.02, fill: { color: LINE }, line: { color: LINE } });
      for (let i = 0; i < 3; i++) {
        const v = D.semana.vals[i], h = Math.max(0.3, (v / maxV) * maxH), x = x0 + i * (bw + gap), y = baseY - h;
        const fill = i === 1 ? C2 : C1;
        s.addShape("roundRect", { x, y, w: bw, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
        t(s, "$" + v.toLocaleString("en-US"), { x: x - 0.3, y: y - 0.5, w: bw + 0.6, h: 0.45, fontFace: HF, fontSize: i === 1 ? 22 : 18, bold: true, color: i === 1 ? C2 : C1, align: "center", valign: "bottom" });
        t(s, D.semana.cats[i], { x: x - 0.3, y: baseY + 0.08, w: bw + 0.6, h: 0.35, fontSize: 11, color: C4, align: "center" });
      }
    }
    card(s, 6.6, 1.5, 2.9, 3.4, W);
    await circleIcon(s, "FaCalculator", 6.85, 1.75, 0.55, C2, W);
    t(s, "Con tus números", { x: 6.85, y: 2.4, w: 2.4, h: 0.35, fontFace: HF, fontSize: 14, bold: true, color: C1 });
    t(s, key === "plomeros" ? "Tú me dijiste que haces ___ trabajos por semana y pierdes ___ horas buscando y cobrando.\n\nCon Resuelto, esas horas son trabajos." : "Tú me dijiste que cotizas ___ al mes y cierras ___.\n\nCon Resuelto, cada uno que te llega ya está vendido y con depósito.", { x: 6.85, y: 2.8, w: 2.4, h: 1.9, fontSize: 12, color: C4, valign: "top" });
    footer(s, D.semana.nota);
    notes(s, D.semana.notas);
  }

  // 10 · Hoy solo vs con Resuelto
  {
    const s = pres.addSlide(); bg(s, W);
    eyebrow(s, "La diferencia");
    title(s, key === "plomeros" ? "Hoy, solo · Con Resuelto" : "Hoy, solo · Con Resuelto", { y: 0.6 });
    card(s, 0.5, 1.55, 4.4, 3.45, C3);
    card(s, 5.1, 1.55, 4.4, 3.45, C5);
    t(s, "HOY, SOLO", { x: 0.8, y: 1.75, w: 3.8, h: 0.3, fontSize: 11, bold: true, color: C4, charSpacing: 2 });
    t(s, "CON RESUELTO", { x: 5.4, y: 1.75, w: 3.8, h: 0.3, fontSize: 11, bold: true, color: C2, charSpacing: 2 });
    for (let i = 0; i < 6; i++) {
      const y = 2.15 + i * 0.46;
      s.addImage({ data: await icon("FaTimes", "B94A24"), x: 0.8, y: y + 0.06, w: 0.2, h: 0.2 });
      t(s, D.comparar.izq[i], { x: 1.1, y, w: 3.6, h: 0.4, fontSize: 12, color: C5, valign: "middle" });
      s.addImage({ data: await icon("FaCheck", "3DD598"), x: 5.4, y: y + 0.06, w: 0.2, h: 0.2 });
      t(s, D.comparar.der[i], { x: 5.7, y, w: 3.6, h: 0.4, fontSize: 12, color: W, valign: "middle" });
    }
    footer(s, "¿Cuál de las de la izquierda es la que más te pesa hoy?");
    notes(s, D.comparar.notas);
  }

  // 11 · Las reglas
  {
    const s = pres.addSlide(); bg(s, C3);
    eyebrow(s, "El trato");
    title(s, "5 reglas que protegen tu dinero", { y: 0.6 });
    for (let i = 0; i < 5; i++) {
      const [ic, h, d] = D.reglas[i];
      const y = 1.5 + i * 0.72;
      await circleIcon(s, ic, 0.5, y, 0.5, i === 1 ? "B94A24" : C1, W);
      t(s, h, { x: 1.15, y, w: 3.2, h: 0.5, fontFace: HF, fontSize: 13, bold: true, color: i === 1 ? "B94A24" : C1, valign: "middle" });
      t(s, d, { x: 4.4, y, w: 5.1, h: 0.62, fontSize: 10.5, color: C4, valign: "middle" });
    }
    footer(s, "La regla 2 no tiene segunda oportunidad. Las demás bajan tu prioridad en la app.");
    notes(s, D.reglasNotas);
  }

  // 12 · Lo que seguro estás pensando
  {
    const s = pres.addSlide(); bg(s, W);
    eyebrow(s, "Lo que seguro estás pensando");
    title(s, "Preguntas que nos hacen todos", { y: 0.6 });
    for (let i = 0; i < 4; i++) {
      const [q, a] = D.objeciones[i];
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.5 + col * 4.6, y = 1.55 + row * 1.75;
      card(s, x, y, 4.4, 1.6, C3);
      await circleIcon(s, "FaQuestion", x + 0.25, y + 0.25, 0.42, C2, W);
      t(s, q, { x: x + 0.8, y: y + 0.2, w: 3.4, h: 0.5, fontFace: HF, fontSize: 13, bold: true, color: C1, valign: "middle" });
      t(s, a, { x: x + 0.25, y: y + 0.75, w: 3.95, h: 0.8, fontSize: 10.5, color: C4, valign: "top" });
    }
    footer(s, "Si tienes otra, dímela ahora. Prefiero un no claro hoy que un sí a medias la semana que viene.");
    notes(s, D.objecionesNotas);
  }

  // 13 · Los primeros
  {
    const s = pres.addSlide(); bg(s, C5);
    eyebrow(s, key === "plomeros" ? "Los primeros 10" : "Los primeros Verified", { color: C2 });
    title(s, "Los fundadores entran distinto", { y: 0.6, color: W });
    for (let i = 0; i < 4; i++) {
      const [ic, h, d] = D.primeros[i];
      const x = 0.5 + i * 2.3;
      s.addShape("roundRect", { x, y: 1.6, w: 2.15, h: 3.1, fill: { color: SURF }, line: { color: SURF }, rectRadius: 0.12 });
      await circleIcon(s, ic, x + 0.25, 1.85, 0.6, C2, W);
      t(s, h, { x: x + 0.25, y: 2.6, w: 1.7, h: 0.6, fontFace: HF, fontSize: 13, bold: true, color: W, valign: "top" });
      t(s, d, { x: x + 0.25, y: 3.2, w: 1.7, h: 1.4, fontSize: 10.5, color: INK2, valign: "top" });
    }
    footer(s, "Cupos abiertos hoy en tu zona: ___ (se dice el número real).", true);
    notes(s, D.primerosNotas);
  }

  // 14 · Cómo entras
  {
    const s = pres.addSlide(); bg(s, W);
    eyebrow(s, "Cómo entras");
    title(s, key === "plomeros" ? "Del sí a tu primer pago: 10 días" : "Del sí a tu primer proyecto: 10 días", { y: 0.6 });
    s.addShape("rect", { x: 0.9, y: 2.2, w: 8.2, h: 0.04, fill: { color: LINE }, line: { color: LINE } });
    for (let i = 0; i < 4; i++) {
      const [h, d] = D.entrar[i];
      const x = 0.5 + i * 2.3;
      s.addShape("ellipse", { x: x + 0.8, y: 1.95, w: 0.55, h: 0.55, fill: { color: i === 3 ? C6 : C2 }, line: { color: i === 3 ? C6 : C2 } });
      s.addImage({ data: await icon(i === 3 ? "FaCheck" : "FaArrowRight", W), x: x + 0.95, y: 2.1, w: 0.25, h: 0.25 });
      t(s, h, { x, y: 2.7, w: 2.15, h: 0.4, fontFace: HF, fontSize: 16, bold: true, color: C1, align: "center" });
      t(s, d, { x: x + 0.1, y: 3.15, w: 1.95, h: 1.6, fontSize: 11, color: C4, align: "center", valign: "top" });
    }
    footer(s, "Sin curso, sin uniforme que comprar, sin cuota de entrada.");
    notes(s, D.entrarNotas);
  }

  // 15 · El cierre
  {
    const s = pres.addSlide(); bg(s, C5);
    eyebrow(s, "Paso 3 · Decidir", { color: C2 });
    t(s, D.cierre.pregunta, { x: 0.5, y: 0.75, w: 9, h: 1.3, fontFace: HF, fontSize: 30, bold: true, color: W, valign: "top" });
    const opts = [[D.cierre.a, C2, "FaRocket"], [D.cierre.b, SURF, "FaRegClock"]];
    for (let i = 0; i < 2; i++) {
      const [[h, d], fill, ic] = opts[i];
      const x = 0.5 + i * 4.6;
      s.addShape("roundRect", { x, y: 2.35, w: 4.4, h: 2.35, fill: { color: fill }, line: { color: fill }, rectRadius: 0.14 });
      await circleIcon(s, ic, x + 0.3, 2.6, 0.6, i === 0 ? W : C2, i === 0 ? C2 : W);
      t(s, h, { x: x + 1.05, y: 2.6, w: 3.1, h: 0.6, fontFace: HF, fontSize: 20, bold: true, color: W, valign: "middle" });
      t(s, d, { x: x + 0.3, y: 3.35, w: 3.8, h: 1.2, fontSize: 12.5, color: i === 0 ? W : INK2, valign: "top" });
    }
    footer(s, "Firma por DocuSign desde el celular, en esta misma llamada.", true);
    notes(s, D.cierre.notas);
  }

  // 16 · Gracias
  {
    const s = pres.addSlide(); bg(s, W);
    await logo(s, 0.6, 0.6, 0.9, C1);
    t(s, "Tu casa, resuelta.", { x: 0.6, y: 1.9, w: 8.8, h: 0.8, fontFace: HF, fontSize: 36, bold: true, color: C1 });
    t(s, "Gracias por tu tiempo. Lo que acordamos hoy te llega por WhatsApp en los próximos 5 minutos.", { x: 0.6, y: 2.75, w: 8.8, h: 0.6, fontSize: 15, color: C4 });
    const filas = [["FaWhatsapp", "WhatsApp de Resuelto", "___-___-____"], ["FaGlobe", "Web", D.url], ["FaEnvelope", "Correo", "hola@resueltopr.com"]];
    for (let i = 0; i < 3; i++) {
      const [ic, k, v] = filas[i];
      const y = 3.6 + i * 0.5;
      await circleIcon(s, ic, 0.6, y, 0.38, C2, W);
      t(s, k, { x: 1.1, y, w: 2.2, h: 0.38, fontSize: 12, bold: true, color: C1, valign: "middle" });
      t(s, v, { x: 3.3, y, w: 4, h: 0.38, fontSize: 12, color: C4, valign: "middle" });
    }
    footer(s, "Resuelto Home Services LLC · Puerto Rico");
    notes(s, `Después de la llamada, en 5 minutos: manda por WhatsApp (1) el DocuSign o la fecha de seguimiento, (2) el resumen del trato en 3 líneas, (3) el nombre y número de la persona que lo va a acompañar en su primer trabajo/proyecto. Registra el resultado en el agente (candidato → entrevistado / firmado / lista de espera).`);
  }

  await pres.writeFile({ fileName: D.archivo });
  console.log("→", D.archivo);
}

(async () => { await build("plomeros"); await build("contratistas"); })().catch((e) => { console.error(e); process.exit(1); });

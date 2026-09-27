// Los anuncios de la fábrica (lanzamiento 27/sep/2026). 30 fps: 15 s = 450 · 20 s = 600 · 25 s = 750.
// Copy SOLO con hooks aprobados y datos verificados (vault/estilo/*, objeciones-reales, casos reales).
// Registro: Level Up y Bori en tuteo PR; AI Borinquen en anuncios DE USTED.
import type { Anuncio } from "./tipos";

const NOTA_LU = "Resultados de clientes reales; cada negocio es distinto.";
const CIERRE_LU = { cta: "Haz tu diagnóstico →", sub: "Descubre en 1 minuto qué frena tu crecimiento", url: "@level_upmediapr" };
const CIERRE_BORI = { cta: "Empieza en heybori.ai", sub: "Bori Pro · $99/mes · sin contrato", url: "@heybori" };
const CIERRE_AIB = { cta: "Agende su demo →", sub: "Agentes de IA de voz y chat, a la medida de su negocio" };

export const ANUNCIOS: Anuncio[] = [
  /* ═════════ LEVEL UP MEDIA ═════════ */
  {
    id: "lu-01-tinos", marca: "level-up", formato: "9:16", titulo: "Tinos: de $30K a $100K al mes (sistema, no anuncio)", angulo: "Caso real + sistema",
    escenas: [
      { tipo: "gancho", dur: 75, etiqueta: "Caso real · Cabo Rojo", lineas: ["Tinos pasó de", "*$30K* a *$100K*", "al mes."] },
      { tipo: "numero", dur: 120, etiqueta: "Restaurante Tinos", antes: "Antes: $30K/mes", desde: 30, hasta: 100, prefijo: "$", sufijo: "K/mes", nota: NOTA_LU },
      { tipo: "gancho", dur: 75, lineas: ["No fue un anuncio.", "Fue un *sistema*."] },
      { tipo: "pasos", dur: 80, titulo: "El sistema *Level Up*", pasos: ["Tráfico con Meta Ads", "Ventas que se cierran", "Automatización con IA"] },
      { tipo: "cierre", dur: 100, ...CIERRE_LU },
    ],
  },
  {
    id: "lu-02-referidos", marca: "level-up", formato: "9:16", titulo: "Si tu plan es que te recomienden, no tienes un plan", angulo: "Depender de referidos",
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["Si tu plan es que", "alguien te *recomiende*…"] },
      { tipo: "gancho", dur: 70, lineas: ["…no tienes", "un *plan*."], alarma: true },
      { tipo: "semanas", dur: 150, titulo: "Cada semana esperando un *referido*", semanas: 8 },
      { tipo: "pasos", dur: 130, titulo: "Una máquina *predecible* de clientes", pasos: ["Anuncios que traen al cliente correcto", "Respuesta en segundos, no en horas", "Seguimiento hasta la venta"] },
      { tipo: "cierre", dur: 160, ...CIERRE_LU },
    ],
  },
  {
    id: "lu-03-doctor", marca: "level-up", formato: "16:9", titulo: "Eres doctor, no marketero", angulo: "Salud · sin tiempo",
    escenas: [
      { tipo: "gancho", dur: 100, etiqueta: "Para doctores y profesionales de la salud", lineas: ["Eres *doctor*,", "no marketero."] },
      { tipo: "gancho", dur: 110, lineas: ["Trabajas 15 horas al día.", "¿Cuándo consigues", "*pacientes nuevos*?"] },
      { tipo: "pasos", dur: 150, titulo: "Nosotros lo hacemos *por ti*", pasos: ["Oferta", "Estrategia", "Contenido", "Anuncios con IA", "Leads automatizados", "Escalar lo que funciona"] },
      { tipo: "gancho", dur: 110, etiqueta: "Caso real · Quiropráctico", lineas: ["El Dr. Bryan Vega recibe", "*25 a 50 pacientes nuevos*", "cada mes."], sub: NOTA_LU },
      { tipo: "gancho", dur: 100, etiqueta: "Caso real · Cirujano plástico", lineas: ["El Dr. Marvin Argüello abrió", "su oficina con la *agenda llena*."], sub: NOTA_LU },
      { tipo: "cierre", dur: 180, cta: "Haz tu diagnóstico →", sub: "La agencia #1 de Meta Ads en Puerto Rico", url: "@level_upmediapr" },
    ],
  },
  {
    id: "lu-04-reel", marca: "level-up", formato: "9:16", titulo: "Tu reel hizo 500K vistas. ¿Cuántos clientes te trajo?", angulo: "DWY · vistas no pagan",
    escenas: [
      { tipo: "gancho", dur: 80, lineas: ["Tu reel hizo", "*500K* vistas."] },
      { tipo: "gancho", dur: 70, lineas: ["¿Cuántos clientes", "de *$3K* te trajo?"] },
      { tipo: "gancho", dur: 50, lineas: ["*Exacto.*"], alarma: true },
      { tipo: "numero", dur: 130, etiqueta: "Yadiel · negocio digital", antes: "Antes: $5K/mes", desde: 5, hasta: 40, prefijo: "$", sufijo: "K/mes", nota: NOTA_LU },
      { tipo: "cierre", dur: 120, cta: "Comenta SISTEMA", sub: "Consultoría 1:1: te instalamos el sistema contigo", url: "@level_upmediapr" },
    ],
  },
  {
    id: "lu-05-casos", marca: "level-up", formato: "16:9", titulo: "No vendemos anuncios. Instalamos sistemas (casos)", angulo: "Prueba social",
    escenas: [
      { tipo: "gancho", dur: 90, etiqueta: "Level Up Media", lineas: ["No vendemos anuncios.", "Instalamos *sistemas*."] },
      { tipo: "casos", dur: 180, titulo: "Resultados de *clientes reales*", nota: NOTA_LU, casos: [
        { nombre: "Tinos", desde: 30, hasta: 100 }, { nombre: "RK Automatic", desde: 30, hasta: 100 },
        { nombre: "La Garita", desde: 25, hasta: 70 }, { nombre: "Yadiel", desde: 5, hasta: 40 },
      ] },
      { tipo: "gancho", dur: 100, etiqueta: "Caso real · Quiropráctico", lineas: ["El Dr. Bryan Vega recibe", "*25 a 50 pacientes nuevos*", "cada mes."], sub: NOTA_LU },
      { tipo: "gancho", dur: 90, lineas: ["+100 negocios en Puerto Rico", "ya *escalaron* con nosotros."] },
      { tipo: "cierre", dur: 140, ...CIERRE_LU },
    ],
  },
  {
    id: "lu-06-leads", marca: "level-up", formato: "9:16", titulo: "Te llegan leads pero no ventas", angulo: "El problema es lo que pasa después",
    tomas: [{ archivo: "tomas/lu-06-escritorio-noche.mp4", desde: 0, dur: 90, velo: 0.65 }],
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["Te llegan", "*leads*…", "pero no ventas."] },
      { tipo: "embudo", dur: 150, titulo: "Así se te *escapan*", etapas: ["Leads", "Respuesta", "Cita", "Venta"], fuga: "Nadie contestó a tiempo" },
      { tipo: "gancho", dur: 100, lineas: ["El problema no es el anuncio.", "Es lo que pasa *después*."] },
      { tipo: "pasos", dur: 110, titulo: "El sistema *completo*", pasos: ["Anuncio", "Respuesta en segundos", "Cita agendada", "Venta"] },
      { tipo: "cierre", dur: 150, ...CIERRE_LU },
    ],
  },

  /* ═════════ BORI (heybori.ai) ═════════ */
  {
    id: "bori-01-rompecabezas", marca: "bori", formato: "9:16", titulo: "Otras herramientas te dan una pieza. Bori es el rompecabezas completo", angulo: "Agencia en una plataforma",
    escenas: [
      { tipo: "gancho", dur: 80, lineas: ["Otras herramientas", "te dan una *pieza*."] },
      { tipo: "rompecabezas", dur: 160, antes: "Diseño. Anuncios. Estrategia. Publicación.", despues: "Bori es el rompecabezas *completo*.", piezas: ["Diseño", "Anuncios", "Estrategia", "Publicación"] },
      { tipo: "pasos", dur: 90, titulo: "Tu agencia de marketing *con IA*", pasos: ["Crea", "Publica", "Vende"] },
      { tipo: "cierre", dur: 120, ...CIERRE_BORI },
    ],
  },
  {
    id: "bori-02-comparativa", marca: "bori", formato: "16:9", titulo: "Lo que hoy pagas por lo mismo: agencia vs freelancer vs Bori", angulo: "Precio vs agencia",
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["¿Cuánto pagas hoy", "por tu *marketing*?"] },
      { tipo: "comparativa", dur: 220, titulo: "Lo que hoy pagas *por lo mismo*", nota: "Menos que una tarde de un diseñador freelance.", filas: [
        { nombre: "Agencia tradicional", precio: "$1,500+/mes", barra: 1, detalle: "Contrato de 3 a 6 meses" },
        { nombre: "Freelancer", precio: "$300–600/mes", barra: 0.4, detalle: "Si se va, se va con tu página" },
        { nombre: "Bori Pro", precio: "$99/mes", barra: 0.07, tuyo: true, detalle: "Crea, publica y vende. Cancelas cuando quieras." },
      ] },
      { tipo: "gancho", dur: 110, lineas: ["Tu cuenta. Tus datos.", "*Tu* control."] },
      { tipo: "cierre", dur: 180, cta: "Quiero Bori Pro →", sub: "Sin contrato. Cancelas cuando tú digas.", url: "heybori.ai" },
    ],
  },
  {
    id: "bori-03-10-minutos", marca: "bori", formato: "9:16", titulo: "De la idea al anuncio en 10 minutos", angulo: "Velocidad + sin Administrador de Anuncios",
    tomas: [{ archivo: "tomas/bori-03-barberia.mp4", desde: 0, dur: 150, velo: 0.6 }],
    escenas: [
      { tipo: "gancho", dur: 80, lineas: ["De la idea al anuncio", "en *10 minutos*."] },
      { tipo: "flyers", dur: 200, titulo: "Tú le dices qué quieres…", prompt: "Quiero llenar los martes en mi barbería", piezas: [
        { titulo: "Martes de fade", sub: "Reserva tu turno hoy" }, { titulo: "Tu barba, al día", sub: "Martes con cita" },
        { titulo: "Corte + barba", sub: "Solo los martes" }, { titulo: "Agenda abierta", sub: "Escríbenos por WhatsApp" },
      ] },
      { tipo: "aprobacion", dur: 170, titulo: "…y Bori monta la *campaña*.", campana: "Martes llenos · Barbería", detalle: "Público: 5 km a la redonda · 18 a 45 años", presupuesto: "$10/día · sale cuando tú digas" },
      { tipo: "cierre", dur: 150, cta: "Empieza en heybori.ai", sub: "Sin tocar el Administrador de Anuncios", url: "@heybori" },
    ],
  },
  {
    id: "bori-04-cada-semana", marca: "bori", formato: "9:16", titulo: "Cada semana sin anunciar, alguien más se lleva a tu cliente", angulo: "Costo de no anunciar",
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["Cada semana sin anunciar,", "alguien más se lleva", "a tu *cliente*."], alarma: true },
      { tipo: "semanas", dur: 150, titulo: "Tu competencia *no espera*", semanas: 8 },
      { tipo: "gancho", dur: 90, lineas: ["Bori crea, publica", "y vende *por ti*."] },
      { tipo: "cierre", dur: 120, ...CIERRE_BORI },
    ],
  },
  {
    id: "bori-05-tu-das-play", marca: "bori", formato: "16:9", titulo: "Bori nunca gasta tu dinero solo: tú le das play", angulo: "Confianza / control",
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["Bori nunca gasta", "tu dinero *solo*."] },
      { tipo: "aprobacion", dur: 180, titulo: "Revisas, y tú le das *play*.", campana: "Boutique · Nueva colección", detalle: "Destino: WhatsApp · Mujeres de 25 a 45", presupuesto: "$15/día · sale cuando tú digas" },
      { tipo: "cierre", dur: 180, cta: "Quiero Bori Pro →", sub: "Publicas cuando tú digas. Cancelas cuando tú digas.", url: "heybori.ai" },
    ],
  },

  /* ═════════ AI BORINQUEN (de usted) ═════════ */
  {
    id: "aib-01-8pm", marca: "ai-borinquen", formato: "9:16", titulo: "Si un cliente le escribe a las 8 de la noche, ¿quién le responde?", angulo: "Pierde leads de noche",
    tomas: [{ archivo: "tomas/aib-01-telefono-noche.mp4", desde: 0, dur: 130 }],
    escenas: [
      { tipo: "gancho", dur: 80, etiqueta: "8:07 PM", lineas: ["Si un cliente le escribe", "a las *8 de la noche*…"] },
      { tipo: "gancho", dur: 50, lineas: ["¿quién le *responde*?"], alarma: true },
      { tipo: "chat", dur: 190, titulo: "Su agente de IA. *En segundos.*", hora: "8:07 PM", nombre: "Asistente · Su negocio", burbujas: [
        { de: "cliente", texto: "Hola, ¿todavía están abiertos?", en: 14 },
        { de: "agente", texto: "¡Hola! Ahora mismo no, pero le separo una cita. ¿Mañana a las 9:00 o a las 11:00?", en: 40 },
        { de: "cliente", texto: "A las 9 me funciona", en: 80 },
        { de: "agente", texto: "Listo ✅ Le separé mañana a las 9:00 AM.", en: 112 },
      ] },
      { tipo: "cierre", dur: 130, ...CIERRE_AIB },
    ],
  },
  {
    id: "aib-02-se-le-escapan", marca: "ai-borinquen", formato: "9:16", titulo: "Su problema no es que le falten clientes: se le están escapando", angulo: "Velocidad = dinero",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["Su problema no es que", "le falten clientes."] },
      { tipo: "gancho", dur: 70, lineas: ["Es que se le están", "*escapando*."], alarma: true },
      { tipo: "dato", dur: 130, grande: "78%", texto: "de los clientes le compra al *primero* que responde." },
      { tipo: "roles", dur: 140, titulo: "Su agente de IA:", roles: ["Responde en segundos", "Califica", "Agenda la cita", "Da seguimiento"] },
      { tipo: "cierre", dur: 160, cta: "Agende su demo →", sub: "Funcionando en 21 días o no le corre la mensualidad" },
    ],
  },
  {
    id: "aib-03-empleado-digital", marca: "ai-borinquen", formato: "16:9", titulo: "No vendemos un chatbot: instalamos un empleado digital", angulo: "Agentes a la medida",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["No vendemos", "un *chatbot*."] },
      { tipo: "gancho", dur: 120, lineas: ["Instalamos un empleado digital", "con un *trabajo concreto*."] },
      { tipo: "roles", dur: 200, titulo: "Uno para cada puesto:", roles: ["Recepcionista", "Cobros", "Citas", "Seguimiento", "Encuestas"], sub: "Entrenado con *su* negocio, no copiado y pegado." },
      { tipo: "gancho", dur: 130, etiqueta: "Garantía", lineas: ["Funcionando en *21 días*", "o no le corre la mensualidad."], sub: "Sin contrato de permanencia." },
      { tipo: "cierre", dur: 200, ...CIERRE_AIB },
    ],
  },
  {
    id: "aib-04-una-sola-cosa", marca: "ai-borinquen", formato: "9:16", titulo: "No necesita automatizar toda su empresa: empiece por una sola cosa", angulo: "Automatice una sola cosa",
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["No necesita automatizar", "toda su empresa."] },
      { tipo: "gancho", dur: 70, lineas: ["Empiece por", "*una sola cosa*."] },
      { tipo: "roles", dur: 150, titulo: "¿Qué hace igual todos los días?", roles: ["Contestar", "Cobrar", "Confirmar citas", "Dar seguimiento"], sub: "Si lo hace igual todos los días, no tiene que hacerlo *usted*." },
      { tipo: "cierre", dur: 140, ...CIERRE_AIB },
    ],
  },
  {
    id: "aib-05-suena-robotico", marca: "ai-borinquen", formato: "16:9", titulo: "¿Y si mi agente suena robótico?", angulo: "Objeción #1 de voz",
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["¿Y si mi agente", "suena *robótico*?"] },
      { tipo: "llamada", dur: 170, titulo: "Voz boricua. Responde en menos de *1 segundo*.", quien: "Cliente nuevo", etiqueta: "Contestó su agente de voz" },
      { tipo: "cita", dur: 170, texto: "Me da tranquilidad saber que las conversaciones se siguen atendiendo.", autor: "Teo", rol: "TERAPISTA · MANO SANTA PR" },
      { tipo: "cierre", dur: 170, cta: "Agende su demo →", sub: "Llámelo y háblele en vivo en su demo" },
    ],
  },
];

/* ═════════════════ LOTE 2 (27/sep/2026) · 30 s · cada guion en 9:16 y 16:9 ═════════════════
   Guiones aprobados por Elvin: vault/proyectos/motion/guiones-lote-2.md */
type Guion = Omit<Anuncio, "formato">;
const ambos = (g: Guion): Anuncio[] => [
  { ...g, id: `${g.id}-9x16`, formato: "9:16" },
  { ...g, id: `${g.id}-16x9`, formato: "16:9" },
];

const CIERRE_BORI_30 = { cta: "Empieza en heybori.ai", sub: "Bori Pro · $99/mes · sin contrato", url: "@heybori" };

export const LOTE2: Guion[] = [
  /* ───── BORI ───── */
  {
    id: "bori-06-agencia-premium", marca: "bori", titulo: "Las marcas grandes tienen agencia. Tú ahora también.", angulo: "Democratizar el marketing",
    escenas: [
      { tipo: "gancho", dur: 90, lineas: ["Las marcas grandes", "tienen una *agencia*."] },
      { tipo: "gancho", dur: 60, lineas: ["Tú ahora *también*."] },
      { tipo: "comparativa", dur: 190, titulo: "Lo que cuesta *una agencia*", filas: [
        { nombre: "Agencia tradicional", precio: "$1,500+/mes", barra: 1, detalle: "Contrato de 3 a 6 meses" },
        { nombre: "Bori Pro", precio: "$99/mes", barra: 0.07, tuyo: true, detalle: "Sin contrato. Cancelas cuando quieras." },
      ] },
      { tipo: "gancho", dur: 90, logo: true, lineas: ["Tu agencia *premium*", "en un solo lugar."] },
      { tipo: "pasos", dur: 180, titulo: "Bori hace el trabajo *completo*", pasos: ["Crea tus flyers y videos", "Publica tu campaña en Meta", "Vende con tu asistente 24/7"] },
      { tipo: "gancho", dur: 110, lineas: ["El marketing ya no es solo", "para el que tiene *miles*."] },
      { tipo: "cierre", dur: 180, ...CIERRE_BORI_30 },
    ],
  },
  {
    id: "bori-07-no-tienes-que-aprender", marca: "bori", titulo: "No sabes hacer anuncios. Ya no tienes que aprender.", angulo: "Sin saber de anuncios",
    tomas: [{ archivo: "tomas/bori-07-reposteria.mp4", desde: 0, dur: 100, velo: 0.6 }, { archivo: "tomas/bori-07-reposteria.mp4", desde: 470, dur: 110, velo: 0.6 }],
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["No sabes hacer anuncios.", "Ya no tienes que *aprender*."] },
      { tipo: "flyers", dur: 200, titulo: "Tú le dices qué quieres…", prompt: "Quiero vender más bizcochos este fin de semana", piezas: [
        { titulo: "Tres leches", sub: "Encárgalo para el sábado" }, { titulo: "Flan de la casa", sub: "Solo este fin de semana" },
        { titulo: "Bizcocho de fiesta", sub: "Pide el tuyo por WhatsApp" }, { titulo: "Recién horneado", sub: "Recógelo el domingo" },
        { titulo: "Postres del finde", sub: "Quedan pocos" }, { titulo: "Dulce boricua", sub: "Hecho en casa" },
      ] },
      { tipo: "aprobacion", dur: 170, titulo: "…y Bori monta la *campaña*.", campana: "Bizcochos del fin de semana", detalle: "Público: 8 km a la redonda · 25 a 55 años", presupuesto: "$10/día · sale cuando tú digas" },
      { tipo: "gancho", dur: 110, lineas: ["De la idea al anuncio", "en *10 minutos*."] },
      { tipo: "cita", dur: 150, texto: "Una boutique de Caguas hizo 43 flyers y publicó su primera campaña en su primera semana.", autor: "Boutique en Caguas", rol: "CLIENTA DE BORI" },
      { tipo: "cierre", dur: 170, ...CIERRE_BORI_30 },
    ],
  },
  {
    id: "bori-08-equipo-en-una-app", marca: "bori", titulo: "Diseñador, estratega, trafficker y editor en una sola app", angulo: "Equipo completo por $99",
    escenas: [
      { tipo: "gancho", dur: 110, lineas: ["Diseñador. Estratega.", "Trafficker. *Editor*."] },
      { tipo: "rompecabezas", dur: 170, antes: "Todo esto, por separado…", despues: "…Bori lo tiene *todo*.", piezas: ["Diseñador", "Estratega", "Trafficker", "Editor"] },
      { tipo: "comparativa", dur: 150, titulo: "Un equipo de marketing *vs* Bori", filas: [
        { nombre: "Equipo de marketing", precio: "$3,000/mes", barra: 1, detalle: "Sueldos, herramientas y contratos" },
        { nombre: "Bori Pro", precio: "$99/mes", barra: 0.033, tuyo: true, detalle: "Todo el equipo, en una app" },
      ] },
      { tipo: "roles", dur: 170, titulo: "Bori:", roles: ["Crea flyers", "Hace videos", "Diseña la estrategia", "Monta la campaña", "Te contesta 24/7"] },
      { tipo: "gancho", dur: 120, lineas: ["Y cabe en tu *celular*."], sub: "heybori.ai/movil" },
      { tipo: "cierre", dur: 180, ...CIERRE_BORI_30 },
    ],
  },

  /* ───── AI BORINQUEN (de usted) ───── */
  {
    id: "aib-06-autoflow-lanzamiento", marca: "ai-borinquen", titulo: "Presentamos AutoFlow: toda su atención al cliente, en automático", angulo: "Lanzamiento AutoFlow · todos los canales",
    tomas: [{ archivo: "tomas/aib-06-recepcion.mp4", desde: 0, dur: 100 }],
    escenas: [
      { tipo: "gancho", dur: 100, logo: true, etiqueta: "Nuevo", lineas: ["Presentamos *AutoFlow*."], sub: "Toda su atención al cliente, en automático." },
      { tipo: "notificaciones", dur: 170, lineas: ["Todo le llega", "*a la vez*…"], hora: "7:42", items: [
        { titulo: "Llamada perdida", detalle: "Cliente nuevo", hora: "7:40 PM", icono: "llamada" },
        { titulo: "WhatsApp", detalle: "¿Tienen cita hoy?", hora: "7:41 PM", icono: "mensaje", color: "#25D366" },
        { titulo: "Instagram", detalle: "¿Cuánto cuesta?", hora: "7:41 PM", icono: "mensaje", color: "#E1306C" },
        { titulo: "Facebook", detalle: "¿Están abiertos?", hora: "7:42 PM", icono: "mensaje", color: "#1877F2" },
        { titulo: "Página web", detalle: "Formulario nuevo", hora: "7:42 PM", icono: "mensaje", color: "#1FB6A6" },
      ] },
      { tipo: "gancho", dur: 90, lineas: ["Una recepcionista de IA", "para *todos* sus canales."] },
      { tipo: "roles", dur: 150, titulo: "AutoFlow:", roles: ["Contesta", "Agenda", "Confirma", "Da seguimiento", "Le avisa a usted"] },
      { tipo: "llamada", dur: 130, titulo: "Contesta la *llamada*…", quien: "Cliente nuevo", etiqueta: "Contestó AutoFlow" },
      { tipo: "chat", dur: 130, titulo: "…y agenda por *WhatsApp*.", nombre: "AutoFlow · Su negocio", burbujas: [
        { de: "cliente", texto: "¿Tienen cita para hoy?", en: 10 },
        { de: "agente", texto: "¡Sí! Tengo 5:30 PM. ¿Se la separo?", en: 34 },
        { de: "cliente", texto: "Sí, por favor", en: 62 },
        { de: "agente", texto: "Listo ✅ Le separé hoy a las 5:30 PM.", en: 86 },
      ] },
      { tipo: "cierre", dur: 130, cta: "Agende su demo →", sub: "Funcionando en 21 días o no le corre la mensualidad" },
    ],
  },
  {
    id: "aib-07-atencion-24-7", marca: "ai-borinquen", titulo: "¿Cuántos clientes se le fueron hoy por no contestar?", angulo: "Automatizar la atención al cliente",
    escenas: [
      { tipo: "gancho", dur: 100, alarma: true, lineas: ["¿Cuántos clientes se le fueron hoy", "por no *contestar*?"] },
      { tipo: "comparativa", dur: 170, titulo: "¿Cuánto tarda en *responder*?", filas: [
        { nombre: "Su equipo", precio: "4 horas", barra: 1, detalle: "Cuando puede, en horario de oficina" },
        { nombre: "Su agente de IA", precio: "10 segundos", barra: 0.03, tuyo: true, detalle: "Voz y chat, 24/7" },
      ] },
      { tipo: "roles", dur: 160, titulo: "Su agente, 24/7:", roles: ["Responde", "Califica", "Agenda", "Confirma", "Da seguimiento"] },
      { tipo: "chat", dur: 180, titulo: "Voz y chat. *A toda hora.*", hora: "10:15 PM", nombre: "Asistente · Su negocio", burbujas: [
        { de: "cliente", texto: "Hola, ¿cómo funciona la evaluación?", en: 12 },
        { de: "agente", texto: "¡Hola! Con gusto le explico. ¿Le separo una evaluación mañana a las 10:00 o a las 2:00?", en: 36 },
        { de: "cliente", texto: "A las 10", en: 80 },
        { de: "agente", texto: "Listo ✅ Mañana 10:00 AM. Le envío la confirmación.", en: 110 },
      ] },
      { tipo: "cita", dur: 150, texto: "Me da tranquilidad saber que las conversaciones se siguen atendiendo.", autor: "Teo", rol: "TERAPISTA · MANO SANTA PR" },
      { tipo: "cierre", dur: 140, cta: "Agende su demo →", sub: "Llámelo y háblele en vivo en su demo" },
    ],
  },
  {
    id: "aib-08-asistente-personal", marca: "ai-borinquen", titulo: "Su asistente personal de IA: usted le habla y él lo hace", angulo: "Agente personalizado (caso Plagas PR)",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["¿Y si tuviera un asistente", "que hace lo que usted le *dice*?"] },
      { tipo: "voz", dur: 200, orden: "Sácame una cita con el contable el jueves en la tarde.", respuesta: "Listo. Le separé el jueves a las 3:00 PM y le envié la invitación.", evento: { titulo: "Reunión con el contable", cuando: "Jueves · 3:00 PM" } },
      { tipo: "agenda", dur: 170, pregunta: "¿Qué tengo mañana?", dia: "Mañana · viernes", items: [
        { hora: "9:00 AM", texto: "Visita a cliente" }, { hora: "11:30 AM", texto: "Enviar cotización (lista)" },
        { hora: "2:00 PM", texto: "Junta con el equipo" }, { hora: "4:30 PM", texto: "Llamar al proveedor" },
      ] },
      { tipo: "roles", dur: 150, titulo: "Su asistente personal:", roles: ["Saca citas", "Revisa su calendario", "Pide documentos", "Envía las juntas", "Le recuerda lo pendiente"] },
      // [CONFIRMAR con Gilbert antes de pautar] la etiqueta nombra al cliente; sin su OK, quitar `etiqueta`.
      { tipo: "gancho", dur: 130, etiqueta: "Ya lo usa Plagas Puerto Rico", lineas: ["Hecho a la medida", "de *su* negocio."] },
      { tipo: "cierre", dur: 150, cta: "Agende su demo →", sub: "Su asistente personal de IA, entrenado con su negocio" },
    ],
  },
  {
    id: "aib-09-suscripciones", marca: "ai-borinquen", titulo: "Deje de pagar suscripciones: tenga su propio sistema", angulo: "Bajar costos operativos con IA",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["¿Cuántas suscripciones paga al mes", "para operar su *negocio*?"] },
      { tipo: "lista", dur: 190, modo: "sumar", titulo: "Lo que paga *cada mes*:", items: [
        { texto: "CRM", monto: "/mes" }, { texto: "Agenda en línea", monto: "/mes" }, { texto: "Formularios", monto: "/mes" },
        { texto: "Email marketing", monto: "/mes" }, { texto: "Encuestas", monto: "/mes" }, { texto: "Reportes", monto: "/mes" },
      ] },
      { tipo: "gancho", dur: 90, lineas: ["¿Y si fueran *suyas*?"] },
      { tipo: "rompecabezas", dur: 170, antes: "Hoy: muchas plataformas, muchas mensualidades.", despues: "Mañana: *su propio* sistema.", piezas: ["Su CRM", "Su agenda", "Sus formularios", "Sus reportes"] },
      { tipo: "pasos", dur: 150, titulo: "Se lo construimos *a la medida*", pasos: ["Revisamos lo que paga", "Construimos lo suyo", "Cancela lo que sobra"] },
      { tipo: "cierre", dur: 200, cta: "Agende su demo →", sub: "Bájele el costo a la operación, no a la atención." },
    ],
  },

  /* ───── LEVEL UP (de tú) ───── */
  {
    id: "lu-07-autoflow-llego", marca: "level-up", titulo: "Nuevo en Level Up: llegó AutoFlow", angulo: "Lanzamiento AutoFlow (voz + chat + CRM)",
    escenas: [
      { tipo: "gancho", dur: 100, logo: true, etiqueta: "Nuevo en Level Up", lineas: ["Llegó *AutoFlow*."] },
      { tipo: "embudo", dur: 170, titulo: "Tus leads se *escapan* aquí", etapas: ["Leads", "Respuesta", "Cita", "Venta"], fuga: "Nadie contestó a tiempo" },
      { tipo: "gancho", dur: 110, lineas: ["Tus anuncios traen el cliente.", "AutoFlow lo *contesta*."] },
      { tipo: "pasos", dur: 170, titulo: "AutoFlow: tu *equipo digital*", pasos: ["Agente de voz: contesta cada llamada", "Agente de chat: responde y agenda", "CRM: todos tus leads en un lugar"] },
      { tipo: "chat", dur: 180, titulo: "Lead de las 10 PM, *agendado*.", hora: "10:04 PM", nombre: "AutoFlow · Tu negocio", burbujas: [
        { de: "cliente", texto: "Vi su anuncio, ¿cómo funciona?", en: 12 },
        { de: "agente", texto: "¡Hola! Te explico en una llamada de 15 min. ¿Mañana a las 10:00 o a las 3:00?", en: 38 },
        { de: "cliente", texto: "A las 3", en: 84 },
        { de: "agente", texto: "Listo ✅ Mañana 3:00 PM. Te llega la confirmación.", en: 112 },
      ] },
      { tipo: "cierre", dur: 170, cta: "Haz tu diagnóstico →", sub: "Anuncios + AutoFlow = el sistema completo", url: "@level_upmediapr" },
    ],
  },
  {
    id: "lu-08-referidos-tinos", marca: "level-up", titulo: "Si tu plan es que te recomienden, no tienes un plan (Tinos, 30 s)", angulo: "Depender de referidos + caso Tinos",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["Si tu plan es que", "alguien te *recomiende*…"] },
      { tipo: "gancho", dur: 70, alarma: true, lineas: ["…no tienes", "un *plan*."] },
      { tipo: "semanas", dur: 170, titulo: "Cada semana esperando un *referido*", semanas: 8 },
      { tipo: "numero", dur: 200, etiqueta: "Restaurante Tinos · Cabo Rojo", antes: "Antes: $30K/mes", desde: 30, hasta: 100, prefijo: "$", sufijo: "K/mes", nota: NOTA_LU },
      { tipo: "gancho", dur: 120, lineas: ["No fue un anuncio.", "Fue un *sistema*."] },
      { tipo: "pasos", dur: 100, titulo: "El sistema *Level Up*", pasos: ["Tráfico con Meta Ads", "Ventas que se cierran", "Automatización con IA"] },
      { tipo: "cierre", dur: 140, ...CIERRE_LU },
    ],
  },
  {
    id: "lu-09-escalar-10k", marca: "level-up", titulo: "¿Ya facturas $10K al mes? Lo difícil es escalar", angulo: "Negocios de $10K+ que quieren escalar",
    tomas: [{ archivo: "tomas/lu-09-restaurante.mp4", desde: 0, dur: 100, velo: 0.62 }],
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["¿Ya facturas", "*$10K* al mes?"] },
      { tipo: "gancho", dur: 90, lineas: ["Lo difícil no es vender.", "Es *escalar*."] },
      { tipo: "casos", dur: 170, titulo: "Negocios que ya *escalaron*", nota: NOTA_LU, casos: [
        { nombre: "Tinos", desde: 30, hasta: 100 }, { nombre: "RK Automatic", desde: 30, hasta: 100 }, { nombre: "La Garita", desde: 25, hasta: 70 },
      ] },
      { tipo: "gancho", dur: 120, etiqueta: "Caso real · Quiropráctico", lineas: ["El Dr. Bryan Vega recibe", "*25 a 50 pacientes nuevos*", "cada mes."], sub: NOTA_LU },
      { tipo: "pasos", dur: 140, titulo: "Cómo lo *hacemos*", pasos: ["Oferta", "Estrategia", "Contenido", "Anuncios con IA", "Leads automatizados", "Escalar lo que funciona"] },
      { tipo: "gancho", dur: 120, lineas: ["Escalamos lo que", "*ya* te funciona."] },
      { tipo: "cierre", dur: 160, ...CIERRE_LU },
    ],
  },
  {
    id: "lu-10-te-quemo-una-agencia", marca: "level-up", titulo: "¿Ya te quemó una agencia?", angulo: "Mala experiencia con otra agencia",
    escenas: [
      { tipo: "gancho", dur: 100, alarma: true, lineas: ["¿Ya te quemó", "una *agencia*?"] },
      { tipo: "lista", dur: 200, modo: "tachar", titulo: "Lo que ya *viviste*:", items: [
        { texto: "Reportes que no entiendes" }, { texto: "Te contestan cuando pueden" }, { texto: "Contrato largo" }, { texto: "Cero resultados" },
      ] },
      { tipo: "gancho", dur: 110, lineas: ["Aquí es distinto.", "Y lo ponemos *por escrito*."] },
      { tipo: "pasos", dur: 170, titulo: "Así *trabajamos*", pasos: ["Contratos legales", "Expectativas por escrito antes de firmar", "Garantizamos tráfico y estrategia"] },
      { tipo: "gancho", dur: 150, etiqueta: "Level Up Media", lineas: ["+100 negocios en Puerto Rico.", "+12 meses *operando*."] },
      { tipo: "cierre", dur: 170, ...CIERRE_LU },
    ],
  },
];

ANUNCIOS.push(...LOTE2.flatMap(ambos));

/* ═════════════════ RITMO · presentación interna al equipo (27/sep/2026) ═════════════════
   Capturas REALES de la app con datos FICTICIOS (copia demo en /Users/elvinayala/ritmo-demo, nunca producción).
   16:9 = capturas de computadora en laptop (para Slack); 9:16 = capturas de celular en teléfono. */
const RITMO_GUION: Guion = {
  id: "ritmo-presentacion", marca: "ritmo", titulo: "Bienvenidos a Ritmo: la plataforma oficial del equipo", angulo: "Lanzamiento interno",
  escenas: [
    { tipo: "gancho", dur: 90, logo: true, etiqueta: "Ya está aquí", lineas: ["Bienvenidos a *Ritmo*."], sub: "La plataforma oficial del equipo." },
    { tipo: "gancho", dur: 90, lineas: ["Tu día, tus solicitudes y tu crecimiento,", "en *un solo lugar*."] },
    { tipo: "pantalla", dur: 180, imagen: "ritmo/emp-hoy-pc.png", dispositivo: "laptop", titulo: "Marca tu *entrada y salida*", sub: "Un toque al llegar y otro al salir, con la hora oficial de Puerto Rico.",
      puntos: ["Horario flexible, en tramos", "¿Se te olvidó la salida? La corriges y tu líder la confirma", "Tu semana, a la vista"], foco: { x: 0.36, y: 0.2, w: 0.28, h: 0.45 } },
    { tipo: "gancho", dur: 100, lineas: ["Sin capturas. Sin GPS.", "Sin *vigilancia*."], sub: "Ritmo mide lo que ya haces, con reglas claras para todos." },
    { tipo: "pantalla", dur: 170, imagen: "ritmo/emp-solicitudes-pc.png", dispositivo: "laptop", titulo: "Pide tus días *sin papeles*", sub: "Días libres, vacaciones, permisos o una carta.",
      puntos: ["Tu supervisor lo aprueba", "RR.HH. lo firma", "Te avisamos en cada paso"], foco: { x: 0.22, y: 0.14, w: 0.56, h: 0.4 } },
    { tipo: "pantalla", dur: 170, imagen: "ritmo/emp-carreras-pc.png", dispositivo: "laptop", titulo: "*Crece* aquí adentro", sub: "Las vacantes nuevas se publican primero en Ritmo.",
      puntos: ["Aplica para crecer o cambiar de puesto", "Refiere a alguien y gana un bono", "El bono entra en tu nómina"], foco: { x: 0.22, y: 0.2, w: 0.56, h: 0.24 } },
    { tipo: "pantalla", dur: 170, imagen: "ritmo/emp-bienestar-pc.png", dispositivo: "laptop", titulo: "Cuídate con *Bienestar*", sub: "Pausas activas de 5 minutos, tu ejercicio y tu energía.",
      puntos: ["Voluntario y privado", "No cuenta para tu desempeño", "Únete a la comunidad del equipo, si quieres"], foco: { x: 0.22, y: 0.18, w: 0.58, h: 0.5 } },
    { tipo: "pantalla", dur: 150, imagen: "ritmo/emp-noticias-pc.png", dispositivo: "laptop", titulo: "Entérate de *todo*", sub: "Logros del equipo, comunicados y causas que apoyamos." },
    { tipo: "pantalla", dur: 190, imagen: "ritmo/lider-equipo-pc.png", dispositivo: "laptop", titulo: "Líderes: *tu equipo* de un vistazo", sub: "Quién llegó, qué se terminó y dónde hace falta una mano.",
      puntos: ["Presentes, sin marcar y vencidas", "Solo ves a tu gente", "Confirmas correcciones en un toque"], foco: { x: 0.14, y: 0.3, w: 0.72, h: 0.24 } },
    { tipo: "pantalla", dur: 150, imagen: "ritmo/emp-etica-pc.png", dispositivo: "laptop", titulo: "¿Viste algo que *no está bien*?", sub: "El canal ético es privado: puedes reportar de forma anónima." },
    { tipo: "gancho", dur: 110, lineas: ["Tu ritmo.", "El de *todo el equipo*."] },
    { tipo: "cierre", dur: 230, cta: "Entra hoy →", sub: "Usa tu link de acceso y guárdala en tu celular como una app", url: "ritmo.levelupmediapr.net" },
  ],
};
// Versión vertical: mismas escenas con las capturas de celular en un teléfono (sin zoom: la pantalla entera ya se lee).
const aVertical = (g: Guion): Anuncio => ({
  ...g, id: `${g.id}-9x16`, formato: "9:16",
  escenas: g.escenas.map((e) => (e.tipo === "pantalla" ? { ...e, imagen: e.imagen.replace("-pc.png", "-cel.png"), dispositivo: "telefono", foco: undefined, puntos: e.puntos?.slice(0, 2) } : e)),
});
ANUNCIOS.push({ ...RITMO_GUION, id: `${RITMO_GUION.id}-16x9`, formato: "16:9" }, aVertical(RITMO_GUION));

/* ═════════════════ BORI · recorrido por la app (27/sep/2026, 60 s) ═════════════════
   Capturas REALES de la app con un negocio FICTICIO (Barbería La Esquina, copia demo en /Users/elvinayala/bori-demo,
   sin producción ni APIs pagas). */
const BORI_RECORRIDO: Guion = {
  id: "bori-recorrido-app", marca: "bori", titulo: "Bori por dentro: recorrido de la app en 60 s", angulo: "Demo del producto", musica: "audio/bori-musica-60.mp3",
  escenas: [
    { tipo: "gancho", dur: 90, logo: true, lineas: ["Esto es *Bori*."], sub: "Tu agencia de marketing con IA, en un solo lugar." },
    { tipo: "gancho", dur: 70, lineas: ["Entra conmigo.", "Así se ve *por dentro*."] },
    { tipo: "pantalla", dur: 180, imagen: "bori-app/dashboard-pc.png", dispositivo: "laptop", titulo: "Tu negocio en *un vistazo*", sub: "Tus campañas, lo que inviertes y lo que te traen, en vivo.",
      puntos: ["Campañas activas y en pausa", "Gasto por día", "Tu mejor anuncio"], foco: { x: 0.09, y: 0.18, w: 0.6, h: 0.3 } },
    { tipo: "pantalla", dur: 130, imagen: "bori-app/generador-pedido-pc.png", dispositivo: "laptop", titulo: "Dile qué *vendes*…", sub: "Tu negocio, en una línea.", foco: { x: 0.08, y: 0.14, w: 0.32, h: 0.24 } },
    { tipo: "pantalla", dur: 180, imagen: "bori-app/generador-resultado-pc.png", dispositivo: "laptop", titulo: "…y Bori *diseña* tus anuncios", sub: "En segundos, con tu marca.",
      puntos: ["Flyers listos para Meta", "Copy escrito", "Predicción de potencial"], foco: { x: 0.36, y: 0.15, w: 0.44, h: 0.55 } },
    { tipo: "pantalla", dur: 170, imagen: "bori-app/campanas-pc.png", dispositivo: "laptop", titulo: "Tu campaña en *3 clics*", sub: "Estrategias probadas. Bori la monta en tu Meta, en pausa.",
      puntos: ["Público y presupuesto listos", "Sin tocar el Administrador de Anuncios"] },
    { tipo: "pantalla", dur: 190, imagen: "bori-app/chat-aprobacion-pc.png", dispositivo: "laptop", titulo: "Háblale a *Bori*", sub: "Te dice cómo van tus anuncios y te pide permiso antes de gastar.",
      puntos: ["Tú apruebas", "Bori lo hace"], foco: { x: 0.72, y: 0.33, w: 0.27, h: 0.6 } },
    { tipo: "pantalla", dur: 150, imagen: "bori-app/crm-pc.png", dispositivo: "laptop", titulo: "Cada cliente, en su *columna*", sub: "Tu CRM: nuevos, contactados, citas y ganados." },
    { tipo: "pantalla", dur: 150, imagen: "bori-app/movil-inicio-cel.png", dispositivo: "telefono", titulo: "Y en tu *celular*", sub: "Pídele flyers, anuncios o ideas. Yo lo hago; tú apruebas." },
    { tipo: "pantalla", dur: 150, imagen: "bori-app/planes-pc.png", dispositivo: "laptop", titulo: "Todo esto por *$99 al mes*", sub: "Bori Pro. Sin contrato: cancelas cuando quieras.", foco: { x: 0.19, y: 0.12, w: 0.22, h: 0.6 } },
    { tipo: "gancho", dur: 100, lineas: ["Crea. Publica.", "*Vende.*"] },
    { tipo: "cierre", dur: 240, cta: "Empieza en heybori.ai", sub: "Tu primer anuncio en 10 minutos", url: "@heybori" },
  ],
};
ANUNCIOS.push({ ...BORI_RECORRIDO, id: `${BORI_RECORRIDO.id}-16x9`, formato: "16:9" }, { ...BORI_RECORRIDO, id: `${BORI_RECORRIDO.id}-9x16`, formato: "9:16" });

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
    id: "aib-01-8pm", marca: "ai-borinquen", formato: "16:9", titulo: "Si un cliente le escribe a las 8 de la noche, ¿quién le responde?", angulo: "Pierde leads de noche",
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
    id: "aib-02-se-le-escapan", marca: "ai-borinquen", formato: "16:9", titulo: "Su problema no es que le falten clientes: se le están escapando", angulo: "Velocidad = dinero",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["Su problema no es que", "le falten clientes."] },
      { tipo: "gancho", dur: 70, lineas: ["Es que se le están", "*escapando*."], alarma: true },
      { tipo: "dato", dur: 130, grande: "78%", texto: "de los clientes le compra al *primero* que responde." },
      { tipo: "roles", dur: 140, titulo: "Su agente de IA:", roles: ["Responde en segundos", "Califica", "Agenda la cita", "Da seguimiento"] },
      { tipo: "cierre", dur: 160, cta: "Agende su demo →", sub: "Su sistema en marcha en 15 días · optimización hasta el día 45" },
    ],
  },
  {
    id: "aib-03-empleado-digital", marca: "ai-borinquen", formato: "16:9", titulo: "No vendemos un chatbot: instalamos un empleado digital", angulo: "Agentes a la medida",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["No vendemos", "un *chatbot*."] },
      { tipo: "gancho", dur: 120, lineas: ["Instalamos un empleado digital", "con un *trabajo concreto*."] },
      { tipo: "roles", dur: 200, titulo: "Uno para cada puesto:", roles: ["Recepcionista", "Cobros", "Citas", "Seguimiento", "Encuestas"], sub: "Entrenado con *su* negocio, no copiado y pegado." },
      { tipo: "gancho", dur: 130, etiqueta: "AutoFlow", lineas: ["Su sistema en marcha en *15 días*.", "Optimizado hasta el *día 45*."], sub: "Y si quiere, soporte para siempre." },
      { tipo: "cierre", dur: 200, ...CIERRE_AIB },
    ],
  },
  {
    id: "aib-04-una-sola-cosa", marca: "ai-borinquen", formato: "16:9", titulo: "No necesita automatizar toda su empresa: empiece por una sola cosa", angulo: "Automatice una sola cosa",
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
// AI Borinquen va solo en horizontal (Elvin, 27/sep/2026); las demás marcas en los dos formatos.
const ambos = (g: Guion): Anuncio[] => [
  ...(g.marca === "ai-borinquen" ? [] : [{ ...g, id: `${g.id}-9x16`, formato: "9:16" as const }]),
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
      { tipo: "cierre", dur: 130, cta: "Agende su demo →", sub: "Su sistema en marcha en 15 días · optimización hasta el día 45" },
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

/* ═════════════════ BORI · tutorial para clientes que compraron (30/sep/2026, ~76 s) ═════════════════
   Guía paso a paso de cómo usar Bori por dentro, para entregarla al comprar. Mismas capturas REALES de la copia
   demo (Barbería La Esquina, negocio ficticio) + Conexiones. Sin precios ni promesas: el cliente ya compró. */
const BORI_TUTORIAL: Guion = {
  id: "bori-tutorial", marca: "bori", titulo: "Cómo usar Bori: tutorial paso a paso", angulo: "Onboarding del cliente", musica: "audio/bori-tutorial.mp3", barridoSiempre: true,
  escenas: [
    { tipo: "gancho", dur: 90, logo: true, lineas: ["Bienvenido a *Bori*."], sub: "Te enseño a usarlo en 5 pasos." },
    { tipo: "pasos", dur: 150, titulo: "Tu ruta en *Bori*", pasos: ["Cuéntale tu negocio", "Conecta tu Meta", "Crea tus anuncios", "Lanza tu campaña", "Mira tus resultados"] },
    { tipo: "pantalla", dur: 200, imagen: "bori-app/config-pc.png", dispositivo: "laptop", titulo: "Paso 1 · Cuéntale *tu negocio*",
      sub: "Configuración → Marca. Grábale un audio o llena los campos: Bori lo usa en cada anuncio.",
      puntos: ["Qué vendes y a quién", "Tu oferta y tu CTA", "Tu logo"], foco: { x: 0.19, y: 0.38, w: 0.6, h: 0.42 } },
    { tipo: "pantalla", dur: 200, imagen: "bori-app/conexiones-pc.png", dispositivo: "laptop", titulo: "Paso 2 · Conecta *tu Meta*",
      sub: "Configuración → Conexiones. Bori publica en tu cuenta, con tu presupuesto.",
      puntos: ["Tu cuenta de anuncios", "Tu página e Instagram", "Tu píxel"], foco: { x: 0.19, y: 0.25, w: 0.46, h: 0.5 } },
    { tipo: "pantalla", dur: 150, imagen: "bori-app/generador-pedido-pc.png", dispositivo: "laptop", titulo: "Paso 3 · Dile qué *vendes*…",
      sub: "Generador AI: tu negocio en una línea y toca «Generar anuncios».", foco: { x: 0.08, y: 0.14, w: 0.32, h: 0.24 } },
    { tipo: "pantalla", dur: 170, imagen: "bori-app/generador-resultado-pc.png", dispositivo: "laptop", titulo: "…y Bori *diseña* tus anuncios",
      sub: "En segundos, con tu marca.", puntos: ["Varias versiones", "Copy escrito", "Predicción de potencial"], foco: { x: 0.36, y: 0.15, w: 0.44, h: 0.55 } },
    { tipo: "pantalla", dur: 150, imagen: "bori-app/baul-pc.png", dispositivo: "laptop", titulo: "Todo queda en tu *Baúl*",
      sub: "Cada pieza se guarda sola: descárgala, edítala o úsala en una campaña." },
    { tipo: "pantalla", dur: 200, imagen: "bori-app/campanas-pc.png", dispositivo: "laptop", titulo: "Paso 4 · Tu campaña en *3 clics*",
      sub: "Escoge la estrategia, revisa los creativos y publica. Se crea en pausa: tú la activas.",
      puntos: ["1 · Estrategia", "2 · Revisa los creativos", "3 · Publica"] },
    { tipo: "pantalla", dur: 180, imagen: "bori-app/dashboard-pc.png", dispositivo: "laptop", titulo: "Paso 5 · Mira tus *resultados*",
      sub: "Dashboard: lo que inviertes, lo que te traen y tu mejor anuncio, en vivo.", foco: { x: 0.09, y: 0.18, w: 0.6, h: 0.3 } },
    { tipo: "pantalla", dur: 190, imagen: "bori-app/chat-aprobacion-pc.png", dispositivo: "laptop", titulo: "¿Dudas? *Pregúntale a Bori*",
      sub: "El botón del coquí abre tu estratega: te dice cómo van tus anuncios y te pide permiso antes de gastar.",
      puntos: ["Tú apruebas", "Bori lo hace"], foco: { x: 0.72, y: 0.33, w: 0.27, h: 0.6 } },
    { tipo: "pantalla", dur: 150, imagen: "bori-app/crm-pc.png", dispositivo: "laptop", titulo: "Tus clientes, *en orden*",
      sub: "CRM: cada persona que te escribe, en su columna. Arrástrala cuando avance." },
    { tipo: "pantalla", dur: 150, imagen: "bori-app/movil-inicio-cel.png", dispositivo: "telefono", titulo: "Y en tu *celular*",
      sub: "Pídele flyers, anuncios o ideas desde donde estés." },
    { tipo: "gancho", dur: 90, lineas: ["Crea. Publica.", "*Vende.*"] },
    { tipo: "cierre", dur: 210, cta: "Entra a heybori.ai", sub: "Cualquier duda, pregúntale a Bori dentro de la app.", url: "@heybori" },
  ],
};
ANUNCIOS.push({ ...BORI_TUTORIAL, id: `${BORI_TUTORIAL.id}-16x9`, formato: "16:9" }, { ...BORI_TUTORIAL, id: `${BORI_TUTORIAL.id}-9x16`, formato: "9:16" });

/* ═════════════════ LOTE 3 (27/sep/2026) · 30 s · 9:16 y 16:9 ═════════════════
   Ángulos aprobados: vault/proyectos/motion/angulos-lote-3.md (AIB 1,2,3,6 · Bori 1,2,3,7) + Level Up (ángulos núcleo
   que faltaban de vault/estilo/level-up.md). Bori usa pantallas reales de la app (copia demo, negocio ficticio). */
const CIERRE_AIB_30 = { cta: "Agende su demo →", sub: "Agentes de IA de voz y chat, a la medida de su negocio" };

export const LOTE3: Guion[] = [
  /* ───── AI BORINQUEN (de usted) ───── */
  {
    id: "aib-10-crecer-sin-contratar", marca: "ai-borinquen", titulo: "¿Más empleados o que los que tiene rindan el doble?", angulo: "Crecer sin contratar más",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["¿Necesita más empleados…", "o que los que tiene *rindan el doble*?"] },
      { tipo: "lista", dur: 190, modo: "tachar", titulo: "Lo que su equipo hace a mano *todos los días*:", items: [
        { texto: "Contestar los mismos mensajes" }, { texto: "Confirmar citas" }, { texto: "Dar seguimiento" }, { texto: "Responder las mismas preguntas" },
      ] },
      { tipo: "gancho", dur: 90, lineas: ["Eso lo hace", "su *agente de IA*."] },
      { tipo: "roles", dur: 150, titulo: "Y su equipo queda para:", roles: ["Vender", "Atender en persona", "Hacer crecer el negocio"] },
      { tipo: "gancho", dur: 140, lineas: ["No contrate por contratar.", "*Maximice* a su personal con IA."] },
      { tipo: "cierre", dur: 230, cta: "Agende su demo →", sub: "Crezca sin agrandar la nómina" },
    ],
  },
  {
    id: "aib-11-leads-que-ya-pago", marca: "ai-borinquen", titulo: "Antes de gastar más en publicidad, mire los leads que ya pagó", angulo: "Leads que ya pagó (caso Teo)",
    escenas: [
      { tipo: "gancho", dur: 110, lineas: ["Antes de gastar más en publicidad,", "mire los leads que *ya pagó*."] },
      { tipo: "embudo", dur: 170, titulo: "¿Cuántos se quedan *sin contestar*?", etapas: ["Leads pagados", "Respuesta", "Cita", "Venta"], fuga: "Nadie contestó a tiempo" },
      { tipo: "gancho", dur: 150, etiqueta: "Caso real · Mano Santa PR", lineas: ["Teo contestaba el *20 %*", "de sus leads.", "Hoy contesta en *segundos*."] },
      { tipo: "cita", dur: 150, texto: "Me da tranquilidad saber que las conversaciones se siguen atendiendo.", autor: "Teo", rol: "TERAPISTA · MANO SANTA PR" },
      { tipo: "pasos", dur: 120, titulo: "Su agente de IA:", pasos: ["Contesta en segundos", "Califica al cliente", "Agenda la cita"] },
      { tipo: "cierre", dur: 200, ...CIERRE_AIB_30 },
    ],
  },
  {
    id: "aib-12-seguimiento", marca: "ai-borinquen", titulo: "El cliente no dijo que no. Nadie le volvió a escribir.", angulo: "El seguimiento que siempre se cae",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["El cliente no dijo que no.", "Nadie le volvió a *escribir*."] },
      { tipo: "comparativa", dur: 180, titulo: "¿Hasta dónde llega el *seguimiento*?", filas: [
        { nombre: "Su equipo", precio: "2 mensajes", barra: 0.28, detalle: "Después se le olvida o se satura" },
        { nombre: "Su agente de IA", precio: "Hasta la cita", barra: 1, tuyo: true, detalle: "Escribe en el momento justo, sin cansarse" },
      ] },
      { tipo: "gancho", dur: 100, lineas: ["¿Quién le escribe el tercero,", "el cuarto y el *quinto*?"] },
      { tipo: "chat", dur: 190, titulo: "Su agente *no se olvida*.", hora: "Día 3 · seguimiento", nombre: "Asistente · Su negocio", burbujas: [
        { de: "agente", texto: "Hola, Ana. ¿Pudo ver la información que le envié?", en: 10 },
        { de: "cliente", texto: "Sí, perdón, estaba ocupada", en: 42 },
        { de: "agente", texto: "¡Entiendo! ¿Le separo una evaluación el jueves a las 10:00?", en: 72 },
        { de: "cliente", texto: "Dale, el jueves", en: 112 },
        { de: "agente", texto: "Listo ✅ Jueves 10:00 AM.", en: 140 },
      ] },
      { tipo: "pasos", dur: 130, titulo: "Seguimiento *sin límite*", pasos: ["Recuerda a cada cliente", "Escribe en el momento justo", "Agenda cuando dice que sí"] },
      { tipo: "cierre", dur: 200, ...CIERRE_AIB_30 },
    ],
  },
  {
    id: "aib-13-no-desaparecemos", marca: "ai-borinquen", titulo: "No le entregamos una herramienta y desaparecemos", angulo: "Miedo a comprar algo que nadie sabe usar (caso Milton)",
    escenas: [
      { tipo: "gancho", dur: 110, lineas: ["El miedo no es la tecnología.", "Es comprar algo que *nadie sabe usar*."] },
      { tipo: "gancho", dur: 90, lineas: ["No le entregamos una herramienta", "y *desaparecemos*."] },
      { tipo: "pasos", dur: 200, titulo: "Así lo *acompañamos*", pasos: ["Entendemos su negocio", "Sistema en marcha en 15 días", "Optimización del día 16 al 45", "Soporte para siempre, si lo quiere"] },
      { tipo: "cita", dur: 180, texto: "Pensé que la implementación sería mucho más complicada, pero ha sido bastante fácil.", autor: "Milton", rol: "CARIBE PAINT" },
      { tipo: "gancho", dur: 120, etiqueta: "AutoFlow", lineas: ["En marcha en *15 días*.", "Optimizado hasta el *día 45*."], sub: "Y si quiere, soporte para siempre." },
      { tipo: "cierre", dur: 200, ...CIERRE_AIB_30 },
    ],
  },

  /* ───── BORI (de tú) ───── */
  {
    id: "bori-09-sin-boost", marca: "bori", titulo: "Darle boost no es hacer anuncios", angulo: "Sin boost a ciegas",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["Darle *boost*", "no es hacer anuncios."] },
      { tipo: "lista", dur: 170, modo: "tachar", titulo: "Lo que haces *hoy*:", items: [
        { texto: "Le das 'Promocionar'" }, { texto: "Escoges el público a ojo" }, { texto: "Rezas para que funcione" }, { texto: "Repites el mes que viene" },
      ] },
      { tipo: "gancho", dur: 90, lineas: ["Tu anuncio merece", "una *estrategia*."] },
      { tipo: "pantalla", dur: 190, imagen: "bori-app/campanas-pc.png", dispositivo: "laptop", titulo: "Bori arma la campaña *completa*", sub: "Público, presupuesto y destino, con estrategias probadas.",
        puntos: ["Estrategias de trafficker", "Todo queda en pausa", "Tú le das play"] },
      { tipo: "pantalla", dur: 150, imagen: "bori-app/chat-aprobacion-pc.png", dispositivo: "laptop", titulo: "Y no gasta nada *sin tu OK*", foco: { x: 0.72, y: 0.33, w: 0.27, h: 0.6 } },
      { tipo: "cierre", dur: 200, ...CIERRE_BORI_30 },
    ],
  },
  {
    id: "bori-10-tu-pagina-es-tuya", marca: "bori", titulo: "El freelancer se fue y se llevó tu página", angulo: "Tu cuenta es tuya",
    escenas: [
      { tipo: "gancho", dur: 100, alarma: true, lineas: ["El freelancer se fue…", "y se llevó tu *página*."] },
      { tipo: "lista", dur: 170, modo: "tachar", titulo: "¿Te ha *pasado*?", items: [
        { texto: "No tienes acceso a tu cuenta" }, { texto: "No sabes qué se publicó" }, { texto: "No sabes cuánto gastaste" }, { texto: "Empiezas de cero" },
      ] },
      { tipo: "gancho", dur: 100, lineas: ["Con Bori, todo queda", "en *tu* cuenta."] },
      { tipo: "pantalla", dur: 180, imagen: "bori-app/config-pc.png", dispositivo: "laptop", titulo: "Tu cuenta. Tus datos. *Tu control.*", sub: "Tu propia cuenta de Meta, conectada a Bori.",
        puntos: ["Tus anuncios en tu Meta", "Tu marca guardada", "Cancelas cuando quieras"] },
      { tipo: "gancho", dur: 150, lineas: ["Con Bori, nadie te tiene", "de *rehén*."] },
      { tipo: "cierre", dur: 200, ...CIERRE_BORI_30 },
    ],
  },
  {
    id: "bori-11-emprendes-solo", marca: "bori", titulo: "Eres el dueño, el vendedor, el diseñador… y el de los anuncios", angulo: "Emprendes solo",
    escenas: [
      { tipo: "gancho", dur: 110, lineas: ["Eres el dueño, el vendedor, el diseñador…", "y el de los *anuncios*."] },
      { tipo: "roles", dur: 170, titulo: "Hoy haces de:", roles: ["Dueño", "Vendedor", "Diseñador", "Community manager", "Trafficker"] },
      { tipo: "gancho", dur: 90, lineas: ["Emprender solo no significa", "hacerlo *todo* solo."] },
      { tipo: "pantalla", dur: 190, imagen: "bori-app/generador-resultado-pc.png", dispositivo: "laptop", titulo: "Bori te hace los *anuncios*…", sub: "Describes tu negocio y en segundos tienes tus flyers.", foco: { x: 0.36, y: 0.15, w: 0.44, h: 0.55 } },
      { tipo: "pantalla", dur: 140, imagen: "bori-app/movil-inicio-cel.png", dispositivo: "telefono", titulo: "…desde tu *celular*", sub: "Pídele lo que sea. Tú apruebas." },
      { tipo: "cierre", dur: 200, cta: "Empieza en heybori.ai", sub: "Tu compañero de marketing 24/7, por $99 al mes", url: "@heybori" },
    ],
  },
  {
    id: "bori-12-navidad", marca: "bori", titulo: "Tus anuncios de Navidad, listos hoy", angulo: "Temporada (Navidad / Black Friday)",
    escenas: [
      { tipo: "gancho", dur: 100, etiqueta: "Temporada", lineas: ["Tus anuncios de *Navidad*,", "listos hoy."] },
      { tipo: "gancho", dur: 80, lineas: ["Black Friday llega igual,", "estés listo *o no*."] },
      { tipo: "flyers", dur: 210, titulo: "Pídele tu campaña de *temporada*…", prompt: "Quiero vender más en Navidad", piezas: [
        { titulo: "Regalo perfecto", sub: "Te lo envolvemos" }, { titulo: "Black Friday", sub: "Solo este fin de semana" },
        { titulo: "Especial navideño", sub: "Reserva tu fecha" }, { titulo: "Tarjeta de regalo", sub: "Regala a quien quieras" },
        { titulo: "Última semana", sub: "Antes del 24" }, { titulo: "Fin de año", sub: "Cierra el año con estilo" },
      ] },
      { tipo: "aprobacion", dur: 170, titulo: "…y sale cuando *tú* digas.", campana: "Navidad · Regalos", detalle: "Público: 10 km a la redonda · 25 a 60 años", presupuesto: "$15/día · sale cuando tú digas" },
      { tipo: "gancho", dur: 140, lineas: ["Que diciembre no te agarre", "*sin anuncios*."] },
      { tipo: "cierre", dur: 200, ...CIERRE_BORI_30 },
    ],
  },

  /* ───── LEVEL UP (de tú) ───── */
  {
    id: "lu-11-mi-nicho", marca: "level-up", titulo: "¿Crees que los anuncios no funcionan para tu negocio?", angulo: "“Los ads no funcionan para mi nicho”",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["¿Crees que los anuncios", "no funcionan para *tu* negocio?"] },
      { tipo: "gancho", dur: 90, lineas: ["Lo que falla no son los anuncios.", "Es la *estrategia*."] },
      { tipo: "casos", dur: 220, titulo: "Negocios distintos, *mismo sistema*", nota: NOTA_LU, casos: [
        { nombre: "Tinos · restaurante", desde: 30, hasta: 100 }, { nombre: "RK Automatic", desde: 30, hasta: 100 }, { nombre: "La Garita", desde: 25, hasta: 70 },
      ] },
      { tipo: "gancho", dur: 140, etiqueta: "Caso real · Quiropráctico", lineas: ["El Dr. Bryan Vega recibe", "*25 a 50 pacientes nuevos*", "cada mes."], sub: NOTA_LU },
      { tipo: "gancho", dur: 150, lineas: ["+100 negocios en Puerto Rico.", "Distintos nichos. *Un sistema*."] },
      { tipo: "cierre", dur: 200, ...CIERRE_LU },
    ],
  },
  {
    id: "lu-12-base-dormida", marca: "level-up", titulo: "Tienes cientos de clientes que no te han vuelto a comprar", angulo: "Base de clientes dormida",
    escenas: [
      { tipo: "gancho", dur: 110, lineas: ["Tienes cientos de clientes en tu teléfono", "que no te han vuelto a *comprar*."] },
      { tipo: "gancho", dur: 90, alarma: true, lineas: ["Esa base se está", "*enfriando*."] },
      { tipo: "pasos", dur: 190, titulo: "Lo que hacemos con *lo que ya tienes*", pasos: ["Remarketing a quien ya te vio", "Campañas a tu base de clientes", "Seguimiento automático con IA"] },
      { tipo: "gancho", dur: 130, lineas: ["No necesitas más clientes.", "Necesitas dejar de perder los que *ya te llegan*."] },
      { tipo: "gancho", dur: 140, etiqueta: "Level Up Media", lineas: ["+100 negocios en Puerto Rico", "ya *escalaron* con nosotros."], sub: NOTA_LU },
      { tipo: "cierre", dur: 240, ...CIERRE_LU },
    ],
  },
  {
    id: "lu-13-contenido-sin-estructura", marca: "level-up", titulo: "Publicas todos los días y no te escribe nadie", angulo: "DWY · contenido sin estructura",
    escenas: [
      { tipo: "gancho", dur: 100, lineas: ["Publicas todos los días", "y no te escribe *nadie*."] },
      { tipo: "gancho", dur: 80, lineas: ["No es el *algoritmo*."] },
      { tipo: "lista", dur: 170, modo: "tachar", titulo: "Lo que le *falta* a tu contenido:", items: [
        { texto: "Estructura" }, { texto: "Ángulos ganadores" }, { texto: "Estrategia de comunicación" }, { texto: "Anuncios que lo empujen" },
      ] },
      { tipo: "pasos", dur: 160, titulo: "Te lo instalamos *contigo*", pasos: ["Estructuramos tu contenido", "Encontramos tus ángulos ganadores", "Lo potenciamos con anuncios"] },
      { tipo: "numero", dur: 200, etiqueta: "Yadiel · negocio digital", antes: "Antes: $5K/mes", desde: 5, hasta: 40, prefijo: "$", sufijo: "K/mes", nota: NOTA_LU },
      { tipo: "cierre", dur: 190, cta: "Comenta SISTEMA", sub: "Consultoría 1:1: te instalamos el sistema contigo", url: "@level_upmediapr" },
    ],
  },
  {
    id: "lu-14-tres-huecos", marca: "level-up", titulo: "Los 3 huecos por donde se te va el dinero", angulo: "Referidos + leads tarde + base dormida",
    escenas: [
      { tipo: "gancho", dur: 110, lineas: ["¿Por dónde se te va el dinero", "cada mes *sin que lo veas*?"] },
      { tipo: "lista", dur: 190, modo: "tachar", titulo: "Los *3 huecos* de tu negocio:", items: [
        { texto: "Dependes de referidos" }, { texto: "Contestas tarde tus leads" }, { texto: "Tu base de clientes está dormida" },
      ] },
      { tipo: "gancho", dur: 100, lineas: ["Cada hueco es un cliente", "que se te *va*."] },
      { tipo: "pasos", dur: 170, titulo: "Los tapamos con *un sistema*", pasos: ["Anuncios que traen clientes nuevos", "AutoFlow: respuesta en segundos", "Campañas a tu base de clientes"] },
      { tipo: "gancho", dur: 140, etiqueta: "Caso real · Cabo Rojo", lineas: ["Tinos pasó de *$30K*", "a *$100K* al mes."], sub: NOTA_LU },
      { tipo: "cierre", dur: 190, ...CIERRE_LU },
    ],
  },
];

ANUNCIOS.push(...LOTE3.flatMap(ambos));

/* ═════════════════ 1000X · lanzamiento de la plataforma (27/sep/2026) · solo horizontal ═════════════════
   Plataforma de trading de Elvin y Richy: Autopilot (bot), Radar (alertas), indicador MILEX, Guardián de riesgo
   para cuentas de fondeo, live trading diario, psicología, journal. $497/mes con el Autopilot incluido.
   Cumplimiento: NUNCA prometer ganancias ni que pasas la evaluación; gráfico marcado SIMULACIÓN; aviso de riesgo. */
const AVISO_1000X = "El trading conlleva un riesgo sustancial de pérdida. Contenido ilustrativo; no es asesoría de inversión.";
ANUNCIOS.push(
  {
    id: "1000x-01-autopilot", marca: "1000x", formato: "16:9", titulo: "1000X · El mejor trader de 2028 será un bot (Autopilot)", angulo: "Trabajas y no puedes estar frente a la gráfica",
    musica: "audio/1000x-a.mp3",
    escenas: [
      { tipo: "gancho", dur: 110, etiqueta: "> 2028", lineas: ["El mejor trader de 2028", "no será un ser humano."] },
      { tipo: "gancho", dur: 70, lineas: ["Será un *bot*."] },
      { tipo: "gancho", dur: 100, lineas: ["Tú estás trabajando.", "El mercado se *mueve*."] },
      { tipo: "notificaciones", dur: 150, lineas: ["La oportunidad llega…", "y *tú no estás*."], hora: "10:32", items: [
        { titulo: "Reunión", detalle: "Sala B · empezó hace 2 min", hora: "10:30 AM", icono: "mensaje", color: "#5C6662" },
        { titulo: "Radar 1000X", detalle: "Señal en MNQ · 5m", hora: "10:31 AM", icono: "mensaje", color: "#00C46A" },
        { titulo: "Entrada perdida", detalle: "El precio ya se fue", hora: "10:32 AM", icono: "mensaje" },
      ] },
      { tipo: "grafico", dur: 210, modo: "autopilot", par: "MNQ", titulo: "El *Autopilot* la toma por ti", sub: "Una estrategia probada, ejecutada sin que estés frente a la gráfica.",
        puntos: ["Sin estar pegado al gráfico", "Sin tener que aprender a operar"] },
      { tipo: "terminal", dur: 190, ventana: "1000X_  AUTOPILOT", lineas: [
        { t: "radar: escaneando MNQ · 5m", tipo: "dim" }, { t: "sweep de liquidez detectado" }, { t: "recuadro confirmado · ruptura al alza" },
        { t: "orden BUY enviada · SL 30 pt · TP liquidez anterior", tipo: "ok" }, { t: "guardián: riesgo dentro de tus reglas", tipo: "ok" }, { t: "trade gestionado en automático", tipo: "ok" },
      ] },
      { tipo: "gancho", dur: 90, lineas: ["¿Prefieres operar *tú*?"] },
      { tipo: "grafico", dur: 170, modo: "radar", par: "MNQ", titulo: "El *Radar* te avisa", sub: "Te llega la alerta. Tú solo entras en la posición." },
      { tipo: "roles", dur: 170, titulo: "Y en la plataforma:", roles: ["Indicador MILEX", "Live trading diario", "Psicología de trading", "Journal automático", "Guardián de riesgo"] },
      { tipo: "pantalla", dur: 150, imagen: "1000x-app/terminal-pc.png", dispositivo: "laptop", titulo: "Todo en *una plataforma*", sub: "Autopilot, Radar e indicador incluidos.", foco: { x: 0.36, y: 0.36, w: 0.28, h: 0.32 } },
      { tipo: "gancho", dur: 110, lineas: ["No tienes que vivir", "*pegado al gráfico*."] },
      { tipo: "cierre", dur: 280, cta: "Solicita tu acceso →", sub: "$497/mes · Autopilot incluido", url: "ACCESS GRANTED TO FEW", nota: AVISO_1000X },
    ],
  },
  {
    id: "1000x-02-fondeo", marca: "1000x", formato: "16:9", titulo: "1000X · ¿Cuántas evaluaciones has quemado? (cuentas de fondeo)", angulo: "Te acompañamos a pasar la evaluación, en automático",
    musica: "audio/1000x-b.mp3",
    escenas: [
      { tipo: "gancho", dur: 100, alarma: true, etiqueta: "> Cuentas de fondeo", lineas: ["¿Cuántas evaluaciones", "has *quemado*?"] },
      { tipo: "lista", dur: 170, modo: "tachar", titulo: "Lo que te saca de la *evaluación*:", items: [
        { texto: "Operar con nervios" }, { texto: "Pasarte del límite de pérdida" }, { texto: "Sobreoperar un mal día" }, { texto: "No estar cuando llega la entrada" },
      ] },
      { tipo: "gancho", dur: 90, lineas: ["Pasar la cuenta no debería", "depender de tus *nervios*."] },
      { tipo: "terminal", dur: 170, ventana: "1000X_  GUARDIÁN · REGLAS DE TU PROP FIRM", lineas: [
        { t: "cuenta de evaluación conectada", tipo: "ok" }, { t: "límite de pérdida diaria: calculado en vivo" }, { t: "riesgo por trade: dentro de las reglas", tipo: "ok" },
        { t: "cerca del máximo del día → pausa", tipo: "alerta" }, { t: "autopilot: solo entra con la estrategia", tipo: "ok" },
      ] },
      { tipo: "grafico", dur: 190, modo: "autopilot", par: "MNQ", titulo: "El *Autopilot* opera con disciplina", sub: "Sin emociones. Sin sobreoperar. Con la misma estrategia, siempre." },
      { tipo: "pasos", dur: 170, titulo: "Te *acompañamos* en tu evaluación", pasos: ["Conectas tu cuenta de fondeo", "El Guardián cuida tus reglas", "El Autopilot ejecuta la estrategia", "Live trading diario con el equipo"] },
      { tipo: "pantalla", dur: 130, imagen: "1000x-app/terminal-pc.png", dispositivo: "laptop", titulo: "Todo en *una plataforma*", sub: "$497 al mes, con el Autopilot incluido.", foco: { x: 0.36, y: 0.36, w: 0.28, h: 0.32 } },
      { tipo: "gancho", dur: 120, etiqueta: "> 2028", lineas: ["El mejor trader de 2028", "no será un ser humano.", "Será un *bot*."] },
      { tipo: "cierre", dur: 210, cta: "Solicita tu acceso →", sub: "$497/mes · Autopilot, Radar y Guardián", url: "ACCESS GRANTED TO FEW", nota: AVISO_1000X },
    ],
  },
);

/* 1000X · segunda tanda (27/sep): C cuadrado (psicología/disciplina) y D horizontal (anti-gurú). Música distinta. */
ANUNCIOS.push(
  {
    id: "1000x-03-psicologia", marca: "1000x", formato: "1:1", titulo: "1000X · Tu peor enemigo en el trading eres tú (1:1)", angulo: "Psicología y disciplina",
    musica: "audio/1000x-c.mp3",
    escenas: [
      { tipo: "gancho", dur: 100, alarma: true, etiqueta: "> Psicología", lineas: ["Tu peor enemigo", "en el trading", "eres *tú*."] },
      { tipo: "lista", dur: 180, modo: "tachar", titulo: "Lo que te hace *perder*:", items: [
        { texto: "Entrar por impulso" }, { texto: "Mover el stop loss" }, { texto: "Querer recuperar" }, { texto: "Sobreoperar" },
      ] },
      { tipo: "gancho", dur: 90, lineas: ["El sistema no tiene", "*emociones*."] },
      { tipo: "terminal", dur: 180, ventana: "1000X_  GUARDIÁN", lineas: [
        { t: "pérdida del día cerca del límite", tipo: "alerta" }, { t: "nuevas entradas: bloqueadas hoy", tipo: "ok" },
        { t: "psicología del día: lista" }, { t: "mañana es otro día. el plan no cambia.", tipo: "dim" },
      ] },
      { tipo: "roles", dur: 150, titulo: "En 1000X:", roles: ["Radar de señales", "Guardián de riesgo", "Psicología diaria", "Journal automático"] },
      { tipo: "cierre", dur: 200, cta: "Solicita tu acceso →", sub: "$497/mes · Autopilot incluido", url: "ACCESS GRANTED TO FEW", nota: AVISO_1000X },
    ],
  },
  {
    id: "1000x-04-sin-gurus", marca: "1000x", formato: "16:9", titulo: "1000X · Sin caras. Sin Lamborghinis. Puro sistema.", angulo: "Anti-gurú: sistema probado + live trading",
    musica: "audio/1000x-d.mp3",
    escenas: [
      { tipo: "gancho", dur: 100, etiqueta: "> Sin gurús", lineas: ["Sin caras.", "Sin Lamborghinis.", "Sin señales *mágicas*."] },
      { tipo: "gancho", dur: 80, lineas: ["Puro *sistema*."] },
      { tipo: "lista", dur: 170, modo: "tachar", titulo: "Lo que te *vendieron*:", items: [
        { texto: "Cursos de 20 horas" }, { texto: "Señales por Telegram sin estrategia" }, { texto: "Capturas de ganancias" }, { texto: "Un gurú que nunca opera en vivo" },
      ] },
      { tipo: "grafico", dur: 260, modo: "radar", par: "MNQ", titulo: "Una estrategia *probada*", sub: "El indicador MILEX marca la señal y no repinta.",
        puntos: ["Sweep de liquidez → recuadro → ruptura", "Stop definido desde la entrada"] },
      { tipo: "gancho", dur: 110, lineas: ["Operamos *en vivo*.", "Todos los días."], sub: "Live trading diario con el equipo." },
      { tipo: "roles", dur: 160, titulo: "Tú escoges cómo:", roles: ["Autopilot: opera por ti", "Radar: te avisa", "Tú operas con el indicador"] },
      { tipo: "pantalla", dur: 130, imagen: "1000x-app/terminal-pc.png", dispositivo: "laptop", titulo: "Todo en *una plataforma*", sub: "$497 al mes, con el Autopilot incluido.", foco: { x: 0.36, y: 0.36, w: 0.28, h: 0.32 } },
      { tipo: "gancho", dur: 100, lineas: ["No face.", "*All signal.*"] },
      { tipo: "cierre", dur: 240, cta: "Solicita tu acceso →", sub: "$497/mes · Autopilot, Radar y live trading", url: "ACCESS GRANTED TO FEW", nota: AVISO_1000X },
    ],
  },
);

/* ═════════════════ 1000X · recorrido de la plataforma (5/oct/2026) · 16:9 ═════════════════
   Elvin: "un video para 1000X explicando todo lo que tiene la plataforma… como el de Bori". Pantallas REALES de la
   terminal (1000x-fuente/deploy-1000x) en MODO DEMO con datos simulados, servida en local sin funciones (cero órdenes);
   5/oct v2 (Elvin: "te faltó LYRA… más interactivo, un clic que te acerque"): versión publicada (con LYRA) en modo demo,
   grabada clic a clic con ~/bori-demo/.nav-1000x.mjs → motion/public/1000x-app/nav/ (pasos.json = cursor + zoom). Mismo cumplimiento: nada de
   ganancias prometidas ni "pasas la evaluación", gráfico marcado SIMULACIÓN, aviso de riesgo al cierre. */
const TOUR_1000X: Anuncio = {
  id: "1000x-tour", marca: "1000x", formato: "16:9", titulo: "1000X · Todo lo que tiene la plataforma (recorrido)", angulo: "Recorrido del producto",
  musica: "audio/1000x-tour.mp3", barridoSiempre: true,
  escenas: [
    { tipo: "gancho", dur: 90, etiqueta: "> 1000X_", lineas: ["Bienvenido a *1000X*."], sub: "Te enseño todo lo que tiene la plataforma." },
    { tipo: "pasos", dur: 170, titulo: "Todo en *una terminal*", pasos: ["Lee el mercado", "Encuentra la entrada", "Pregúntale a LYRA", "Cuida tu cuenta", "Ejecuta"] },
    { tipo: "navegar", dur: 155, titulo: "Escoge cómo *operas*", sub: "Nasdaq, oro y S&P 500 en la misma terminal.", puntos: ["Learn: la IA te enseña el porqué", "Copilot: la IA prepara, tú decides", "Autopilot: ejecuta por ti"],
      pasos: [{imagen: "1000x-app/nav/modos-1.png", dur: 75, cursor: {x: 0.107, y: 0.167}, zoom: {x: 0, y: 0.08, w: 0.54, h: 0.15}}, {imagen: "1000x-app/nav/modos-2.png", dur: 80, cursor: {x: 0.111, y: 0.235}, zoom: {x: 0, y: 0.15, w: 0.54, h: 0.14}}] },
    { tipo: "navegar", dur: 150, titulo: "El *gráfico*", sub: "Velas en vivo, EMA, VWAP, FVG y los niveles del día.",
      pasos: [{imagen: "1000x-app/nav/grafico-3.png", dur: 150, cursor: {x: 0.063, y: 0.284}, zoom: {x: 0.006, y: 0.334, w: 0.941, h: 0.76}}] },
    { tipo: "navegar", dur: 160, titulo: "Las estrategias de *Richie*", sub: "MILEX · Toma de liquidez: sweep → recuadro → ruptura.", puntos: ["Entrada definida", "Stop de 30 puntos", "Objetivo: la liquidez anterior"],
      pasos: [{imagen: "1000x-app/nav/estrategias-17.png", dur: 160, cursor: {x: 0.477, y: 0.237}, zoom: {x: 0, y: 0.1, w: 0.99, h: 0.36}}] },
    { tipo: "grafico", dur: 160, modo: "radar", par: "MNQ", titulo: "El indicador *MILEX*", sub: "Marca la señal en la plataforma y en tu TradingView. No repinta." },
    { tipo: "navegar", dur: 190, titulo: "El *Radar* te avisa", sub: "Cada señal llega a tu terminal y a tu Telegram. Toca «Analizar» y LYRA la compara con tu plan.",
      pasos: [{imagen: "1000x-app/nav/radar-9.png", dur: 60, cursor: {x: 0.963, y: 0.468}, clic: true, zoom: {x: 0.78, y: 0.13, w: 0.24, h: 0.54}}, {imagen: "1000x-app/nav/radar-10.png", dur: 130, cursor: {x: 0.949, y: 0.616}, zoom: {x: 0.722, y: 0.505, w: 0.283, h: 0.362}}] },
    { tipo: "navegar", dur: 360, titulo: "*LYRA*, tu copiloto", sub: "Escríbele y te analiza el mercado con tus datos: bias, niveles, setup y cuánto puedes arriesgar hoy. No da señales: te hace mejor trader.", puntos: ["Chat y voz", "Soporte dentro de la app", "Comenta cada trade que cierras"],
      pasos: [{imagen: "1000x-app/nav/lyra-11.png", dur: 60, cursor: {x: 0.953, y: 0.96}, clic: true, zoom: {x: 0.58, y: 0.58, w: 0.44, h: 0.44}}, {imagen: "1000x-app/nav/lyra-12.png", dur: 70, cursor: {x: 0.789, y: 0.941}, clic: true, zoom: {x: 0.676, y: 0.36, w: 0.324, h: 0.64}}, {imagen: "1000x-app/nav/lyra-13.png", dur: 60, cursor: {x: 0.926, y: 0.941}, clic: true, zoom: {x: 0.676, y: 0.5, w: 0.324, h: 0.5}}, {imagen: "1000x-app/nav/lyra-14.png", dur: 170, zoom: {x: 0.698, y: 0.301, w: 0.288, h: 0.364}}] },
    { tipo: "navegar", dur: 200, titulo: "*LYRA Lab*", sub: "Prueba una configuración contra las señales reales del Radar, con las reglas de Topstep.",
      pasos: [{imagen: "1000x-app/nav/lab-15.png", dur: 60, cursor: {x: 0.963, y: 0.408}, clic: true, zoom: {x: 0.78, y: 0.13, w: 0.24, h: 0.54}}, {imagen: "1000x-app/nav/lab-16.png", dur: 140, cursor: {x: 0.792, y: 0.461}, zoom: {x: 0.722, y: 0.239, w: 0.283, h: 0.291}}] },
    { tipo: "navegar", dur: 200, titulo: "El *Guardián* cuida tu cuenta", sub: "Lee las reglas de tu prop firm: piso del MLL, límite diario y cuánto puedes arriesgar hoy.", puntos: ["Riesgo permitido, en vivo", "El tamaño se calcula solo", "Te frena cuando el plan dice que pares"],
      pasos: [{imagen: "1000x-app/nav/guardian-4.png", dur: 60, cursor: {x: 0.963, y: 0.228}, clic: true, zoom: {x: 0.78, y: 0.13, w: 0.24, h: 0.44}}, {imagen: "1000x-app/nav/guardian-5.png", dur: 140, cursor: {x: 0.783, y: 0.289}, zoom: {x: 0.69, y: 0.05, w: 0.31, h: 0.45}}] },
    { tipo: "navegar", dur: 170, titulo: "Ejecución en *1 clic*", sub: "Entrada, stop y objetivo ya calculados con tu riesgo. Practica en simulado antes de ir a real.",
      pasos: [{imagen: "1000x-app/nav/ejecucion-6.png", dur: 55, cursor: {x: 0.963, y: 0.288}, clic: true, zoom: {x: 0.78, y: 0.13, w: 0.24, h: 0.44}}, {imagen: "1000x-app/nav/ejecucion-7.png", dur: 115, cursor: {x: 0.859, y: 0.528}, zoom: {x: 0.706, y: 0.225, w: 0.305, h: 0.574}}] },
    { tipo: "navegar", dur: 150, titulo: "El *Autopilot*", sub: "Ejecuta solo las señales confirmadas del Radar, dentro de tus límites. Lo armas tú, con tu contraseña.", puntos: ["Contratos y trades al día", "Freno de pérdida", "Tu horario"],
      pasos: [{imagen: "1000x-app/nav/ejecucion-8.png", dur: 150, cursor: {x: 0.809, y: 0.497}, zoom: {x: 0.64, y: 0, w: 0.38, h: 0.79}}] },
    { tipo: "navegar", dur: 200, titulo: "*Psicología* de trading", sub: "Un mensaje cada día, una acción concreta y una biblioteca de temas.",
      pasos: [{imagen: "1000x-app/nav/psicologia-18.png", dur: 80, cursor: {x: 0.088, y: 0.631}, clic: true, zoom: {x: 0, y: 0.43, w: 0.99, h: 0.34}}, {imagen: "1000x-app/nav/psicologia-19.png", dur: 120, zoom: {x: 0, y: 0.08, w: 0.99, h: 0.79}}] },
    { tipo: "navegar", dur: 150, titulo: "Tu *journal*, automático", sub: "Cada trade se anota solo: win rate, P&L, profit factor, drawdown. También importas tu CSV.",
      pasos: [{imagen: "1000x-app/nav/journal-20.png", dur: 150, cursor: {x: 0.888, y: 0.262}, zoom: {x: 0, y: 0.13, w: 0.99, h: 0.54}}] },
    { tipo: "navegar", dur: 210, titulo: "La *calculadora* de riesgo", sub: "Simula 10,000 meses con tus números y las reglas de Topstep, y te dice qué tan cerca estás de quemar la cuenta.",
      pasos: [{imagen: "1000x-app/nav/riesgo-21.png", dur: 70, cursor: {x: 0.5, y: 0.741}, clic: true, zoom: {x: 0.195, y: 0.616, w: 0.61, h: 0.251}}, {imagen: "1000x-app/nav/riesgo-22.png", dur: 140, zoom: {x: 0.25, y: 0.2, w: 0.5, h: 0.46}}] },
    { tipo: "roles", dur: 150, titulo: "Y además:", roles: ["Live trading diario", "Alertas por Telegram", "Indicador MILEX en TradingView", "Comunidad de traders"] },
    { tipo: "gancho", dur: 100, lineas: ["No face.", "*All signal.*"] },
    { tipo: "cierre", dur: 240, cta: "Solicita tu acceso →", sub: "$497/mes · Autopilot incluido", url: "ACCESS GRANTED TO FEW", nota: AVISO_1000X },
  ],
};
ANUNCIOS.push(TOUR_1000X);

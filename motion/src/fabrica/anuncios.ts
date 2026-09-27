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
      { tipo: "pasos", dur: 210, titulo: "Nosotros lo hacemos *por ti*", pasos: ["Oferta", "Estrategia", "Contenido", "Anuncios con IA", "Leads automatizados", "Escalar lo que funciona"] },
      { tipo: "gancho", dur: 130, etiqueta: "Caso real", lineas: ["El Dr. Marvin Argüello abrió", "su oficina con la *agenda llena*."], sub: NOTA_LU },
      { tipo: "cierre", dur: 200, cta: "Haz tu diagnóstico →", sub: "La agencia #1 de Meta Ads en Puerto Rico", url: "@level_upmediapr" },
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
      { tipo: "casos", dur: 230, titulo: "Resultados de *clientes reales*", nota: NOTA_LU, casos: [
        { nombre: "Tinos", desde: 30, hasta: 100 }, { nombre: "RK Automatic", desde: 30, hasta: 100 },
        { nombre: "La Garita", desde: 25, hasta: 70 }, { nombre: "Yadiel", desde: 5, hasta: 40 },
      ] },
      { tipo: "gancho", dur: 110, lineas: ["+50 negocios en Puerto Rico", "ya *escalaron* con nosotros."] },
      { tipo: "cierre", dur: 170, ...CIERRE_LU },
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

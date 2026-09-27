// Agenda de closers de Level Up en 2 pasos (26/sep/2026). Elvin: "aunque no se agende, los datos que
// lleve me los dé". Paso 1 = nuestro formulario (se guarda a medida que avanza, desde que dio e-mail o
// WhatsApp → lead en Leads · CLOSERS «Sin agendar» con seguimiento al setter del link). Paso 2 = el
// Calendly de siempre, con TODO pre-llenado (a1…a10 = las preguntas del evento en su orden). Al
// agendar, el webhook de Calendly mueve el mismo lead a «Llamada agendada» con su closer.
//
// Las opciones se guardan EXACTAMENTE como están en Calendly (con sus espacios y faltas) para que el
// pre-llenado las marque; `etiquetas` es cómo las ve la persona. Si cambian las preguntas en Calendly,
// hay que cambiarlas aquí (o en Pulse → Formularios).

import type { Pregunta } from "./reglas.ts";
import type { Semilla } from "./semillas.ts";

const contacto: Pregunta[] = [
  { id: "nombre", seccion: "Tú", titulo: "¿Cómo te llamas?", tipo: "texto", requerida: true, placeholder: "Nombre y apellido" },
  { id: "telefono", seccion: "Tú", titulo: "¿A qué WhatsApp te escribimos?", ayuda: "Por ahí te confirmamos la llamada.", tipo: "telefono", requerida: true, placeholder: "787 000 0000", calendly: "a10" },
  { id: "email", seccion: "Tú", titulo: "¿Y tu e-mail?", ayuda: "Ahí te llega el enlace de Zoom.", tipo: "email", requerida: true, placeholder: "tu@negocio.com" },
];

const negocio = (a: string): Pregunta => ({
  id: "negocio",
  seccion: "Tu negocio",
  titulo: "¿Qué negocio tienes y qué servicio o producto ofreces?",
  ayuda: "Escribe el nombre de tu negocio y tus redes (Instagram / Facebook).",
  tipo: "largo",
  requerida: true,
  calendly: a,
});
const meta = (a: string): Pregunta => ({ id: "meta", seccion: "Tus metas", titulo: "¿Cuál es tu meta de ventas en los próximos 3 a 6 meses?", tipo: "largo", requerida: true, calendly: a });

const URGENCIA = ["Es una prioridad para resolver ya mismo ", "En un mes "];
const INVERSION = ["5% de la facturacion total ", "del 6 al 10% de la facturacion total ", "Lo que sea necesario", "necesitaría acceso a financiación"];
const EXPERIENCIA = ["Si, he trabajado con redes sociales pero sin ads", "Inverti en ads de $1,000 a $3,000", "Inverti en ads Mas de $5,000", "No he trabajado con marketing digital ni anuncios"];
const DECISIONES = ["No, soy el único que toma las decisiones en mi negocio", "Sí que las hay (es muy importante que les invites a esta sesión o nos veremos obligados a reagendarla)"];

const ETIQUETAS: Record<string, string> = {
  "Es una prioridad para resolver ya mismo ": "Es prioridad: lo quiero resolver ya",
  "En un mes ": "En un mes",
  "5% de la facturacion total ": "El 5 % de lo que facturo",
  "del 6 al 10% de la facturacion total ": "Del 6 al 10 % de lo que facturo",
  "necesitaría acceso a financiación": "Necesitaría financiamiento",
  "Si, he trabajado con redes sociales pero sin ads": "He trabajado redes sociales, pero sin anuncios",
  "Inverti en ads de $1,000 a $3,000": "Invertí de $1,000 a $3,000 en anuncios",
  "Inverti en ads Mas de $5,000": "Invertí más de $5,000 en anuncios",
  "No he trabajado con marketing digital ni anuncios": "No he trabajado marketing digital ni anuncios",
  "Estamos en numeros verdes": "En números verdes (ganando)",
  "Punto equilibrio ": "En punto de equilibrio",
  "Estamos en numeros rojos": "En números rojos (perdiendo)",
  "No, soy el único que toma las decisiones en mi negocio": "No, las decisiones las tomo yo",
  "Sí que las hay (es muy importante que les invites a esta sesión o nos veremos obligados a reagendarla)": "Sí, hay otras personas (invítalas a la llamada: si no están, hay que reagendar)",
  "$3,000 - $5000": "$3,000 - $5,000",
  "$1,000 - $5000": "$1,000 - $5,000",
  "+$20,000": "Más de $20,000",
  "$20,000  o Más": "$20,000 o más",
  "No he abierto pero quiero comenzar con marketing": "Todavía no he abierto, pero quiero empezar con marketing",
  "No he abierto pero quiero comenzar con marketing.": "Todavía no he abierto, pero quiero empezar con marketing",
};
const opcion = (id: string, seccion: string, titulo: string, opciones: string[], a: string, ayuda?: string): Pregunta => ({
  id,
  seccion,
  titulo,
  ayuda,
  tipo: "opcion",
  requerida: true,
  opciones,
  etiquetas: Object.fromEntries(opciones.filter((o) => ETIQUETAS[o]).map((o) => [o, ETIQUETAS[o]])),
  calendly: a,
});

const pantallas = {
  bienvenida: {
    etiqueta: "Videollamada · 2 pasos",
    titulo: "Agenda tu videollamada con *Level Up*.",
    texto:
      "Paso 1: cuéntanos de tu negocio (2 minutos). Paso 2: escoges el día y la hora. Tus respuestas se guardan mientras avanzas, así tu asesor llega preparado a la llamada.",
    puntos: ["Cuéntanos de tu negocio", "Escoge día y hora", "Recibe el enlace de Zoom"],
    boton: "Empezar",
  },
  gracias: {
    titulo: "¡Último paso, {nombre}! Escoge el día y la hora 📅",
    texto: "Tus datos ya están llenos: solo elige el horario que te funcione.",
  },
};

export const SEMILLAS_AGENDA: Semilla[] = [
  {
    // Calendly de Roger Arteaga (41 citas en 30 días al 26/sep).
    slug: "agenda-roger",
    titulo: "Agenda · Roger (closer)",
    marca: "level_up",
    apariencia: { tema: "level-up" },
    accion: "leads-closers-lu",
    config: {
      ...pantallas,
      parciales: true,
      calendly: { url: "https://calendly.com/roger-arteaga-levelupmediapr/videollamada-por-zoom" },
      preguntas: [
        ...contacto,
        negocio("a1"),
        meta("a2"),
        opcion("ventas", "Tu negocio hoy", "¿Cuánto estás vendiendo al mes actualmente?", ["$1,000 - $3,000", "$3,000 - $5000", "$5,000 - $10,000", "$10,000 - $20,000", "+$20,000", "No he abierto pero quiero comenzar con marketing"], "a3"),
        { id: "obstaculo", seccion: "Tu negocio hoy", titulo: "¿Qué te está frenando hoy para llegar a tu meta?", ayuda: "El obstáculo principal.", tipo: "largo", requerida: true, calendly: "a4" },
        opcion("urgencia", "Tu negocio hoy", "¿Con qué urgencia necesitas resolverlo?", URGENCIA, "a5"),
        opcion("inversion", "Inversión", "¿Cuánto estás dispuesto a invertir para hacer crecer tu negocio?", INVERSION, "a6"),
        opcion("experiencia", "Inversión", "¿Qué experiencia tienes con marketing digital y anuncios?", EXPERIENCIA, "a7"),
        opcion("rentable", "Inversión", "¿Qué tan rentable es tu negocio hoy?", ["Estamos en numeros verdes", "Punto equilibrio ", "Estamos en numeros rojos"], "a8"),
        opcion("decisiones", "Casi listo", "¿Hay otras personas que toman las decisiones importantes contigo?", DECISIONES, "a9"),
      ],
    },
  },
  {
    // Calendly de Level Up Media (lo atiende Laura; 26 citas en 30 días al 26/sep).
    slug: "agenda-level-up",
    titulo: "Agenda · Level Up Media (Laura)",
    marca: "level_up",
    apariencia: { tema: "level-up" },
    accion: "leads-closers-lu",
    config: {
      ...pantallas,
      parciales: true,
      calendly: { url: "https://calendly.com/d/cqnb-k64-7gt/videollamada-por-zoom" },
      preguntas: [
        ...contacto,
        negocio("a1"),
        { id: "redes", seccion: "Tu negocio", titulo: "Comparte los enlaces de tu negocio", ayuda: "Instagram, Facebook, TikTok, página web o WhatsApp Business.", tipo: "largo", requerida: true, placeholder: "@tunegocio · tunegocio.com", calendly: "a2" },
        meta("a3"),
        opcion("ventas", "Tu negocio hoy", "¿Cuánto estás vendiendo al mes actualmente?", ["$0 - $1,000", "$1,000 - $5000", "$5,000 - $20,000", "$20,000  o Más", "No he abierto pero quiero comenzar con marketing."], "a4"),
        opcion("urgencia", "Tu negocio hoy", "¿Con qué urgencia necesitas resolver lo que hoy afecta a tu negocio?", URGENCIA, "a5"),
        opcion("inversion", "Inversión", "¿Cuánto estás dispuesto a invertir para hacer crecer tu negocio?", INVERSION, "a6"),
        opcion("experiencia", "Inversión", "¿Qué experiencia tienes con marketing digital y anuncios?", EXPERIENCIA, "a7"),
        opcion("rentable", "Inversión", "¿Qué tan rentable es tu negocio hoy?", ["Estamos en numeros rojos", "Punto equilibrio ", "Estamos en numeros verdes"], "a8"),
        opcion("decisiones", "Casi listo", "¿Hay otras personas que toman las decisiones importantes contigo?", DECISIONES, "a9"),
      ],
    },
  },
];

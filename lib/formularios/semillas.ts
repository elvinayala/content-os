// Los formularios que había en Typeform, duplicados en la plataforma propia (26/sep/2026). Se
// siembran una vez (si el slug no existe); después se editan desde Pulse → Formularios.

import { ETIQUETA_VISIBLE, PREGUNTAS } from "../onboarding/level-up.ts";
import type { Apariencia, ConfigFormulario } from "./reglas.ts";

export interface Semilla {
  slug: string;
  titulo: string;
  marca: string;
  apariencia: Apariencia;
  accion: string;
  config: ConfigFormulario;
  /** false = nace cerrado (no recibe respuestas hasta que alguien lo abra desde Pulse). */
  activo?: boolean;
}

const CALENDLY_ONBOARDING_LU = "https://calendly.com/jessica-levelupmediapr/onboarding";

export const SEMILLAS: Semilla[] = [
  {
    // Reemplaza al "ONBOARDING TYPEFORM" (vlfCgUUP): mismas preguntas del formulario propio
    // (/onboarding/level-up) + el botón del Typeform para agendar el onboarding con Jessica.
    slug: "onboarding-level-up",
    titulo: "Onboarding · Level Up Media",
    marca: "level_up",
    apariencia: { tema: "level-up" },
    accion: "pulse-onboarding-lu",
    config: {
      bienvenida: {
        etiqueta: "Onboarding · 5 minutos",
        titulo: "Bienvenido a *Level Up*. Vamos a preparar tu estrategia.",
        texto: "Con estas respuestas tu estratega arma los anuncios, el público y el presupuesto. Mientras más claro seas, más rápido salimos al aire.",
        puntos: ["Tu negocio y lo que vendes", "Tu cliente ideal y tus metas", "Accesos y contenido"],
        boton: "Empezar",
      },
      gracias: {
        titulo: "¡Listo, {nombre}! Último paso: agenda tu onboarding 🚀",
        texto:
          "En esa sesión revisamos tu oferta y tu público, dejamos listas las cuentas y los accesos, y definimos los primeros pasos. Asistir es clave para arrancar rápido. Si necesitas cambiar la cita, avísanos por WhatsApp.",
        boton: { texto: "Agendar mi onboarding", url: CALENDLY_ONBOARDING_LU },
      },
      preguntas: PREGUNTAS.map((p) => {
        const etiquetas = Object.fromEntries((p.opciones ?? []).filter((o) => ETIQUETA_VISIBLE[o]).map((o) => [o, ETIQUETA_VISIBLE[o]]));
        return Object.keys(etiquetas).length ? { ...p, etiquetas } : { ...p };
      }),
    },
  },
  {
    // Reemplaza a la encuesta de Typeform (UDjwQkKP) que mandan los agentes de n8n a los 10 días.
    slug: "encuesta-level-up",
    titulo: "Encuesta de satisfacción · Level Up Media",
    marca: "level_up",
    apariencia: { tema: "level-up" },
    accion: "ninguna",
    config: {
      bienvenida: {
        etiqueta: "Encuesta · 1 minuto",
        titulo: "¿Cómo va todo con Level Up?",
        texto: "Queremos asegurarnos de que el proceso vaya bien contigo. Son 3 preguntas.",
        boton: "Empezar",
      },
      gracias: {
        titulo: "¡Gracias por contarnos!",
        texto: "Tu equipo de Level Up ya lo tiene. Si algo no va bien, te escribimos por WhatsApp para resolverlo.",
      },
      preguntas: [
        { id: "email", titulo: "¿Cuál es tu e-mail?", tipo: "email", requerida: true, placeholder: "tu@negocio.com" },
        { id: "telefono", titulo: "¿Y tu teléfono?", tipo: "telefono", requerida: true, placeholder: "787 000 0000" },
        { id: "contenido", titulo: "¿Ha ido todo bien con la creación y recopilación del contenido para los anuncios?", tipo: "si-no", requerida: true },
        { id: "problema", titulo: "¿Qué no ha ido bien en el proceso?", ayuda: "Cuéntanos con confianza: lo leemos y lo resolvemos.", tipo: "largo", requerida: true, si: { id: "contenido", valor: "No" } },
      ],
    },
  },
  {
    // Confirmación de "La Mesa · Level Up" (evento privado de clientes, sáb 5/dic/2026). Nace CERRADO:
    // se abre desde Pulse → Formularios cuando Elvin apruebe la invitación. Plan en
    // vault/proyectos/evento-la-mesa/plan.md. Venue/hora se completan al confirmar el lugar.
    slug: "la-mesa",
    titulo: "La Mesa · Level Up (confirmación)",
    marca: "level_up",
    apariencia: { tema: "level-up" },
    accion: "ninguna",
    activo: false,
    config: {
      bienvenida: {
        etiqueta: "Por invitación · Sábado 5 de diciembre",
        titulo: "Estás invitado a *La Mesa*.",
        texto:
          "Un encuentro privado con un grupo seleccionado de clientes de Level Up: conversación, conexiones de negocio y buena comida. Sin presentaciones largas y sin ventas. Confírmanos en 2 minutos.",
        puntos: ["San Juan · de 10:30 AM a 3:30 PM", "Networking con empresarios que crecen como tú", "Almuerzo incluido"],
        boton: "Confirmar",
      },
      gracias: {
        titulo: "¡Nos vemos en La Mesa, {nombre}!",
        texto: "Te escribimos por WhatsApp con la ubicación, el valet y a quién te vamos a presentar.",
      },
      preguntas: [
        { id: "asiste", titulo: "¿Nos acompañas el sábado 5 de diciembre?", tipo: "opcion", requerida: true, opciones: ["Sí, ahí estaré", "No puedo esta vez"] },
        { id: "nombre", titulo: "¿Cuál es tu nombre?", tipo: "texto", requerida: true, placeholder: "Nombre y apellido" },
        { id: "negocio", titulo: "¿Cómo se llama tu negocio?", tipo: "texto", requerida: true },
        { id: "telefono", titulo: "¿Tu WhatsApp?", tipo: "telefono", requerida: true, placeholder: "787 000 0000" },
        { id: "email", titulo: "¿Y tu e-mail?", tipo: "email", requerida: false, placeholder: "tu@negocio.com", si: { id: "asiste", valor: "Sí, ahí estaré" } },
        { id: "acompanante", titulo: "¿Vienes con tu socio o alguien clave de tu negocio?", ayuda: "Máximo 1 acompañante.", tipo: "texto", requerida: false, placeholder: "Nombre (déjalo vacío si vienes solo)", si: { id: "asiste", valor: "Sí, ahí estaré" } },
        { id: "busca", seccion: "Para conectarte con las personas correctas", titulo: "¿Qué estás buscando hoy para tu negocio?", ayuda: "Clientes, proveedores, socios, talento, financiamiento…", tipo: "largo", requerida: true, si: { id: "asiste", valor: "Sí, ahí estaré" } },
        { id: "ofrece", titulo: "¿Cómo puedes ayudar a otros empresarios?", tipo: "largo", requerida: true, si: { id: "asiste", valor: "Sí, ahí estaré" } },
        { id: "conocer", titulo: "¿Qué tipo de empresario te gustaría conocer?", tipo: "texto", requerida: false, si: { id: "asiste", valor: "Sí, ahí estaré" } },
        { id: "comida", titulo: "¿Alguna restricción de comida?", tipo: "texto", requerida: false, placeholder: "Vegetariano, alergias…", si: { id: "asiste", valor: "Sí, ahí estaré" } },
        { id: "testimonio", titulo: "Vamos a tener un rincón para grabar 5 minutos sobre tu experiencia. ¿Qué momento te queda mejor?", tipo: "opcion", requerida: true, opciones: ["En la llegada (10:30–11:15)", "Después del almuerzo (1:45–2:30)", "Al cierre (2:55–3:30)", "Prefiero no grabar"], si: { id: "asiste", valor: "Sí, ahí estaré" } },
        { id: "imagen", titulo: "¿Nos autorizas a usar las fotos y videos del evento en los que apareces?", tipo: "si-no", requerida: true, si: { id: "asiste", valor: "Sí, ahí estaré" } },
      ],
    },
  },
];

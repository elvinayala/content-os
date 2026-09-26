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
];

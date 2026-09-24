// Formulario de onboarding de Level Up Media (reemplaza al Typeform vlfCgUUP). Las preguntas
// viven aquí para que la página y el servidor validen EXACTO lo mismo. Cada respuesta cae en su
// columna del CRM (Pulse → LEVEL UP MEDIA); lo que no tiene columna va al comentario de la ficha.
// Puro (sin server-only): lo usa el cliente. Tests en tests/onboarding.test.mjs.

export type TipoPregunta = "texto" | "largo" | "email" | "telefono" | "numero" | "opcion" | "multiple" | "url" | "redes" | "si-no";

export interface Pregunta {
  id: string;
  seccion: string;
  titulo: string;
  ayuda?: string;
  tipo: TipoPregunta;
  requerida: boolean;
  opciones?: string[];
  otra?: boolean; // agrega "Otra" con texto libre
  placeholder?: string;
  // Solo se muestra si esta otra respuesta cumple la condición
  si?: { id: string; valor: string };
  columna?: string; // título de la columna en Pulse
}

// Etiquetas de Industria en el CRM, ordenadas por uso real (24/sep/2026).
export const INDUSTRIAS = [
  "Comercio", "Solar", "Restaurante", "Bienestar", "Belleza", "Aires Acondicionado", "Car Wash",
  "Asesorias, servicios legales", "Venta de vehiculos", "Electric", "Handyman", "Landscaping", "Plagas",
  "Remodelación", "Aluminum", "AIRBNB", "Eventos", "Celulares", "Gimnasio", "Fotografo",
  "Venta de bienes y raices", "Inspección de vehiculos", "E-commerce", "Decoración", "Tatto", "Roofing",
];

// Cómo lo ve el cliente (bien escrito); se guarda la etiqueta exacta del CRM.
export const ETIQUETA_VISIBLE: Record<string, string> = {
  Comercio: "Comercio / tienda",
  "Aires Acondicionado": "Aires acondicionados",
  "Asesorias, servicios legales": "Asesorías y servicios legales",
  "Venta de vehiculos": "Venta de vehículos",
  Electric: "Electricidad",
  Aluminum: "Aluminio",
  AIRBNB: "Airbnb / alquiler vacacional",
  Fotografo: "Fotografía",
  "Venta de bienes y raices": "Bienes raíces",
  "Inspección de vehiculos": "Inspección de vehículos",
  Tatto: "Tatuajes",
  "Laura B": "Laura",
};
export const verOpcion = (op: string) => ETIQUETA_VISIBLE[op] ?? op;

export const VENDEDORES = ["Roger", "Laura B", "Italo", "Carla", "Juan David", "Valentina"];

export const PREGUNTAS: Pregunta[] = [
  { id: "nombre", seccion: "Tú", titulo: "¿Cómo te llamas?", ayuda: "Nombre y apellido de la persona a cargo del negocio.", tipo: "texto", requerida: true, placeholder: "Ej. María Rivera" },
  { id: "telefono", seccion: "Tú", titulo: "¿A qué WhatsApp te escribimos?", ayuda: "Por aquí te llegan los avances y las aprobaciones de anuncios.", tipo: "telefono", requerida: true, placeholder: "787 000 0000", columna: "Teléfono" },
  { id: "email", seccion: "Tú", titulo: "¿Y tu e-mail?", tipo: "email", requerida: true, placeholder: "tu@negocio.com", columna: "E-mail" },
  { id: "negocio", seccion: "Tu negocio", titulo: "¿Cómo se llama tu negocio?", tipo: "texto", requerida: true, placeholder: "Nombre comercial", columna: "Empresa" },
  { id: "industria", seccion: "Tu negocio", titulo: "¿En qué industria estás?", tipo: "opcion", requerida: true, opciones: INDUSTRIAS, otra: true, columna: "Industria" },
  { id: "pueblo", seccion: "Tu negocio", titulo: "¿En qué pueblo está tu negocio?", ayuda: "Si atiendes a domicilio, pon desde dónde sales.", tipo: "texto", requerida: true, placeholder: "Ej. Bayamón", columna: "Pueblo / ubicación" },
  { id: "redes", seccion: "Tu negocio", titulo: "¿Dónde te encontramos en internet?", ayuda: "Lo que tengas. Si todavía no tienes, déjalo en blanco: arrancamos de cero contigo.", tipo: "redes", requerida: false },
  { id: "oferta", seccion: "Lo que vendes", titulo: "¿Qué vendes y qué es lo que más quieres vender?", ayuda: "Tu producto o servicio estrella: el que quieres que los anuncios muevan.", tipo: "largo", requerida: true, placeholder: "Ej. Instalación de placas solares residenciales, con financiamiento…" },
  { id: "precios", seccion: "Lo que vendes", titulo: "¿Cuánto cuesta?", ayuda: "Precio o rango. Nos ayuda a calcular cuánto puede costar cada cliente.", tipo: "texto", requerida: true, placeholder: "Ej. $4,000 a $12,000" },
  { id: "diferenciador", seccion: "Lo que vendes", titulo: "¿Por qué te deberían elegir a ti y no a la competencia?", tipo: "largo", requerida: true, placeholder: "Garantía, rapidez, años de experiencia, precio, trato…" },
  { id: "competencia", seccion: "Lo que vendes", titulo: "¿Qué competidores miras o admiras?", ayuda: "Nombres o @ de Instagram. Opcional.", tipo: "texto", requerida: false },
  { id: "tipoCliente", seccion: "Tu cliente ideal", titulo: "¿A quién le vendes?", tipo: "opcion", requerida: true, opciones: ["A personas (B2C)", "A otros negocios (B2B)", "A los dos"] },
  { id: "edad", seccion: "Tu cliente ideal", titulo: "¿Qué edad tiene tu cliente ideal?", ayuda: "Puedes marcar varias.", tipo: "multiple", requerida: true, opciones: ["18 a 27", "28 a 40", "41 a 60", "Más de 60", "Todas las edades"] },
  { id: "zonas", seccion: "Tu cliente ideal", titulo: "¿Dónde quieres que salgan tus anuncios?", ayuda: "Puedes marcar varias.", tipo: "multiple", requerida: true, opciones: ["Toda la isla", "Área Metro", "Norte", "Este", "Central", "Sur", "Oeste", "Estados Unidos"] },
  { id: "meta", seccion: "Tus metas", titulo: "¿Qué quieres lograr en los próximos 3 a 6 meses?", tipo: "opcion", requerida: true, opciones: ["Más ventas", "Más clientes potenciales (leads)", "Más citas agendadas", "Más visitas al local o la web", "Que me conozcan (marca)"] },
  { id: "presupuesto", seccion: "Tus metas", titulo: "¿Cuánto vas a invertir al mes en anuncios?", ayuda: "Lo que le pagas a Meta (Facebook e Instagram), aparte de nuestro servicio. En dólares.", tipo: "numero", requerida: true, placeholder: "Ej. 600", columna: "Presupuesto mensual" },
  { id: "cuentaAds", seccion: "Accesos", titulo: "¿Tienes cuenta publicitaria en Meta (Business Manager)?", tipo: "opcion", requerida: true, opciones: ["Sí", "No", "No sé"] },
  { id: "idCuenta", seccion: "Accesos", titulo: "¿Cuál es el ID de tu cuenta publicitaria?", ayuda: "Son 15-16 números. Si no lo tienes a mano, déjalo en blanco y te ayudamos.", tipo: "texto", requerida: false, placeholder: "Ej. 1588319795184399", si: { id: "cuentaAds", valor: "Sí" }, columna: "Id cuenta publicitaria" },
  { id: "contenido", seccion: "Accesos", titulo: "¿Tienes fotos o videos de tu negocio?", ayuda: "Pega el link de una carpeta (Google Drive, Dropbox, iCloud). Opcional: si no, lo coordinamos.", tipo: "url", requerida: false, placeholder: "https://drive.google.com/…", columna: "Contenido" },
  { id: "vendedor", seccion: "Casi listo", titulo: "¿Quién te atendió cuando compraste?", tipo: "opcion", requerida: false, opciones: [...VENDEDORES, "No recuerdo"], columna: "Vendedor" },
  { id: "horario", seccion: "Casi listo", titulo: "¿Cuál es el mejor horario para contactarte?", tipo: "texto", requerida: false, placeholder: "Ej. Lunes a viernes, 9 AM a 5 PM" },
  { id: "notas", seccion: "Casi listo", titulo: "¿Algo más que debamos saber?", ayuda: "Temporadas fuertes, ofertas que vienen, lo que no te funcionó antes… Opcional.", tipo: "largo", requerida: false },
];

export type Respuestas = Record<string, string | string[] | Record<string, string> | undefined>;

export function visible(p: Pregunta, r: Respuestas): boolean {
  if (!p.si) return true;
  return r[p.si.id] === p.si.valor;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Devuelve el mensaje de error de una pregunta, o null si está bien.
export function errorDe(p: Pregunta, r: Respuestas): string | null {
  if (!visible(p, r)) return null;
  const v = r[p.id];
  const vacio = v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && !Object.values(v).some((x) => x?.trim()));
  if (vacio) return p.requerida ? "Esta respuesta hace falta para arrancar." : null;
  const s = typeof v === "string" ? v.trim() : "";
  switch (p.tipo) {
    case "email":
      return EMAIL.test(s) ? null : "Ese e-mail no parece correcto.";
    case "telefono": {
      const d = s.replace(/\D/g, "");
      return d.length === 10 || (d.length === 11 && d.startsWith("1")) ? null : "Escribe los 10 números (ej. 787 000 0000).";
    }
    case "numero": {
      const n = Number(s.replace(/[$,\s]/g, ""));
      return Number.isFinite(n) && n >= 0 && n < 1_000_000 ? null : "Escribe solo el monto, en números.";
    }
    case "url":
      return /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}/i.test(s) ? null : "Pega un link válido.";
    case "opcion":
      if (p.otra && s.startsWith("Otra:")) return s.slice(5).trim() ? null : "Escribe cuál.";
      return p.opciones?.includes(s) ? null : "Elige una opción.";
    case "multiple":
      return Array.isArray(v) && v.every((x) => p.opciones?.includes(x)) ? null : "Elige al menos una opción.";
    default:
      return s.length > 3000 ? "Es muy largo: resúmelo un poco." : null;
  }
}

export function validar(r: Respuestas): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const p of PREGUNTAS) {
    const e = errorDe(p, r);
    if (e) errores[p.id] = e;
  }
  return errores;
}

export function texto(v: Respuestas[string]): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return Object.entries(v).filter(([, x]) => x?.trim()).map(([k, x]) => `${k}: ${x.trim()}`).join(" · ");
  return v.trim();
}

// Formulario de onboarding de Level Up Media (reemplaza al Typeform vlfCgUUP). Las preguntas
// viven aquí para que la página y el servidor validen EXACTO lo mismo. Cada respuesta cae en su
// columna del CRM (Pulse → LEVEL UP MEDIA); lo que no tiene columna va al comentario de la ficha.
// Puro (sin server-only): lo usa el cliente. Tests en tests/onboarding.test.mjs.

import { errorDe, type Pregunta, type Respuestas, texto, validar as validarCon, visible } from "../formularios/reglas.ts";

export { errorDe, texto, visible };
export type { Pregunta, Respuestas };

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

export function validar(r: Respuestas): Record<string, string> {
  return validarCon(PREGUNTAS, r);
}

// "Empresa" en Ritmo: quiénes somos, el equipo, recursos, políticas y preguntas frecuentes. Parte pura
// (secciones, quién ve qué, formato del texto y el contenido inicial). Tests en tests/empresa.test.mjs.

// Mismos valores que POLITICA (rrhh.ts) y BONO_REFERIDO (carreras-reglas.ts); el test verifica que no se separen.
export const POLITICA_TEXTO = { vacacionesAnual: 8, enfermedadAnual: 5, maternidad: 30, mesesParaVacaciones: 12, bonoReferido: 100 };
const POLITICA = POLITICA_TEXTO;
const BONO_REFERIDO = POLITICA_TEXTO.bonoReferido;

export type SeccionEmpresa = "nosotros" | "equipo" | "recursos" | "politicas" | "preguntas";
export type EmpresaDe = "todas" | "level_up" | "ai_borinquen";

export const SECCIONES: { id: SeccionEmpresa; nombre: string; emoji: string }[] = [
  { id: "nosotros", nombre: "Quiénes somos", emoji: "🏠" },
  { id: "equipo", nombre: "El equipo", emoji: "👥" },
  { id: "recursos", nombre: "Recursos", emoji: "🧰" },
  { id: "politicas", nombre: "Políticas", emoji: "📋" },
  { id: "preguntas", nombre: "Preguntas", emoji: "💬" },
];
export const SECCIONES_EDITABLES = SECCIONES.filter((s) => s.id !== "equipo").map((s) => s.id);
export const NOMBRE_EMPRESA: Record<EmpresaDe, string> = { todas: "Todos", level_up: "Level Up", ai_borinquen: "AI Borinquen" };

export interface ItemEmpresa {
  id: string;
  seccion: string;
  titulo: string;
  cuerpo: string;
  url: string | null;
  empresa: string;
  orden: number;
  publicado: boolean;
}

/** Un empleado ve lo publicado de "todas" y de SU empresa; la dirección ve todo (borradores incluidos). */
export function visiblePara(it: ItemEmpresa, v: { empresa: string | null; maestro: boolean }): boolean {
  if (v.maestro) return true;
  if (!it.publicado) return false;
  return it.empresa === "todas" || it.empresa === (v.empresa ?? "level_up");
}

export function errorItem(p: { seccion: string; titulo: string; cuerpo: string; url?: string | null; empresa: string }): string | null {
  if (!(SECCIONES_EDITABLES as string[]).includes(p.seccion)) return "Sección inválida";
  if (!["todas", "level_up", "ai_borinquen"].includes(p.empresa)) return "Empresa inválida";
  if (p.titulo.trim().length < 2) return "Ponle un título";
  if (p.titulo.length > 120) return "Título de máximo 120 caracteres";
  if (p.cuerpo.length > 4000) return "Texto de máximo 4,000 caracteres";
  if (p.url && !/^(https?:\/\/|\/ritmo)/.test(p.url.trim())) return "El link tiene que empezar con https:// o /ritmo";
  return null;
}

// ---- Formato sencillo (sin HTML): párrafos, viñetas "- ", **negrita** y [texto](link) ----

export type Trozo = { t: "texto" | "negrita"; v: string } | { t: "link"; v: string; url: string };
export type Bloque = { t: "p"; trozos: Trozo[] } | { t: "lista"; items: Trozo[][] };

export function trozos(linea: string): Trozo[] {
  const out: Trozo[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(((?:https?:\/\/|\/ritmo)[^)\s]*)\)/g;
  let i = 0;
  for (let m = re.exec(linea); m; m = re.exec(linea)) {
    if (m.index > i) out.push({ t: "texto", v: linea.slice(i, m.index) });
    out.push(m[1] ? { t: "negrita", v: m[1] } : { t: "link", v: m[2], url: m[3] });
    i = m.index + m[0].length;
  }
  if (i < linea.length) out.push({ t: "texto", v: linea.slice(i) });
  return out;
}

export function bloques(cuerpo: string): Bloque[] {
  const out: Bloque[] = [];
  for (const cruda of cuerpo.replace(/\r/g, "").split("\n")) {
    const linea = cruda.trim();
    if (!linea) continue;
    const viñeta = linea.match(/^[-•]\s+(.*)$/);
    const ultimo = out.at(-1);
    if (viñeta) {
      if (ultimo?.t === "lista") ultimo.items.push(trozos(viñeta[1]));
      else out.push({ t: "lista", items: [trozos(viñeta[1])] });
    } else out.push({ t: "p", trozos: trozos(linea) });
  }
  return out;
}

// ---- Contenido inicial (27/sep/2026). Solo datos confirmados; lo que falta aprobar va como borrador. ----

type Semilla = Omit<ItemEmpresa, "id"> & { clave: string };
const s = (clave: string, seccion: string, empresa: EmpresaDe, orden: number, titulo: string, cuerpo: string, extra: Partial<Semilla> = {}): Semilla => ({
  clave,
  seccion,
  empresa,
  orden,
  titulo,
  cuerpo,
  url: null,
  publicado: true,
  ...extra,
});

export const SEMILLAS_EMPRESA: Semilla[] = [
  // Quiénes somos
  s("lu-quienes", "nosotros", "level_up", 10, "Level Up Media", [
    "Somos una agencia de publicidad en **Meta (Facebook e Instagram)** de Puerto Rico. En julio de 2026 cumplimos **2 años**.",
    "No vendemos anuncios: instalamos **sistemas** que le traen clientes a los negocios — estrategia, contenido, campañas y seguimiento.",
    "Fundador y CEO: **Elvin Ayala**.",
  ].join("\n")),
  s("lu-como", "nosotros", "level_up", 20, "Cómo trabajamos con un cliente", [
    "Del cierre al lanzamiento de las campañas:",
    "- **Día 1 · Inicio:** información del cliente, brief, accesos (cuenta publicitaria y redes) y expectativas claras.",
    "- **Días 2 a 4 · Estrategia:** investigación de mercado y competencia, se comparte el análisis y se define la estrategia de campaña.",
    "- **Días 5 a 7 · Creativo:** guiones, copies y hooks; se le presentan al cliente.",
    "- **Días 8 a 12 · Grabación:** el cliente graba siguiendo los guiones aprobados.",
    "- **Días 13 a 15 · Producción:** edición de videos, diseño y montaje de las campañas.",
    "- **Día 16 · Lanzamiento:** las campañas salen y el cliente recibe la evidencia.",
    "Después: revisiones, reportes y seguimiento para que los resultados se mantengan.",
  ].join("\n")),
  s("lu-mision", "nosotros", "level_up", 30, "Misión (borrador)", "Que cada negocio de Puerto Rico que confía en nosotros tenga un sistema que le traiga clientes todos los meses, medible y sin depender de la suerte.", { publicado: false }),
  s("lu-valores", "nosotros", "level_up", 40, "Nuestros valores (borrador)", [
    "- **Los datos mandan:** decidimos con números, no con corazonadas.",
    "- **Lo real convierte:** foto y video reales del negocio por encima de lo genérico.",
    "- **Respondemos rápido:** un cliente que espera es un cliente que se va.",
    "- **Terminamos lo que empezamos:** cada tarea se entrega completa.",
    "- **Hablamos claro:** expectativas honestas con el cliente desde el primer día.",
  ].join("\n"), { publicado: false }),
  s("aib-quienes", "nosotros", "ai_borinquen", 10, "AI Borinquen", [
    "Agencia de automatización con **inteligencia artificial**, 100 % de Puerto Rico.",
    "- Tenemos desarrolladores propios: los agentes se entrenan con el negocio de cada cliente, no se copian y pegan.",
    "- No vendemos un chatbot: instalamos un **empleado digital** con un trabajo concreto (recepción, ventas, citas).",
    "Fundador y CEO: **Elvin Ayala**.",
  ].join("\n")),
  s("aib-vision", "nosotros", "ai_borinquen", 20, "Nuestra visión", [
    "- Que ningún negocio de la isla pierda un cliente por no contestar a tiempo.",
    "- Digitalizar **y** capacitar: lo instalamos por el cliente, o le enseñamos a hacerlo.",
    "- Agentes por rol, en la voz y en el idioma del negocio.",
    "- Todo medible: el cliente ve sus llamadas, mensajes y leads en su portal.",
  ].join("\n")),

  // Recursos
  s("rec-ritmo", "recursos", "todas", 10, "Ritmo, tu día a día", "Aquí marcas tu entrada y salida, pides días libres, ves las vacantes internas, las noticias del equipo y la comunidad de Bienestar.", { url: "/ritmo" }),
  s("rec-app", "recursos", "todas", 20, "Instala Ritmo en tu teléfono", [
    "- **iPhone:** abre ritmo.levelupmediapr.net en Safari → botón Compartir → **Añadir a pantalla de inicio**.",
    "- **Android:** abre el link en Chrome → menú ⋮ → **Instalar app**.",
  ].join("\n")),
  s("rec-solicitudes", "recursos", "todas", 30, "Solicitudes", "Días libres, vacaciones, permisos, cartas o documentos: todo se pide aquí y te avisamos por Slack cuando se decide.", { url: "/ritmo/solicitudes" }),
  s("rec-carreras", "recursos", "todas", 40, "Carreras y referidos", `Vacantes internas para crecer o cambiar de puesto. Si refieres a alguien y entra, ganas **US$${BONO_REFERIDO}**.`, { url: "/ritmo/carreras" }),
  s("rec-sops", "recursos", "todas", 50, "Los procesos de tu departamento (SOP)", "Cada departamento está revisando y publicando sus SOP: el paso a paso de cómo se hace cada cosa. Pídele a tu supervisor el de tu área."),
  s("rec-slack", "recursos", "todas", 60, "Slack", "La comunicación del equipo es por Slack. Los avisos de Ritmo (solicitudes, recordatorios, mensajes de Bienestar) te llegan del bot **Command Center**."),
  s("rec-etica", "recursos", "todas", 70, "Canal ético", "Si ves algo que no está bien, repórtalo. Es anónimo si quieres y solo lo lee Elvin.", { url: "/ritmo/etica" }),

  // Políticas
  s("pol-tiempo", "politicas", "todas", 10, "Tiempo libre", [
    `- **Vacaciones:** ${POLITICA.vacacionesAnual} días al año, que se acumulan cada mes desde que entras. Se pueden pedir al cumplir ${POLITICA.mesesParaVacaciones} meses (Ritmo te avisa).`,
    `- **Enfermedad:** ${POLITICA.enfermedadAnual} días por año, con certificado médico. Sin certificado se descuenta de vacaciones.`,
    `- **Maternidad:** ${POLITICA.maternidad} días.`,
    "- Lo que no alcance se toma sin paga.",
  ].join("\n")),
  s("pol-solicitudes", "politicas", "todas", 20, "Cómo se aprueba una solicitud", "Primero la aprueba tu **supervisor** y después **RR.HH.** la firma. Te llega el aviso por Slack en cada paso."),
  s("pol-asistencia", "politicas", "todas", 30, "Asistencia", [
    "- Marca tu entrada y tu salida en **Hoy**. Puedes marcar varios tramos en un mismo día.",
    "- Hay **15 minutos** de tolerancia en la hora de entrada.",
    "- Si se te olvidó marcar la salida, pones la hora y tu líder la confirma.",
  ].join("\n")),
  s("pol-almuerzo", "politicas", "todas", 35, "Hora de almuerzo", [
    "- Tienes **1 hora** de almuerzo y la escoges tú, **entre las 11:00 AM y las 2:00 PM** (hora de Puerto Rico).",
    "- Márcala en **Hoy** con \"Salir a almorzar\" y, al volver, toca el círculo otra vez.",
  ].join("\n")),
  s("pol-equipo", "politicas", "todas", 38, "Tu computadora de trabajo", [
    "- Solo se poncha desde la **computadora con la que trabajas** y desde tu red de internet. La primera vez, Ritmo te pide registrarla.",
    "- Si usas dos (laptop y desktop) o cambias de computadora o de internet, RR.HH. lo autoriza.",
    "- Desde el teléfono no se poncha. Si no estás en tu computadora, pide un **ponche manual** y RR.HH. lo revisa.",
  ].join("\n")),
  s("pol-privacidad", "politicas", "todas", 40, "Tu privacidad", [
    "- Ritmo **no** toma capturas de pantalla, ni usa GPS, ni ve lo que escribes. Mide asistencia y resultados, no te vigila.",
    "- Tu ficha la ves tú y RR.HH.",
    "- Bienestar es voluntario, no cuenta para tu desempeño y tu energía del día nunca se comparte.",
  ].join("\n")),

  // Preguntas
  s("faq-marcar", "preguntas", "todas", 10, "¿Cómo marco mi entrada?", "En **Hoy**, toca el círculo grande. Para salir, lo tocas otra vez."),
  s("faq-olvido", "preguntas", "todas", 20, "Se me olvidó marcar la salida", "Ritmo te recuerda por Slack si sigues con la entrada abierta al final del día. Si se te pasó, pones la hora en que saliste y tu líder la confirma."),
  s("faq-telefono", "preguntas", "todas", 25, "¿Puedo ponchar desde el teléfono?", "No. Se poncha desde tu computadora de trabajo registrada. Si no estás en ella, toca **Pedir ponche manual** en Hoy y RR.HH. lo autoriza."),
  s("faq-libre", "preguntas", "todas", 30, "¿Cómo pido un día libre o vacaciones?", "Ve a **Solicitudes** → nueva solicitud. Primero decide tu supervisor y después RR.HH."),
  s("faq-referir", "preguntas", "todas", 40, "¿Cómo refiero a alguien para trabajar aquí?", `En **Carreras**, escoge la vacante y toca Referir. Si entra y completa su onboarding, los US$${BONO_REFERIDO} te llegan en la nómina del mes siguiente.`),
  s("faq-quien", "preguntas", "todas", 50, "¿A quién le pregunto?", "Lo del trabajo, a tu supervisor. Lo de nómina, días libres y documentos, a **RR.HH.**"),
];

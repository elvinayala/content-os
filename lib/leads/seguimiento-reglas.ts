// Embudo SEGUIMIENTO (Elvin y Lis, 20/oct/2026): los leads que fueron a llamada con un closer y NO
// compraron. Lo trabaja Lis (antes en un Excel de ~200 filas por mes): clasificados por temperatura,
// con el feedback del closer, el servicio ofrecido y la objeción. Entran solos desde Fathom cuando el
// closer termina la llamada (lib/leads/seguimiento.ts) y el historial vino del Excel. Aquí solo lo puro.

export const EMBUDO_SEGUIMIENTO = "SEGUIMIENTO";

// Columnas del embudo, en orden. Las dos últimas cierran el lead (ganado/perdido, `estadoDeEtapa` en reglas.ts) y
// el tablero las muestra con sus leads cerrados: "ya, definitivamente no voy" se queda en Seguimiento perdido.
export const ETAPA_GANADO = "Seguimiento ganado";
export const ETAPA_PERDIDO = "Seguimiento perdido";
export const ETAPAS_SEGUIMIENTO = ["Por revisar", "Caliente", "Tibio", "Frío", "Nueva cita", "Descansando (15-30 días)", "Mensaje final", ETAPA_GANADO, ETAPA_PERDIDO] as const;

// Leads que nos gustan (Elvin, 20/oct): profesionales (salud, abogados) o negocios que facturan $10K+ al mes.
export const FACTURACION_ALTA = 10_000;
export const PROFESIONES = ["salud", "legal"] as const;
export type Profesion = (typeof PROFESIONES)[number];

export type Temperatura = "caliente" | "tibio" | "frio";

export const ETAPA_DE_TEMPERATURA: Record<Temperatura, string> = { caliente: "Caliente", tibio: "Tibio", frio: "Frío" };

// Cuándo le toca a Lis el primer contacto según la temperatura (días desde la llamada).
export const DIAS_PRIMER_CONTACTO: Record<Temperatura, number> = { caliente: 1, tibio: 3, frio: 7 };

// Objeciones que Lis ve una y otra vez (reunión del 20/oct) — etiqueta corta para la tarjeta.
export const OBJECIONES = [
  "Presupuesto",
  "Consultarlo (pareja, socio, contador)",
  "Desconfianza / presión",
  "No es el momento",
  "Lo hace solo / ya tiene proveedor",
  "No entendió el servicio",
  "No contesta",
  "Otra",
] as const;

export const SERVICIOS = ["DFY", "Bori", "AutoFlow", "Chat", "Voz", "CRM", "Landing page", "Academia"] as const;

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function temperaturaDe(v: unknown): Temperatura | null {
  const s = sinTildes(String(v ?? "")).trim();
  if (/^cal/.test(s)) return "caliente";
  if (/^tib/.test(s)) return "tibio";
  if (/^fr/.test(s)) return "frio";
  return null;
}

/** "DFY + AUTOFLOW", "dfy / bori", "AI BORI", "DFT + CHAT" → ["DFY","AutoFlow"]… (sin repetir, en el orden de SERVICIOS). */
export function serviciosDe(v: unknown): string[] {
  const s = sinTildes(String(v ?? ""));
  if (!s.trim() || s.trim() === "none") return [];
  const hay = new Set<string>();
  if (/\bdf[yt]\b|done/.test(s)) hay.add("DFY");
  if (/bori/.test(s)) hay.add("Bori");
  if (/autoflow|auto flow/.test(s)) hay.add("AutoFlow");
  if (/chat/.test(s)) hay.add("Chat");
  if (/voz|voice/.test(s)) hay.add("Voz");
  if (/\bcrm\b/.test(s)) hay.add("CRM");
  if (/\blp\b|landing/.test(s)) hay.add("Landing page");
  if (/academia/.test(s)) hay.add("Academia");
  return SERVICIOS.filter((x) => hay.has(x));
}

export function objecionDe(v: unknown): string | null {
  const s = sinTildes(String(v ?? "")).trim();
  if (!s) return null;
  return OBJECIONES.find((o) => sinTildes(o) === s) ?? OBJECIONES.find((o) => sinTildes(o).startsWith(s.slice(0, 6))) ?? "Otra";
}

const MESES: Record<string, number> = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12 };

/** Fechas del Excel de Lis: "20/octubre/2026", "01 OCTUBRE 2026", "3 julio 2026", "03/agosto/2026", Date. → "YYYY-MM-DD" o null. */
export function fechaExcel(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = sinTildes(String(v ?? "")).trim();
  const m = s.match(/^(\d{1,2})[\s/-]+([a-z]{3,})[a-z]*[\s/-]+(\d{4})$/);
  if (m) {
    const mes = MESES[m[2].slice(0, 3)];
    const dia = Number(m[1]);
    if (!mes || dia < 1 || dia > 31) return null;
    return `${m[3]}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }
  const n = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return n ? `${n[1]}-${n[2]}-${n[3]}` : null;
}

/** Teléfonos del Excel: "1.7874851557E10" o "17874851557.0" (número de Excel), "1 787-371-7613.", "(939) 499-2821",
 *  dos números ("… / …", "…, …": el primero) → solo dígitos con 1 delante si son 10. */
export function telefonoExcel(v: unknown): string | null {
  let s = String(v ?? "").trim().split(/[/,;]| y /)[0].trim();
  if (/^\d(\.\d+)?e\+?\d+$/i.test(s)) s = String(Math.round(Number(s)));
  if (/^\d+\.0+$/.test(s)) s = s.replace(/\.0+$/, "");
  const dig = s.replace(/\D/g, "");
  if (dig.length === 10) return `1${dig}`;
  if (dig.length === 11 && dig.startsWith("1")) return dig;
  return dig.length >= 10 && dig.length <= 15 ? dig : null;
}

/** "LEVEL", "Level", "borinquen", "Borinquen" → marca. */
export function marcaExcel(v: unknown): "level_up" | "ai_borinquen" | null {
  const s = sinTildes(String(v ?? ""));
  if (/borinq|aib|ai bori/.test(s)) return "ai_borinquen";
  if (/level|lum/.test(s)) return "level_up";
  return null;
}

/** Fila del Excel → dónde va. CERRÓ = ya es cliente (no entra). Sin estado: lo de antes de `vigenteDesde`
 *  (junio–agosto) Lis ya lo dio por cerrado → perdido; lo reciente lo revisa ella. */
export function destinoExcel(estado: unknown, fechaDemo: string | null, vigenteDesde: string): { etapa: string; estado: "abierto" | "perdido" } | null {
  const s = sinTildes(String(estado ?? "")).trim();
  if (/^cerr/.test(s)) return null;
  const t = temperaturaDe(s);
  if (t) return { etapa: ETAPA_DE_TEMPERATURA[t], estado: "abierto" };
  const viejo = !fechaDemo || fechaDemo < vigenteDesde;
  return viejo ? { etapa: "Mensaje final", estado: "perdido" } : { etapa: "Por revisar", estado: "abierto" };
}

export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Closer de una llamada de Fathom, por primer nombre como en el Excel de Lis ("Roger", "Laura"). Laura graba con la
 *  cuenta de Level Up (levelupmediapr@gmail.com), cuyo nombre no es el de ella. */
export function closerDeFathom(nombre: string | null | undefined, email: string | null | undefined, titulo = ""): string | null {
  const e = (email ?? "").trim().toLowerCase();
  if (e === "levelupmediapr@gmail.com" || /laura\s+bernal/i.test(`${nombre ?? ""} ${titulo}`)) return "Laura";
  const primero = (nombre ?? "").trim().split(/\s+/)[0];
  if (!primero || /^level$/i.test(primero)) return /roger/i.test(titulo) ? "Roger" : null;
  return primero[0].toUpperCase() + primero.slice(1).toLowerCase();
}

// ─── Lo que Claude saca de la llamada de Fathom ──────────────────────────────────────────────────

export interface LecturaLlamada {
  esVenta: boolean;
  compro: "si" | "no" | "no_claro";
  marca: "level_up" | "ai_borinquen" | null;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  negocio: string | null;
  industria: string | null;
  servicios: string[];
  objecion: string | null;
  temperatura: Temperatura | null;
  feedback: string | null;
  proximoPaso: string | null;
  presion: boolean;
  /** Por qué no cerró, en una oración concreta (no la categoría: "su socio no quiere invertir hasta enero"). */
  razon: string | null;
  /** USD al mes que dijo facturar (lo más reciente que dijo). */
  facturacionMensual: number | null;
  profesion: Profesion | null;
  /** Dijo que definitivamente no (no le interesa, no lo llamen) → Seguimiento perdido. */
  descartado: boolean;
  capacidad: Capacidad | null;
  quiereEscalar: boolean;
  precioOfrecido: number | null;
  ofertaIncorrectaIA: string | null;
}

/** "$15K", "15,000", "entre 12 y 20 mil" (toma el primero), 15000 → número; lo que no se entienda → null. */
export function montoDe(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  const s = sinTildes(String(v ?? "")).replace(/,/g, "");
  const m = s.match(/(\d+(?:\.\d+)?)\s*(k|mil|m\b|millon)?/);
  if (!m) return null;
  // "entre 12 y 20 mil": la unidad va al final del rango.
  const unidad = m[2] ?? s.slice(m.index! + m[0].length).match(/^[\s\dy-]*(k|mil)\b/)?.[1];
  const n = Number(m[1]) * (unidad === "k" || unidad === "mil" ? 1_000 : unidad === "m" || unidad === "millon" ? 1_000_000 : 1);
  return n > 0 ? Math.round(n) : null;
}

// ─── Qué ofrecerle (Elvin, 20/oct) ───────────────────────────────────────────────────────────────
// DFY ($3,000–$4,000 para arriba) es para dueños con capacidad operativa: facturan $10K+/mes, o profesionales y
// dueños con capacidad que quieren escalar. El emprendedor o negocio pequeño sin esa capacidad va a Bori
// (Pro $99 / Agencia $249). Ofrecerle DFY a quien no califica = sobreventa; ofrecerle solo Bori a quien sí = se quedó corto.
// $20K+/mes (o proyectos de $50K–$100K/mes) = SÚPER PRIORITARIO: Lis lo ve primero y Elvin recibe aviso.
export const FACTURACION_SUPER = 20_000;
export const DFY_DESDE = 3_000;
export type Capacidad = "alta" | "media" | "baja";
export type Prioridad = "super" | "alta";

export interface Perfil {
  facturacionMensual: number | null;
  profesion: Profesion | null;
  industria?: string | null;
  capacidad: Capacidad | null;
  quiereEscalar: boolean;
  servicios: string[];
  precioOfrecido: number | null;
  /** Lo que Claude vio mal en la oferta (otro tipo de error, p. ej. le ofrecieron voz y necesitaba marketing). */
  ofertaIncorrectaIA?: string | null;
}

export interface Recomendacion {
  prioridad: Prioridad | null;
  prioridadPor: string | null;
  producto: "DFY" | "Bori" | null;
  productoTexto: string | null;
  /** Cómo le da seguimiento Lis. */
  trato: string | null;
  ofertaIncorrecta: string | null;
}

const miles = (n: number) => `$${Math.round(n / 1000)}K`;

export function productoIndicado(p: Perfil): "DFY" | "Bori" | null {
  const f = p.facturacionMensual;
  if (f != null && f >= FACTURACION_ALTA) return "DFY";
  if (p.capacidad === "baja") return "Bori";
  if (f != null && p.capacidad !== "alta" && !(p.profesion && p.quiereEscalar)) return "Bori";
  if (p.profesion || p.capacidad === "alta") return "DFY";
  if (f == null && p.capacidad == null) return null; // no se habló de números ni de operación
  return p.quiereEscalar ? "DFY" : "Bori";
}

export function recomendar(p: Perfil): Recomendacion {
  const producto = productoIndicado(p);
  const f = p.facturacionMensual ?? 0;
  const alta = altaIntencion(p);
  const prioridad: Prioridad | null = f >= FACTURACION_SUPER ? "super" : alta.alta && producto === "DFY" ? "alta" : null;
  const prioridadPor = prioridad === "super" ? `factura ~${miles(f)}/mes` : prioridad ? alta.por : null;
  const ofreceDFY = p.servicios.includes("DFY") || (p.precioOfrecido ?? 0) >= DFY_DESDE;
  const soloBori = p.servicios.includes("Bori") && !ofreceDFY;
  // Sobreventa solo con evidencia (factura < $10K o se ve sin capacidad), no por falta de datos.
  const sinCapacidad = p.capacidad === "baja" || (p.facturacionMensual != null && p.facturacionMensual < FACTURACION_ALTA);
  const ofertaIncorrecta =
    producto === "Bori" && ofreceDFY && sinCapacidad
      ? `Sobreventa: se le ofreció DFY${p.precioOfrecido ? ` ($${p.precioOfrecido.toLocaleString("en-US")})` : ""} y no tiene la capacidad todavía${p.facturacionMensual ? ` (factura ~${miles(p.facturacionMensual)}/mes)` : ""}; lo indicado era Bori`
      : producto === "DFY" && soloBori
        ? "Se quedó corto: se le ofreció solo Bori y califica para DFY"
        : (p.ofertaIncorrectaIA ?? null);
  const trato =
    prioridad === "super"
      ? "SÚPER PRIORITARIO: trato a la medida. Avísale a Elvin antes de escribirle; DFY completo (marketing + IA) desde $4,000, con plan de pago si hace falta."
      : producto === "DFY"
        ? "Ofrécele DFY ($3,000–$4,000) con un trato especial: descuento por decidir esta semana, financiamiento o plan de pago (inicial + cuotas)."
        : producto === "Bori"
          ? "Todavía no califica para DFY: ofrécele Bori Pro ($99/mes) o Agencia ($249/mes) y retómalo para DFY cuando facture $10K+ al mes."
          : null;
  return {
    prioridad,
    prioridadPor,
    producto,
    productoTexto: producto === "DFY" ? "DFY · Done For You ($3,000–$4,000+)" : producto === "Bori" ? "Bori Pro $99/mes o Agencia $249/mes" : null,
    trato,
    ofertaIncorrecta,
  };
}

/** ¿Es un lead que nos gusta? Y por qué, para la ficha. */
export function altaIntencion(l: { facturacionMensual: number | null; profesion: Profesion | null; industria?: string | null }): { alta: boolean; por: string | null } {
  const por: string[] = [];
  if (l.profesion === "salud" || /^doctores$/i.test(l.industria ?? "")) por.push("profesional de la salud");
  else if (l.profesion === "legal" || /^abogados$/i.test(l.industria ?? "")) por.push("abogado");
  if ((l.facturacionMensual ?? 0) >= FACTURACION_ALTA) por.push(`factura ~$${Math.round(l.facturacionMensual! / 1000)}K/mes`);
  return { alta: por.length > 0, por: por.length ? por.join(" · ") : null };
}

const str = (v: unknown, max = 600): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s && !/^(null|n\/a|ninguno|desconocido)$/i.test(s) ? s.slice(0, max) : null;
};

const emailValido = (s: string | null) => (s && /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(s) ? s.toLowerCase() : null);

/** Respuesta de Claude (JSON, a veces con ```json) → lectura validada. Lo dudoso queda en null. */
export function leerLecturaLlamada(salida: string): LecturaLlamada | null {
  const m = salida.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let j: Record<string, unknown>;
  try {
    j = JSON.parse(m[0]);
  } catch {
    return null;
  }
  const compro = j.compro === "si" || j.compro === "no" ? j.compro : "no_claro";
  const marca = j.marca === "level_up" || j.marca === "ai_borinquen" ? j.marca : null;
  return {
    esVenta: j.es_venta !== false,
    compro,
    marca,
    nombre: str(j.nombre, 120),
    telefono: str(j.telefono, 30),
    email: emailValido(str(j.email, 160)),
    negocio: str(j.negocio, 160),
    industria: str(j.industria, 80),
    servicios: Array.isArray(j.servicios) ? serviciosDe(j.servicios.join(" + ")) : serviciosDe(j.servicios),
    objecion: objecionDe(j.objecion),
    temperatura: temperaturaDe(j.temperatura),
    feedback: str(j.feedback, 900),
    proximoPaso: str(j.proximo_paso, 300),
    presion: j.presion === true,
    razon: str(j.razon, 300),
    facturacionMensual: montoDe(j.facturacion_mensual),
    profesion: j.profesion === "salud" || j.profesion === "legal" ? j.profesion : null,
    descartado: j.descartado === true,
    capacidad: j.capacidad_operativa === "alta" || j.capacidad_operativa === "media" || j.capacidad_operativa === "baja" ? j.capacidad_operativa : null,
    quiereEscalar: j.quiere_escalar === true,
    precioOfrecido: montoDe(j.precio_ofrecido),
    ofertaIncorrectaIA: str(j.oferta_incorrecta, 300),
  };
}

/** Columna donde entra una llamada que no cerró. Sin temperatura clara → Por revisar (Lis decide). */
export function etapaDeLectura(l: LecturaLlamada): string {
  if (l.descartado && l.compro !== "no_claro") return ETAPA_PERDIDO;
  if (l.compro === "no_claro" || !l.temperatura) return "Por revisar";
  return ETAPA_DE_TEMPERATURA[l.temperatura];
}

/** ¿Va al embudo? Solo llamadas de venta donde NO compró (o no está claro). */
export function vaASeguimiento(l: LecturaLlamada | null): boolean {
  return !!l && l.esVenta && l.compro !== "si";
}

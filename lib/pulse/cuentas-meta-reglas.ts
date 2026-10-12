// Verificación de la cuenta publicitaria de cada cliente de Level Up (12/oct/2026). Elvin: "cómo aseguramos que Bori
// lea todas las cuentas y queden conectadas el día del onboarding". Puro y testeado (tests/cuentas-meta.test.mjs);
// lo usa lib/pulse/cuentas-meta.ts (consulta a Meta, comentarios en la ficha y avisos por DM).
// Proceso (Carilin, 12/oct): en el ONBOARDING el cliente configura su cuenta y nos da permiso como socio (eso lo sigue
// Jessica); el ESTRATEGA asignado pone el ID en Pulse, porque Jessica no tiene acceso a ningún administrador de anuncios.

export const PORTAFOLIO_LU = process.env.CUENTAS_META_PORTAFOLIO_ID || "836808821982174"; // "Level Up" en Business Manager

export type EstadoCuenta =
  | "ok" // la lee y está activa
  | "sin-id" // la ficha no trae el ID
  | "sin-permiso" // el dueño no la compartió con nuestro portafolio
  | "no-existe" // el ID no existe o está mal escrito
  | "pago" // la lee, pero Meta la tiene con pago pendiente / en gracia
  | "inactiva" // la lee, pero está deshabilitada, en revisión o cerrada
  | "transitorio"; // error de Meta o del token: no es culpa del cliente, no se avisa por cliente

/** A quién le toca: compartir la cuenta (permiso de socio) es del onboarding; el ID y lo demás, del estratega. */
export type Rol = "onboarding" | "estratega" | "asignar"; // asignar = cliente sin estratega (lo asigna Jessica, Carilin en copia)
export const rolDe = (e: EstadoCuenta): Rol => (e === "sin-permiso" ? "onboarding" : "estratega");

/** ¿Ya tuvo la reunión de onboarding? (Jessica, 12/oct: "los que no tienen estratega es porque aún no han tenido la
 * reunión"). Fuera del grupo ONBOARDING & SETUP, sí; dentro, solo si "Status del Set Up"/"Progreso" ya dicen completado.
 * Antes de eso no se avisa que falta el ID: se pide en esa reunión. */
export function onboardingHecho(f: { grupo: string; setup?: string | null; progreso?: string | null }): boolean {
  if (!/onboarding/i.test(f.grupo)) return true;
  return /complet|listo|todo ok/i.test(`${f.setup ?? ""} ${f.progreso ?? ""}`);
}

export const PROBLEMAS: EstadoCuenta[] = ["sin-id", "sin-permiso", "no-existe", "pago", "inactiva"];
export const esProblema = (e: EstadoCuenta | null | undefined) => !!e && PROBLEMAS.includes(e);

/** El ID tal como lo escribe el cliente ("act_123 456", "ID: 1234…") → solo dígitos, o null si no parece un ID (8–20 dígitos). */
export function limpiarId(valor: unknown): string | null {
  const d = String(valor ?? "").replace(/^\s*act_/i, "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 20 ? d : null;
}

export interface RespuestaMeta {
  account_status?: number;
  name?: string;
  error?: { code?: number; message?: string; error_subcode?: number };
}

// account_status de Meta: 1 activa · 2 deshabilitada · 3 pago pendiente · 7 en revisión de riesgo · 8 liquidando · 9 en gracia · 100 en revisión · 101 cerrada · 201 cualquier cierre
export function clasificar(r: RespuestaMeta): { estado: EstadoCuenta; detalle: string } {
  if (r.error) {
    const { code, message = "" } = r.error;
    if (code === 200 && /NOT grant ads_management or ads_read/i.test(message)) return { estado: "sin-permiso", detalle: "el dueño de la cuenta no la compartió con el portafolio de Level Up" };
    if (code === 100 || code === 803) return { estado: "no-existe", detalle: "Meta dice que ese ID no existe o no lo vemos (revisa que esté bien escrito)" };
    return { estado: "transitorio", detalle: `${message}`.slice(0, 140) || `error ${code ?? "?"}` };
  }
  const s = r.account_status;
  if (s === 1) return { estado: "ok", detalle: "activa" };
  if (s === 3) return { estado: "pago", detalle: "Meta la tiene con pago pendiente: los anuncios no corren hasta resolverlo" };
  if (s === 9) return { estado: "pago", detalle: "está en periodo de gracia por un pago fallido" };
  if (s === 2) return { estado: "inactiva", detalle: "Meta la tiene deshabilitada" };
  if (s === 7 || s === 100) return { estado: "inactiva", detalle: "está en revisión de Meta" };
  if (s === 101 || s === 201 || s === 8) return { estado: "inactiva", detalle: "la cuenta está cerrada" };
  return { estado: "ok", detalle: "se lee bien" };
}

export const PASOS_COMPARTIR =
  `Pídele al cliente (Meta Business Suite → Configuración del negocio → Cuentas → Cuentas publicitarias → su cuenta → Asignar socios): ` +
  `pegar el ID de portafolio ${PORTAFOLIO_LU} ("Level Up") con permiso de *Administrar campañas* (control total).`;

/** Comentario que queda en la ficha cuando cambia el estado. */
export function textoFicha(estado: EstadoCuenta, id: string | null, detalle: string): string {
  switch (estado) {
    case "ok":
      return `✅ Cuenta publicitaria ${id}: Bori la lee y está activa.`;
    case "sin-id":
      return `⚠️ Falta el ID de la cuenta publicitaria. Sin él no podemos leer resultados ni conectar Bori. Lo pone el estratega asignado en la columna «Id cuenta publicitaria» (lo ve en el administrador de anuncios, ya compartido con el portafolio de Level Up).`;
    case "sin-permiso":
      return `⚠️ Bori NO puede leer la cuenta ${id}: ${detalle}. ${PASOS_COMPARTIR}`;
    case "no-existe":
      return `⚠️ Cuenta publicitaria ${id}: ${detalle}. Confirma el ID con el cliente (son 15-16 números, sin "act_").`;
    case "pago":
    case "inactiva":
      return `⚠️ Cuenta publicitaria ${id}: ${detalle}. Bori la lee, pero hay que hablar con el cliente.`;
    default:
      return `Cuenta publicitaria ${id}: ${detalle}`;
  }
}

export interface Linea {
  nombre: string;
  empresa?: string | null;
  id: string | null;
  estado: EstadoCuenta;
  detalle: string;
  admin?: string | null;
}

const ICONO: Partial<Record<EstadoCuenta, string>> = { "sin-id": "🆔", "sin-permiso": "🔒", "no-existe": "❓", pago: "💳", inactiva: "⛔" };

export function textoLinea(l: Linea): string {
  const quien = `${l.nombre}${l.empresa ? ` · ${l.empresa}` : ""}`;
  const adm = l.admin ? ` _(${l.admin})_` : "";
  return `${ICONO[l.estado] ?? "•"} *${quien}*${adm}${l.id ? ` — ${l.id}` : ""}: ${l.detalle}`;
}

/** DM a quien le toca: Jessica (onboarding: compartir la cuenta) o el estratega (el ID en Pulse y lo demás). */
export function textoAviso(p: { nuevos: Linea[]; recuperados: Linea[]; recordatorio?: boolean; rol?: Rol }): string | null {
  const partes: string[] = [];
  if (p.nuevos.length) {
    const estratega = p.rol === "estratega";
    const titulo = p.rol === "asignar"
      ? "🧭 Clientes sin estratega asignado, con la cuenta publicitaria pendiente"
      : p.recordatorio
      ? "📌 Cuentas publicitarias que siguen pendientes"
      : estratega
        ? "🔌 Cuentas publicitarias de tus clientes por completar"
        : "🔌 Cuentas publicitarias por conectar";
    const sinPermiso = p.nuevos.some((l) => l.estado === "sin-permiso");
    const sinId = p.nuevos.some((l) => l.estado === "sin-id" || l.estado === "no-existe");
    partes.push(
      `${titulo} (${p.nuevos.length}):\n` +
        p.nuevos.map((l) => `• ${textoLinea(l)}`).join("\n") +
        (sinId && p.rol !== "asignar" ? `\n\nEl ID va en Pulse, columna «Id cuenta publicitaria» de la ficha (solo los números, sin "act_").` : "") +
        (sinPermiso ? `\n\n${PASOS_COMPARTIR}` : "") +
        (p.rol === "asignar" ? `\n\nAsígnales estratega en «Asignación de Estrategas»: desde ahí los avisos de su cuenta le llegan a él.` : ""),
    );
  }
  if (p.recuperados.length) partes.push(`✅ Ya quedaron conectadas:\n${p.recuperados.map((l) => `• ${l.nombre}${l.empresa ? ` · ${l.empresa}` : ""}`).join("\n")}`);
  return partes.length ? partes.join("\n\n") : null;
}

/** ¿Hay que escribir en la ficha y avisar? Compara con el último estado guardado. */
export function decidir(anterior: EstadoCuenta | null, ahora: EstadoCuenta): { escribir: boolean; avisar: "nuevo" | "recuperado" | null } {
  if (ahora === "transitorio") return { escribir: false, avisar: null };
  if (anterior === ahora) return { escribir: false, avisar: null };
  if (esProblema(ahora)) return { escribir: true, avisar: "nuevo" };
  // ahora está ok: solo se escribe si antes había un problema registrado (si nunca hubo problema, no se llena la ficha de ✅)
  if (esProblema(anterior)) return { escribir: true, avisar: "recuperado" };
  return { escribir: false, avisar: null };
}

/** Reparte las líneas por destinatario: compartir la cuenta → onboarding (Jessica); el resto → el estratega asignado del
 * cliente (`destino`, su correo) o, si no tiene, a quien asigna estrategas (`sinEstratega`: Jessica + Carilin en copia). */
export function repartirAvisos(
  p: { nuevos: (Linea & { destino?: string | null })[]; recuperados: (Linea & { destino?: string | null })[] },
  onboarding: string[],
  sinEstratega: string[],
): { email: string; rol: Rol; nuevos: Linea[]; recuperados: Linea[] }[] {
  const grupos = new Map<string, { email: string; rol: Rol; nuevos: Linea[]; recuperados: Linea[] }>();
  const meter = (emails: string[], rol: Rol, l: Linea, tipo: "nuevos" | "recuperados") => {
    for (const email of emails) {
      const k = `${rol}|${email.toLowerCase()}`;
      if (!grupos.has(k)) grupos.set(k, { email, rol, nuevos: [], recuperados: [] });
      grupos.get(k)![tipo].push(l);
    }
  };
  for (const l of p.nuevos) {
    if (rolDe(l.estado) === "onboarding") meter(onboarding, "onboarding", l, "nuevos");
    else if (l.destino) meter([l.destino], "estratega", l, "nuevos");
    else meter(sinEstratega, "asignar", l, "nuevos");
  }
  for (const l of p.recuperados) meter(l.destino ? [l.destino] : sinEstratega, l.destino ? "estratega" : "asignar", l, "recuperados");
  return [...grupos.values()];
}

// ---------- Asignación de estratega sin el vínculo al cliente (12/oct) ----------
// En «Asignación de Estrategas» muchas filas recientes (81 de 104 sin vínculo) solo traen el nombre del negocio o de la
// persona en el título y no la columna «Nombre del cliente». Para no decir "sin estratega" de quien sí lo tiene, se
// empareja por nombre. Conservador: igualdad, o todas las palabras del título dentro del cliente (mín. 2 palabras).

const SIN_VALOR = new Set(["pr", "llc", "inc", "corp", "corporation", "co", "ads", "ad", "by", "the", "de", "del", "la", "el", "y", "and", "services", "service", "puerto", "rico"]);
const limpio = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const palabras = (t: string) => limpio(t).split(" ").filter((w) => w && !SIN_VALOR.has(w));

export function emparejaAsignacion(titulo: string, cliente: { name: string; empresa?: string | null }): boolean {
  const a = limpio(titulo).replace(/ /g, "");
  if (a.length < 4) return false;
  const pa = palabras(titulo);
  for (const c of [cliente.name, cliente.empresa ?? ""]) {
    if (!c.trim()) continue;
    if (limpio(c).replace(/ /g, "") === a) return true; // "PG Electrical Contractor" = "pgelectricalcontractor"
    const pc = new Set(palabras(c));
    if (pa.length >= 2 && pa.every((w) => pc.has(w))) return true;
  }
  return false;
}

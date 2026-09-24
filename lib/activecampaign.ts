// ActiveCampaign = la herramienta de email del ecosistema. REGLA DE ELVIN (23/sep): cada marca
// tiene SU PROPIA cuenta de AC y nunca se mezclan. ACTIVECAMPAIGN_URL/KEY = la cuenta de Level Up
// (levelupmediapr17748); AI Borinquen usa ACTIVECAMPAIGN_URL_AIB/KEY_AIB. Si la marca no tiene su
// cuenta configurada, todo es no-op para esa marca (nunca cae en la cuenta de otra).
// v3 para contactos/tags/listas; v1 (admin/api.php) para crear campañas, que v3 no soporta.

export type MarcaAC = "level-up" | "ai-borinquen" | "shadow-operator" | "1000x";

let marcaActual: MarcaAC = "level-up";
function cuenta(marca: MarcaAC = marcaActual): { url: string; key: string } {
  const aib = marca === "ai-borinquen";
  const url = (aib ? process.env.ACTIVECAMPAIGN_URL_AIB : process.env.ACTIVECAMPAIGN_URL) ?? "";
  const key = (aib ? process.env.ACTIVECAMPAIGN_KEY_AIB : process.env.ACTIVECAMPAIGN_KEY) ?? "";
  return { url: url.replace(/\/$/, ""), key };
}
const URL = () => cuenta().url;
const KEY = () => cuenta().key;

export function acListo(marca: MarcaAC = "level-up"): boolean {
  const c = cuenta(marca);
  return Boolean(c.url && c.key);
}

// Ids de lista por marca (los crea `scripts/activecampaign.mjs setup` y se pegan en .env).
export function listaDeMarca(marca: MarcaAC): number | null {
  const v = {
    "level-up": process.env.AC_LISTA_LU,
    "ai-borinquen": process.env.AC_LISTA_AIB,
    "shadow-operator": process.env.AC_LISTA_SO,
    "1000x": process.env.AC_LISTA_1000X,
  }[marca];
  return v && Number(v) ? Number(v) : null;
}

// La instancia de AC es lenta y a ratos devuelve 502/503: 3 intentos con 25 s cada uno.
// Un 4xx (p. ej. 422 "ya existe") no se reintenta.
async function v3<T = unknown>(method: "GET" | "POST", ruta: string, body?: unknown): Promise<T> {
  let ultimo = "";
  for (let intento = 0; intento < 3; intento++) {
    try {
      const res = await fetch(`${URL()}/api/3/${ruta}`, {
        method,
        headers: { "Api-Token": KEY(), "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(25000),
      });
      const data = (await res.json().catch(() => ({}))) as T & { errors?: { title: string }[] };
      if (res.ok) return data;
      ultimo = `AC ${method} ${ruta}: ${res.status} ${data.errors?.[0]?.title ?? ""}`;
      if (res.status < 500) break;
    } catch (e) {
      ultimo = `AC ${method} ${ruta}: ${String(e).slice(0, 120)}`;
    }
    await new Promise((r) => setTimeout(r, 1500 * (intento + 1)));
  }
  throw new Error(ultimo);
}

const tagCache = new Map<string, number>();
async function idDeTag(nombreTag: string): Promise<number> {
  const nombre = nombreTag;
  const clave = `${marcaActual === "ai-borinquen" ? "aib" : "lu"}|${nombre}`;
  const c = tagCache.get(clave);
  if (c) return c;
  const r = await v3<{ tags: { id: string; tag: string }[] }>("GET", `tags?search=${encodeURIComponent(nombre)}&limit=100`);
  const existente = r.tags.find((t) => t.tag === nombre);
  const id = existente
    ? Number(existente.id)
    : Number((await v3<{ tag: { id: string } }>("POST", "tags", { tag: { tag: nombre, tagType: "contact" } })).tag.id);
  tagCache.set(clave, id);
  return id;
}

// Campos personalizados por su "personalization tag" (p. ej. CITA_FECHA → %CITA_FECHA% en el
// email). El id se resuelve una vez por instancia; si el campo no existe en AC, se ignora.
const campoCache = new Map<string, number>();
async function idsDeCampos(perstags: string[]): Promise<Map<string, number>> {
  const pre = marcaActual === "ai-borinquen" ? "aib|" : "lu|";
  if (perstags.some((t) => !campoCache.has(pre + t))) {
    const r = await v3<{ fields: { id: string; perstag: string }[] }>("GET", "fields?limit=100");
    for (const f of r.fields) campoCache.set(pre + f.perstag.toUpperCase(), Number(f.id));
  }
  return new Map(perstags.filter((t) => campoCache.has(pre + t)).map((t) => [t, campoCache.get(pre + t)!]));
}

export interface ContactoAC {
  email: string;
  nombre?: string;
  telefono?: string;
  marca: MarcaAC;
  tags?: string[]; // "origen:quiz", "etapa:agendo", "avatar:coach"…
  campos?: Record<string, string>; // custom fields por id numérico (string) → valor
  camposPorTag?: Record<string, string>; // custom fields por perstag (CITA_FECHA…) → valor
}

// Upsert del contacto + tags + lista de la marca. Idempotente. Nunca tira: devuelve ok:false.
// ORDEN IMPORTA (3 pasos): 1) tags de contexto (marca:*, origen:*, agendo-por:*) ANTES de la
// lista, para que la bienvenida —que dispara al suscribirse— ya vea origen:calendly; 2) la
// lista; 3) los tags `etapa:*` DESPUÉS de la lista, porque las pre-llamada/no-show disparan con
// el tag y su segmento exige estar en la lista de la marca (23/sep: con etapa antes de la lista
// ninguna agenda de LU entró a LU · Pre-llamada). Los llamadores deben envolverlo en `after()` (no `void`): en Vercel
// una promesa suelta se corta al responder y el contacto queda sin lista ni tags (22/sep).
export async function upsertContacto(c: ContactoAC): Promise<{ ok: boolean; id?: number; error?: string }> {
  if (!acListo(c.marca)) return { ok: false, error: `ac-no-configurado:${c.marca}` };
  marcaActual = c.marca;
  try {
    const [first, ...rest] = (c.nombre ?? "").trim().split(/\s+/);
    const contact: Record<string, unknown> = { email: c.email.toLowerCase(), firstName: first ?? "", lastName: rest.join(" ") };
    if (c.telefono) contact.phone = c.telefono;
    const fieldValues = Object.entries(c.campos ?? {}).map(([field, value]) => ({ field, value }));
    if (c.camposPorTag && Object.keys(c.camposPorTag).length) {
      const ids = await idsDeCampos(Object.keys(c.camposPorTag).map((t) => t.toUpperCase())).catch(() => new Map<string, number>());
      for (const [tag, value] of Object.entries(c.camposPorTag)) {
        const id = ids.get(tag.toUpperCase());
        if (id) fieldValues.push({ field: String(id), value });
      }
    }
    if (fieldValues.length) contact.fieldValues = fieldValues;
    const r = await v3<{ contact: { id: string } }>("POST", "contact/sync", { contact });
    const id = Number(r.contact.id);
    const fallos: string[] = [];
    const tags = [`marca:${{ "level-up": "lu", "ai-borinquen": "aib", "shadow-operator": "so", "1000x": "1000x" }[c.marca]}`, ...(c.tags ?? [])];
    const ponerTags = async (lista: string[]) => {
      for (const t of lista) {
        try {
          const tagId = await idDeTag(t);
          await v3("POST", "contactTags", { contactTag: { contact: id, tag: tagId } });
        } catch (e) {
          fallos.push(`tag ${t}: ${String(e).slice(0, 80)}`);
        }
      }
    };
    await ponerTags(tags.filter((t) => !t.startsWith("etapa:")));
    const lista = listaDeMarca(c.marca);
    if (lista) {
      await v3("POST", "contactLists", { contactList: { list: lista, contact: id, status: 1 } }).catch((e) =>
        fallos.push(`lista ${lista}: ${String(e).slice(0, 80)}`),
      );
    }
    await ponerTags(tags.filter((t) => t.startsWith("etapa:")));
    if (fallos.length) return { ok: false, id, error: fallos.join(" | ").slice(0, 300) };
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 200) };
  }
}

// Campaña (newsletter) por API v1: crea el mensaje y la campaña. status 0 = borrador,
// 1 = programada (sdate "YYYY-MM-DD HH:MM:SS" en la zona de la cuenta).
export async function crearCampana(opts: {
  marca: MarcaAC;
  nombre: string;
  asunto: string;
  html: string;
  texto?: string;
  fromEmail: string;
  fromName: string;
  sdate?: string;
}): Promise<{ ok: boolean; campaignId?: string; error?: string }> {
  if (!acListo(opts.marca)) return { ok: false, error: `ac-no-configurado:${opts.marca}` };
  marcaActual = opts.marca;
  const lista = listaDeMarca(opts.marca);
  if (!lista) return { ok: false, error: "sin-lista" };
  const v1 = async (action: string, form: Record<string, string>) => {
    const body = new URLSearchParams(form);
    const res = await fetch(`${URL()}/admin/api.php?api_key=${KEY()}&api_action=${action}&api_output=json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as { result_code?: number; result_message?: string; id?: string };
    if (data.result_code !== 1) throw new Error(`AC v1 ${action}: ${data.result_message ?? res.status}`);
    return data;
  };
  try {
    const m = await v1("message_create", {
      format: "mime", subject: opts.asunto, fromemail: opts.fromEmail, fromname: opts.fromName, reply2: opts.fromEmail,
      priority: "3", charset: "utf-8", encoding: "quoted-printable", htmlconstructor: "editor", html: opts.html,
      textconstructor: "editor", text: opts.texto ?? opts.html.replace(/<[^>]+>/g, " "), [`p[${lista}]`]: String(lista),
    });
    const c = await v1("campaign_create", {
      type: "single", name: opts.nombre, sdate: opts.sdate ?? "", status: opts.sdate ? "1" : "0", public: "1",
      tracklinks: "all", trackreads: "1", [`p[${lista}]`]: String(lista), [`m[${m.id}]`]: "100",
    });
    return { ok: true, campaignId: c.id };
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 200) };
  }
}

// ActiveCampaign = la herramienta de email del ecosistema (una cuenta, dos marcas por lista +
// tag). Sin ACTIVECAMPAIGN_URL + ACTIVECAMPAIGN_KEY todo es no-op (las rutas siguen andando).
// v3 para contactos/tags/listas; v1 (admin/api.php) para crear campañas, que v3 no soporta.

export type MarcaAC = "level-up" | "ai-borinquen" | "shadow-operator" | "1000x";

const URL = () => (process.env.ACTIVECAMPAIGN_URL ?? "").replace(/\/$/, "");
const KEY = () => process.env.ACTIVECAMPAIGN_KEY ?? "";

export function acListo(): boolean {
  return Boolean(URL() && KEY());
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

async function v3<T = unknown>(method: "GET" | "POST", ruta: string, body?: unknown): Promise<T> {
  const res = await fetch(`${URL()}/api/3/${ruta}`, {
    method,
    headers: { "Api-Token": KEY(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const data = (await res.json().catch(() => ({}))) as T & { errors?: { title: string }[] };
  if (!res.ok) throw new Error(`AC ${method} ${ruta}: ${res.status} ${data.errors?.[0]?.title ?? ""}`);
  return data;
}

const tagCache = new Map<string, number>();
async function idDeTag(nombre: string): Promise<number> {
  const c = tagCache.get(nombre);
  if (c) return c;
  const r = await v3<{ tags: { id: string; tag: string }[] }>("GET", `tags?search=${encodeURIComponent(nombre)}&limit=100`);
  const existente = r.tags.find((t) => t.tag === nombre);
  const id = existente
    ? Number(existente.id)
    : Number((await v3<{ tag: { id: string } }>("POST", "tags", { tag: { tag: nombre, tagType: "contact" } })).tag.id);
  tagCache.set(nombre, id);
  return id;
}

export interface ContactoAC {
  email: string;
  nombre?: string;
  telefono?: string;
  marca: MarcaAC;
  tags?: string[]; // "origen:quiz", "etapa:agendo", "avatar:coach"…
  campos?: Record<string, string>; // custom fields por id numérico (string) → valor
}

// Upsert del contacto + lista de la marca + tags. Idempotente. Nunca tira: devuelve ok:false.
export async function upsertContacto(c: ContactoAC): Promise<{ ok: boolean; id?: number; error?: string }> {
  if (!acListo()) return { ok: false, error: "ac-no-configurado" };
  try {
    const [first, ...rest] = (c.nombre ?? "").trim().split(/\s+/);
    const contact: Record<string, unknown> = { email: c.email.toLowerCase(), firstName: first ?? "", lastName: rest.join(" ") };
    if (c.telefono) contact.phone = c.telefono;
    if (c.campos) contact.fieldValues = Object.entries(c.campos).map(([field, value]) => ({ field, value }));
    const r = await v3<{ contact: { id: string } }>("POST", "contact/sync", { contact });
    const id = Number(r.contact.id);
    const lista = listaDeMarca(c.marca);
    if (lista) {
      await v3("POST", "contactLists", { contactList: { list: lista, contact: id, status: 1 } }).catch(() => {});
    }
    const tags = [`marca:${{ "level-up": "lu", "ai-borinquen": "aib", "shadow-operator": "so", "1000x": "1000x" }[c.marca]}`, ...(c.tags ?? [])];
    for (const t of tags) {
      const tagId = await idDeTag(t);
      await v3("POST", "contactTags", { contactTag: { contact: id, tag: tagId } }).catch(() => {});
    }
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
  if (!acListo()) return { ok: false, error: "ac-no-configurado" };
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

// Typeform de onboarding de Level Up ("ONBOARDING TYPEFORM", vlfCgUUP) → ficha del cliente en
// Pulse. Aquí solo lo puro (firma + mapeo), testeado en tests/pulse-typeform.test.mjs; el alta
// en la base vive en lib/pulse/alta-typeform.ts.

export const FORM_ONBOARDING_LU = "vlfCgUUP";

// Preguntas por `ref` (estable aunque cambien el texto). Si el form cambia de preguntas, se
// cae al título (ver `porTitulo`).
const REF = {
  negocio: "2e77dbd2-8606-4d4f-ba3d-3b6902fdffb8",
  ubicacion: "05589d6e-370b-4610-873f-65ba28a494b2",
  nombre: "4d707b84-7a3e-4f6a-987a-072939cb2ae5",
  apellido: "8aca66dc-fb22-4cf1-9456-cc7b0b64ed05",
  telefono: "359fc8d8-ba73-448b-baba-f6beb5b09b91",
  email: "8538ca59-7920-4962-ad45-20b40b1adec8",
  redes: "75183473-a317-4e6f-aa48-cecd1c2e1759",
  oferta: "c4b665b5-9c7d-4c69-953d-439a78ad5d2c",
  edad: "079f5e05-cb0e-4709-80f8-0ae57d5f7509",
  segmentacion: "37cfa755-9abe-4aa7-9c4d-8700bdbaa0ec",
  tipoCliente: "d0901918-6230-4632-b468-9cff68def885",
  precios: "5fb3daef-017a-453f-92bc-65cd3e5418bd",
  meta: "d28172c9-32d6-47f0-88b5-53408e26206c",
  diferenciador: "12cb34bc-3191-4a62-a731-587e396568ac",
} as const;
type Clave = keyof typeof REF;

const porTitulo: [RegExp, Clave][] = [
  [/nombre del negocio/i, "negocio"],
  [/ubicaci[oó]n/i, "ubicacion"],
  [/^first name$/i, "nombre"],
  [/^last name$/i, "apellido"],
  [/phone|tel[eé]fono/i, "telefono"],
  [/^e-?mail$/i, "email"],
  [/redes sociales|p[aá]gina web/i, "redes"],
  [/oferta principal/i, "oferta"],
  [/edad/i, "edad"],
  [/segmentaci[oó]n/i, "segmentacion"],
  [/tipo de cliente/i, "tipoCliente"],
  [/precios/i, "precios"],
  [/meta con el marketing/i, "meta"],
  [/elegirte a ti/i, "diferenciador"],
];

export const ETIQUETAS: Record<Clave, string> = {
  negocio: "Negocio",
  ubicacion: "Ubicación",
  nombre: "Nombre",
  apellido: "Apellido",
  telefono: "Teléfono",
  email: "E-mail",
  redes: "Redes y web",
  oferta: "Oferta principal",
  edad: "Edad del público",
  segmentacion: "Segmentación",
  tipoCliente: "Tipo de cliente",
  precios: "Precios",
  meta: "Meta 3-6 meses",
  diferenciador: "Por qué elegirlos",
};

interface Respuesta {
  type: string;
  field: { id: string; ref?: string; type?: string };
  text?: string;
  email?: string;
  phone_number?: string;
  url?: string;
  number?: number;
  boolean?: boolean;
  date?: string;
  choice?: { label?: string; other?: string };
  choices?: { labels?: string[]; other?: string };
}
export interface PayloadTypeform {
  event_id?: string;
  form_response?: {
    form_id: string;
    token: string;
    submitted_at?: string;
    definition?: { fields?: { id: string; ref?: string; title?: string }[] };
    answers?: Respuesta[];
  };
}

export interface DatosOnboarding {
  token: string; // id de la respuesta (idempotencia)
  formId: string;
  enviadoEl: string | null;
  campos: Partial<Record<Clave, string>>;
  nombreCompleto: string;
  telefono: string | null; // formateado +1 787 …
  email: string | null;
}

function valor(a: Respuesta): string {
  if (a.text != null) return a.text;
  if (a.email) return a.email;
  if (a.phone_number) return a.phone_number;
  if (a.url) return a.url;
  if (a.number != null) return String(a.number);
  if (a.boolean != null) return a.boolean ? "Sí" : "No";
  if (a.date) return a.date.slice(0, 10);
  if (a.choice) return a.choice.label ?? a.choice.other ?? "";
  if (a.choices) return [...(a.choices.labels ?? []), ...(a.choices.other ? [a.choices.other] : [])].join(", ");
  return "";
}

// "+17876401068" / "7876401068" → "+1 787 640 1068"
export function formatearTelefono(t: string): string {
  const d = t.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return `+1 ${d.slice(1, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `+1 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return t.trim();
}

export function mapearRespuesta(p: PayloadTypeform): DatosOnboarding | null {
  const fr = p.form_response;
  if (!fr?.token || !fr.answers) return null;
  const titulos = new Map((fr.definition?.fields ?? []).map((f) => [f.id, f.title ?? ""]));
  const inv = new Map<string, Clave>(Object.entries(REF).map(([k, v]) => [v as string, k as Clave]));
  const campos: Partial<Record<Clave, string>> = {};
  for (const a of fr.answers) {
    let clave = a.field.ref ? inv.get(a.field.ref) : undefined;
    if (!clave) {
      const t = titulos.get(a.field.id) ?? "";
      clave = porTitulo.find(([re]) => re.test(t))?.[1];
    }
    if (!clave) continue;
    const v = valor(a).trim();
    if (v) campos[clave] = v.slice(0, 2000);
  }
  const nombreCompleto = [campos.nombre, campos.apellido].filter(Boolean).join(" ").trim() || campos.negocio || "Cliente nuevo (Typeform)";
  return {
    token: fr.token,
    formId: fr.form_id,
    enviadoEl: fr.submitted_at ?? null,
    campos,
    nombreCompleto: nombreCompleto.slice(0, 300),
    telefono: campos.telefono ? formatearTelefono(campos.telefono) : null,
    email: campos.email ? campos.email.toLowerCase() : null,
  };
}

// Texto del comentario con TODAS las respuestas, para que el equipo vea la ficha completa.
export function resumenOnboarding(d: DatosOnboarding): string {
  const orden: Clave[] = ["negocio", "ubicacion", "nombre", "apellido", "telefono", "email", "redes", "oferta", "edad", "segmentacion", "tipoCliente", "precios", "meta", "diferenciador"];
  const mostrar = (k: Clave) => (k === "telefono" && d.telefono ? d.telefono : k === "email" && d.email ? d.email : d.campos[k]);
  const lineas = orden.filter((k) => d.campos[k]).map((k) => `• ${ETIQUETAS[k]}: ${mostrar(k)}`);
  return `📝 Respuestas del Typeform de onboarding${d.enviadoEl ? ` (${d.enviadoEl.slice(0, 10)})` : ""}\n${lineas.join("\n")}`;
}

// Typeform firma el cuerpo crudo: header `Typeform-Signature: sha256=<base64(HMAC-SHA256)>`.
export async function firmaTypeformValida(cuerpo: string, header: string | null, secreto: string | undefined): Promise<boolean> {
  if (!header || !secreto || !header.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(cuerpo)));
  const esperada = "sha256=" + btoa(String.fromCharCode(...sig));
  if (esperada.length !== header.length) return false;
  let diff = 0;
  for (let i = 0; i < esperada.length; i++) diff |= esperada.charCodeAt(i) ^ header.charCodeAt(i);
  return diff === 0;
}

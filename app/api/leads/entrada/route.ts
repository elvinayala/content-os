import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { ingestarLead, listarEmbudos, registrarWebhook } from "@/lib/leads/repo";
import { clave, MARCAS } from "@/lib/leads/reglas";

// Entrada genérica de leads a un embudo (lo que antes hacía Zapier → Pipedrive en las clases de
// Diego, Frankie, CF y Valentina). Zapier ("Webhooks by Zapier" → POST) o cualquier formulario:
//   /api/leads/entrada?marca=level-up&embudo=<id o nombre>&s=LEADS_WEBHOOK_SECRET[&etapa=<nombre>]
// Cuerpo JSON o form, nombres de campo tolerantes (name/nombre/full_name, email/correo,
// phone/telefono/whatsapp, negocio/business/company, utm_source). Sin duplicar: si ese teléfono o
// email ya tiene un lead abierto en la marca, lo actualiza y le deja la nota.
export const runtime = "nodejs";
export const maxDuration = 30;

function secretoOk(s: string | null): boolean {
  const esperado = process.env.LEADS_WEBHOOK_SECRET ?? "";
  if (!esperado || !s) return false;
  const a = Buffer.from(s);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

const CAMPOS = {
  nombre: ["nombre", "name", "full_name", "fullname", "first_name", "contact_name"],
  apellido: ["apellido", "last_name", "lastname"],
  email: ["email", "correo", "e-mail", "email_address"],
  telefono: ["telefono", "teléfono", "phone", "phone_number", "whatsapp", "celular", "mobile"],
  negocio: ["negocio", "business", "company", "empresa", "company_name", "business_name"],
  utm: ["utm_source", "utm", "source", "fuente"],
};

function tomar(o: Record<string, unknown>, claves: string[]): string {
  const mapa = new Map(Object.entries(o).map(([k, v]) => [k.trim().toLowerCase(), v]));
  for (const k of claves) {
    const v = mapa.get(k);
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

export async function POST(req: NextRequest) {
  const u = new URL(req.url);
  if (!secretoOk(u.searchParams.get("s"))) return NextResponse.json({ error: "no-autorizado" }, { status: 401 });
  const m = MARCAS[u.searchParams.get("marca") ?? ""];
  if (!m) return NextResponse.json({ error: "marca" }, { status: 400 });

  let cuerpo: Record<string, unknown> = {};
  const tipo = req.headers.get("content-type") ?? "";
  try {
    if (tipo.includes("json")) cuerpo = (await req.json()) as Record<string, unknown>;
    else cuerpo = Object.fromEntries((await req.formData()).entries()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "cuerpo" }, { status: 400 });
  }
  // Zapier a veces anida en "data".
  const datos = typeof cuerpo.data === "object" && cuerpo.data ? { ...cuerpo, ...(cuerpo.data as Record<string, unknown>) } : cuerpo;

  const pedido = u.searchParams.get("embudo") ?? "";
  const embudos = await listarEmbudos(m.marca);
  const emb = embudos.find((e) => e.id === pedido) ?? embudos.find((e) => clave(e.nombre) === clave(pedido));
  if (!emb) return NextResponse.json({ error: "embudo-no-existe", embudos: embudos.map((e) => ({ id: e.id, nombre: e.nombre })) }, { status: 404 });

  const nombre = [tomar(datos, CAMPOS.nombre), tomar(datos, CAMPOS.apellido)].filter(Boolean).join(" ");
  const email = tomar(datos, CAMPOS.email);
  const telefono = tomar(datos, CAMPOS.telefono);
  if (!email && !telefono) {
    await registrarWebhook("entrada", m.marca, emb.nombre, "sin-contacto", cuerpo).catch(() => {});
    return NextResponse.json({ error: "falta-email-o-telefono" }, { status: 400 });
  }
  const r = await ingestarLead({
    marca: m.marca,
    embudo: emb.nombre,
    etapa: u.searchParams.get("etapa") ?? undefined,
    nombre: nombre || email || telefono,
    email: email || null,
    telefono: telefono || null,
    negocio: tomar(datos, CAMPOS.negocio) || null,
    origen: u.searchParams.get("origen") ?? "zapier",
    agendoPor: tomar(datos, CAMPOS.utm) || null,
    nota: `📝 Entró por ${emb.nombre}`,
    moverSiExiste: false,
  });
  await registrarWebhook("entrada", m.marca, emb.nombre, `${r.nuevo ? "lead-nuevo" : "existente"}:${r.id}`, cuerpo).catch(() => {});
  return NextResponse.json({ ok: true, id: r.id, nuevo: r.nuevo });
}

export function GET() {
  return NextResponse.json({ ok: true, servicio: "Leads · entrada de formularios/Zapier" });
}

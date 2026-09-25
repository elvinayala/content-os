import { NextRequest, NextResponse } from "next/server";

import { BloqueoMax, buscarLlamadas, canalClientePermitido, canalesDelBot, enviarAprobado, leerCanal, leerHilo, notaEnAprobaciones, proponer } from "@/lib/max/flujo";
import { ETAPAS, slugCliente, TIPOS_ITEM, type EstadoItem, type TipoItem } from "@/lib/max/operador";
import { actualizarItem, alBuzonMax, cliente, guardarCliente, item, items, listarClientes } from "@/lib/max/repo";
import { asegurarCarpeta, driveListo, guardarArchivo, guardarDoc, listarCarpeta, saludDrive } from "@/lib/max/drive";
import { secretoValido } from "@/lib/pulse/seguridad";

// Max en Slack — las manos de Max (scripts/max.mjs, desde su contenedor de Railway). Auth con
// CRON_SECRET; pública en proxy.ts. Max NO tiene un camino para escribirle al cliente: solo puede
// PROPONER (va a #max-aprobaciones) y dejar notas en #max-aprobaciones. Lo que llega al cliente lo
// publica lib/max/flujo.ts cuando Elvin o Carilin dicen "ok".
//
//   GET  ?clientes=1 · ?cliente=<slug> · ?item=<id> · ?items=<estado>[&cliente=] · ?leer=<slug>[&n=]
//        ?hilo=<ts>&canal=<id|slug> · ?canales=1 · ?llamadas=<nombre>
//   POST { accion: "cliente", slug?, nombre, canal?, etapa?, ficha?, meta? }
//        { accion: "proponer", cliente, tipo, titulo, contenido, hilo?, nota?, datos? }
//        { accion: "nota", texto, hilo? }                 nota de Max en #max-aprobaciones
//        { accion: "cerrar", id, estado: ejecutado|fallido, resultado, datos? }
//        { accion: "enviar", id }                         reintenta enviar al cliente algo YA aprobado
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function autorizado(req: NextRequest): boolean {
  return secretoValido(req.headers.get("x-cron-secret"), process.env.CRON_SECRET);
}
const mal = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

export async function GET(req: NextRequest) {
  if (!autorizado(req)) return mal("no-autorizado", 401);
  const q = req.nextUrl.searchParams;
  if (q.get("clientes")) return NextResponse.json({ ok: true, clientes: await listarClientes() });
  if (q.get("cliente")) return NextResponse.json({ ok: true, cliente: await cliente(q.get("cliente")!) });
  if (q.get("item")) return NextResponse.json({ ok: true, item: await item(Number(q.get("item"))) });
  if (q.has("items")) return NextResponse.json({ ok: true, items: await items({ estado: q.get("items") || undefined, cliente: q.get("cliente") || undefined, limite: Number(q.get("n")) || 30 }) });
  if (q.get("canales")) return NextResponse.json({ ok: true, canales: await canalesDelBot() });
  if (q.get("llamadas")) return NextResponse.json({ ok: true, texto: await buscarLlamadas(q.get("llamadas")!) });
  const canalDe = async (x: string | null) => (x && /^[CG][A-Z0-9]{6,}$/.test(x) ? x : x ? (await cliente(x))?.canal ?? null : null);
  if (q.get("leer")) {
    const canal = await canalDe(q.get("leer"));
    if (!canal) return mal("ese cliente no tiene canal vinculado", 404);
    if (!canalClientePermitido(canal)) return mal("ese canal no está habilitado para Max", 403);
    return NextResponse.json({ ok: true, texto: await leerCanal(canal, Number(q.get("n")) || 30) });
  }
  if (q.get("hilo")) {
    const canal = (await canalDe(q.get("canal"))) || process.env.SLACK_MAX_CHANNEL_ID || "";
    if (!canal) return mal("canal");
    if (canal !== process.env.SLACK_MAX_CHANNEL_ID && !canalClientePermitido(canal)) return mal("ese canal no está habilitado para Max", 403);
    return NextResponse.json({ ok: true, texto: await leerHilo(canal, q.get("hilo")!) });
  }
  return mal("consulta");
}

export async function POST(req: NextRequest) {
  if (!autorizado(req)) return mal("no-autorizado", 401);
  let b: Record<string, unknown>;
  try {
    b = (await req.json()) as Record<string, unknown>;
  } catch {
    return mal("body");
  }
  const s = (k: string, max = 20000) => (typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : undefined);
  const obj = (k: string) => (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) ? (b[k] as Record<string, unknown>) : undefined);

  switch (b.accion) {
    case "cliente": {
      const nombre = s("nombre", 200);
      const slug = s("slug", 48) || (nombre ? slugCliente(nombre) : "");
      if (!slug) return mal("slug o nombre");
      const etapa = s("etapa", 40);
      if (etapa && !(ETAPAS as readonly string[]).includes(etapa)) return mal(`etapa: ${ETAPAS.join(" | ")}`);
      const canal = s("canal", 20);
      if (canal && !/^[CG][A-Z0-9]{6,}$/.test(canal)) return mal("canal: id de Slack (C…)");
      if (canal && !canalClientePermitido(canal)) return mal("ese canal no está habilitado para Max: por ahora ningún canal de cliente lo está (Elvin, 24/sep). Trabaja por #max-aprobaciones.", 403);
      return NextResponse.json({ ok: true, cliente: await guardarCliente({ slug, nombre, canal, etapa, ficha: obj("ficha"), meta: obj("meta") }) });
    }
    case "proponer": {
      const tipo = s("tipo", 20) as TipoItem | undefined;
      if (!tipo || !TIPOS_ITEM.includes(tipo)) return mal(`tipo: ${TIPOS_ITEM.join(" | ")}`);
      const slug = s("cliente", 48);
      const contenido = s("contenido", 30000);
      if (!slug || !contenido) return mal("cliente y contenido");
      if (!(await cliente(slug)) && tipo !== "interno") return mal(`no existe el cliente ${slug}: créalo primero (accion cliente)`, 404);
      // "publicar" solo lo crea meta-ads.mjs proponer-publicar, con los ids exactos a prender.
      const datos = obj("datos");
      if (tipo === "publicar" && !(Array.isArray(datos?.ids) && (datos!.ids as unknown[]).length)) return mal("publicar necesita datos.ids (usa meta-ads.mjs proponer-publicar)");
      let r;
      try {
        r = await proponer({ cliente: slug, tipo, titulo: s("titulo", 200), contenido, hilo: s("hilo", 30), nota: s("nota", 1000), datos });
      } catch (e) {
        if (e instanceof BloqueoMax) return mal(e.message, 422);
        throw e;
      }
      return NextResponse.json({ ok: true, id: r.item.id, aviso: r.aviso });
    }
    case "nota": {
      const texto = s("texto", 30000);
      if (!texto) return mal("texto");
      return NextResponse.json({ ok: await notaEnAprobaciones(texto, s("hilo", 30)) });
    }
    case "cerrar": {
      const id = Number(b.id);
      const estado = s("estado", 20) as EstadoItem | undefined;
      if (!id || !estado || !["ejecutado", "fallido"].includes(estado)) return mal("id y estado ejecutado|fallido");
      const actual = await item(id);
      if (!actual) return mal("item", 404);
      // Solo se cierra lo que se aprobó (o lo interno): Max no puede dar por hecho algo que nadie autorizó.
      if (actual.estado !== "aprobado" && actual.tipo !== "interno") return mal(`la #${id} está ${actual.estado}`, 409);
      const resultado = s("resultado", 4000) || estado;
      const i = await actualizarItem(id, { estado, resultado, datos: obj("datos") });
      await notaEnAprobaciones(`${estado === "ejecutado" ? "✅" : "⚠️"} #${id}: ${resultado}`, actual.aprobacion_ts);
      return NextResponse.json({ ok: true, item: i });
    }
    // Drive del cliente (24/sep): carpeta (idempotente), documentos y archivos por subcarpeta.
    case "drive-carpeta":
    case "drive-doc":
    case "drive-archivo":
    case "drive-listar":
    case "drive-salud": {
      if (!driveListo()) return mal("Drive no está conectado todavía (DRIVE_SCRIPT_URL / DRIVE_SCRIPT_SECRETO en Vercel)", 503);
      try {
        if (b.accion === "drive-salud") return NextResponse.json({ ok: true, raiz: await saludDrive() });
        const slug = s("cliente", 48);
        if (!slug || !(await cliente(slug))) return mal("cliente", 404);
        if (b.accion === "drive-carpeta") return NextResponse.json({ ok: true, ...(await asegurarCarpeta(slug, { hilo: s("hilo", 30) })) });
        if (b.accion === "drive-listar") return NextResponse.json({ ok: true, archivos: await listarCarpeta(slug) });
        const sub = s("sub", 60) || "";
        if (b.accion === "drive-doc") {
          const texto = s("texto", 100000);
          if (!texto) return mal("texto");
          return NextResponse.json({ ok: true, ...(await guardarDoc(slug, sub, s("nombre", 200) || "Documento", texto)) });
        }
        const url = s("url", 2000);
        if (!url) return mal("url");
        return NextResponse.json({ ok: true, ...(await guardarArchivo(slug, sub, url, s("nombre", 200))) });
      } catch (e) {
        return mal(e instanceof Error ? e.message : String(e), 502);
      }
    }
        case "buzon-prueba": {
      // Solo para pruebas de punta a punta: simula lo que llegaría de Slack (p. ej. el resumen de Jessica
      // en el hilo) sin que nadie tenga que escribir. Se marca PRUEBA para que Max lo sepa.
      const texto = s("texto", 8000);
      if (!texto || !/prueba/i.test(texto)) return mal("texto (tiene que decir PRUEBA)");
      return NextResponse.json({ ok: true, id: await alBuzonMax(texto) });
    }
        case "enviar": {
      const r = await enviarAprobado(Number(b.id));
      return NextResponse.json({ ok: r.ok, texto: r.texto }, { status: r.ok ? 200 : 409 });
    }
    default:
      return mal("accion");
  }
}

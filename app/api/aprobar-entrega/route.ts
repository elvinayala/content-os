import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_SESION, sesionValida } from "@/lib/auth";
import { acListo, crearCampana } from "@/lib/activecampaign";
import { creadorDeDestino } from "@/lib/creadores";

export const runtime = "nodejs";

// Cuando Elvin aprueba una entrega hay dos destinos según para quién sea:
//  - Si tiene `para` = un creador del equipo (ej. Valentina) → se lo mandamos A ÉL
//    por DM de Slack (con el bot token), listo para grabar o pedir revisión.
//  - Si no tiene `para` → va al canal general (SLACK_APROBADOS_WEBHOOK) para que la
//    community manager (Heidy) lo tenga listo para publicar.
// Solo texto, sin login extra para ellos: lo ven en Slack.

const MARCA_NOMBRE: Record<string, string> = {
  "shadow-operator": "Shadow Operator",
  "ai-borinquen": "AI Borinquen",
  "level-up": "Level Up Media",
};
const TIPO_NOMBRE: Record<string, string> = {
  idea: "Idea",
  gancho: "Gancho",
  guion: "Guión / Reel",
  carrusel: "Carrusel",
  historia: "Historias",
  anuncio: "Anuncio UGC",
  email: "Email",
};
const LISTA_NOMBRE: Record<string, string> = {
  clientes: "Clientes",
  inactivos: "Inactivos",
  "agendados-no-compraron": "Agendaron · no compraron",
  "newsletter-general": "Newsletter general",
};
// Pilar → etiqueta legible (problema / solución / producto / mentalidad…).
function pilarNombre(p?: string): string {
  if (!p) return "";
  const limpio = p.trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

interface EntregaBody {
  titulo?: string;
  marca?: string;
  tipo?: string;
  pilar?: string;
  contenido?: string;
  angulo?: string;
  plataforma?: string;
  para?: string;
  lista?: string;
}

// Slack de Elvin (CEO): recibe una copia de todo lo que aprueba, para tener
// visibilidad de qué salió y a quién, sin que el creador lo vea. Override por env.
const CEO_SLACK_ID = process.env.CEO_SLACK_ID ?? "U08U9777PUY";

// DM directo por chat.postMessage. Con `token` explícito postea con ese token
// (ej. el USER token de Elvin → el DM cae en la conversación que Elvin YA tiene con
// esa persona, no en el DM del bot). Sin token, usa el bot. Devuelve ok/estado.
async function dmCreador(
  slackId: string,
  text: string,
  token = process.env.SLACK_BOT_TOKEN,
): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: "Falta token de Slack." };
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: slackId, text }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    return { ok: Boolean(data.ok), error: data.error };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch" };
  }
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_SESION)?.value;
  if (!(await sesionValida(cookie))) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }

  let e: EntregaBody;
  try {
    e = (await req.json()) as EntregaBody;
  } catch {
    return NextResponse.json({ ok: false, error: "body" }, { status: 400 });
  }

  const marca = MARCA_NOMBRE[e.marca ?? ""] ?? e.marca ?? "—";
  const tipo = TIPO_NOMBRE[e.tipo ?? ""] ?? e.tipo ?? "";
  const pilar = pilarNombre(e.pilar);
  const ficha = [
    `*Para:* ${marca}`,
    tipo ? `*Formato:* ${tipo}` : "",
    pilar ? `*Pilar:* ${pilar}` : "",
    e.angulo ? `*Ángulo:* ${e.angulo}` : "",
  ]
    .filter(Boolean)
    .join("   ·   ");

  // Emails: al aprobar van al canal del equipo (Elvin, Carilin, Jessica) para
  // cargarlos en la herramienta de email. Se postea con el USER token (xoxp), que
  // publica en el canal sin necesidad de invitar al bot. Respaldo: DM a Elvin.
  if (e.tipo === "email") {
    const listaLbl = e.lista ? (LISTA_NOMBRE[e.lista] ?? e.lista) : "—";

    // Newsletter aprobado → campaña en ActiveCampaign programada para el próximo
    // jueves 8:00 AM PR (o borrador si NEWSLETTER_AUTO=draft). Sin AC configurado,
    // sigue el camino de siempre (Slack al equipo para cargarlo a mano).
    if (e.lista === "newsletter-general" && acListo() && (e.marca === "level-up" || e.marca === "ai-borinquen")) {
      const md = e.contenido ?? "";
      const asunto = (md.match(/##\s*Asunto[^\n]*\n+\s*(?:1\.\s*)?([^\n]+)/i)?.[1] ?? e.titulo ?? "Newsletter").replace(/^["“]|["”]$/g, "").trim();
      const cuerpo = (md.split(/##\s*Cuerpo/i)[1] ?? md).split(/##\s*CTA/i)[0].trim();
      const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.55;max-width:600px;margin:0 auto;color:#1a1a1a">` +
        cuerpo.split(/\n\n+/).map((p) => `<p>${p.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>`).join("") + `</div>`;
      const from = e.marca === "level-up"
        ? { fromName: "Elvin · Level Up Media", fromEmail: process.env.AC_FROM_LU ?? "elvin@levelupmediapr.net", nombre: "El Sistema" }
        : { fromName: "Elvin · AI Borinquen", fromEmail: process.env.AC_FROM_AIB ?? "hola@aiborinquen.co", nombre: "Tu equipo digital" };
      // Próximo jueves 8:00 AM hora PR (UTC-4), en el formato que pide la API v1.
      const ahora = new Date(Date.now() - 4 * 3600_000);
      const dias = (4 - ahora.getUTCDay() + 7) % 7 || 7;
      const jueves = new Date(ahora); jueves.setUTCDate(ahora.getUTCDate() + dias);
      const sdate = process.env.NEWSLETTER_AUTO === "draft" ? undefined : `${jueves.toISOString().slice(0, 10)} 08:00:00`;
      const r = await crearCampana({ marca: e.marca, nombre: `${from.nombre} · ${jueves.toISOString().slice(0, 10)}`, asunto, html, texto: cuerpo, fromEmail: from.fromEmail, fromName: from.fromName, sdate });
      const aviso = r.ok
        ? `:email: *Newsletter ${from.nombre} ${sdate ? "programado para el jueves 8:00 AM" : "creado como borrador"} en ActiveCampaign* (campaña ${r.campaignId}) · asunto: ${asunto}`
        : `:warning: Newsletter aprobado pero ActiveCampaign falló (${r.error}). Cárgalo a mano.`;
      await dmCreador(CEO_SLACK_ID, aviso);
      if (r.ok) return NextResponse.json({ ok: true, destino: "activecampaign", campaignId: r.campaignId, programado: Boolean(sdate) });
    }

    const texto = [
      `:email: *Email aprobado — listo para enviar*  (${marca} · lista: ${listaLbl})`,
      e.titulo ? `\n*${e.titulo}*` : "",
      e.contenido ? `\n${e.contenido}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    const canal = process.env.SLACK_EMAILS_CHANNEL;
    const userToken = process.env.SLACK_LEVELUP_TOKEN;
    if (canal && userToken) {
      try {
        const res = await fetch("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ channel: canal, text: texto }),
          signal: AbortSignal.timeout(8000),
        });
        const data = (await res.json()) as { ok?: boolean };
        if (data.ok) {
          return NextResponse.json({ ok: true, destino: "canal correos-aprobados" });
        }
      } catch {
        // cae al respaldo
      }
    }
    // Respaldo: DM a Elvin con el bot.
    const r = await dmCreador(CEO_SLACK_ID, texto);
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `slack: ${r.error ?? "?"}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, destino: "Elvin (email)" });
  }

  // ¿Es para un creador con Slack? → DM directo, listo para grabar. Se envía con el
  // USER token de Elvin (SLACK_LEVELUP_TOKEN) para que caiga en el DM que Elvin YA
  // tiene con esa persona (donde de verdad lo ve), no en el DM del bot. Si falta el
  // user token, cae al bot.
  const creador = creadorDeDestino(e.para);
  if (creador) {
    const partes = [
      `:clapper: *Guión aprobado — listo para grabar*  (${marca})`,
      e.titulo ? `\n*${e.titulo}*` : "",
      e.contenido ? `\n${e.contenido}` : "",
      "\n———",
      "Cuando lo grabes responde *lista* :white_check_mark:. Si quieres cambios, responde acá *necesito revisión:* y dime qué ajustar — lo tomo y te lo devuelvo.",
    ].filter(Boolean);
    const r = await dmCreador(
      creador.slackId,
      partes.join("\n"),
      process.env.SLACK_LEVELUP_TOKEN,
    );
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `slack: ${r.error ?? "?"}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, destino: creador.nombre });
  }

  // Sin creador: va al canal general para la community manager (Heidy).
  const webhook = process.env.SLACK_APROBADOS_WEBHOOK;
  if (!webhook) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta SLACK_APROBADOS_WEBHOOK. Creá un Incoming Webhook en Slack y agregá la URL al entorno.",
      },
      { status: 503 },
    );
  }

  const partes = [
    ":white_check_mark: *LISTO PARA PUBLICAR*",
    ficha,
    e.titulo ? `\n*${e.titulo}*` : "",
    e.contenido ? `\n${e.contenido}` : "",
  ].filter(Boolean);

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: partes.join("\n") }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `slack ${res.status}` },
        { status: 502 },
      );
    }
    // Copia para Elvin (visibilidad), sin bloquear.
    await dmCreador(
      CEO_SLACK_ID,
      [
        `:eyes: *Aprobaste — al canal de Heidy para publicar*  (${marca})`,
        e.titulo ? `\n*${e.titulo}*` : "",
        e.contenido ? `\n${e.contenido}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    ).catch(() => {});
    return NextResponse.json({ ok: true, destino: "Heidy" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "fetch" },
      { status: 502 },
    );
  }
}

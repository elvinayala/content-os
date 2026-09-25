import { inArray } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { textoDigest, textoSemanal, type FilaAviso } from "@/lib/desempeno/avisos";
import { armarPanel, modoScore, type FilaPersona } from "@/lib/desempeno/datos";
import { fechaPR, sumarDias } from "@/lib/desempeno/reglas";
import { notificarCEO } from "@/lib/notificar-ceo";
import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";
import { secretoValido } from "@/lib/pulse/seguridad";
import { dmSlack } from "@/lib/pulse/slack-dm";
import type { UsuarioPulse } from "@/lib/pulse/types";

export const runtime = "nodejs";
export const maxDuration = 120;

// Avisos de Ritmo por Slack:
//  ?tarea=digest  (L-V 9:30 AM PR) → a Carilin (RITMO_AVISO_A; líderes solo con RITMO_AVISO_LIDERES=on): lo de AYER
//                  que hay que mirar (sin marcar, tarde, sin salida, correcciones, vencidas, bloqueos).
//  ?tarea=semanal (lunes 8 AM PR)  → a Elvin (Telegram + Slack): la semana por colores.
// En simulación hasta que Elvin dé el OK (DESEMPENO_AVISOS=real); ?dry=1 nunca manda nada.

const SISTEMA: UsuarioPulse = { id: "00000000-0000-0000-0000-000000000000", email: "ritmo@pulse.sistema", nombre: "Ritmo", rol: "admin", activo: true, color: null, tieneClave: false };

function fila(f: FilaPersona, fecha: string): FilaAviso {
  const d = f.dias.find((x) => x.fecha === fecha) ?? f.hoy;
  return {
    nombre: f.perfil.nombre,
    liderId: f.perfil.liderId,
    estado: d.asistencia.estado,
    minutosTarde: d.asistencia.minutosTarde,
    sinSalida: d.asistencia.sinSalida,
    correccionPendiente: d.asistencia.correccionPendiente,
    vencidas: f.produccion?.vencidas ?? 0,
    bloqueos: d.reporte?.bloqueos ?? null,
    score: d.score.score,
    scoreSemana: f.scoreSemana,
  };
}

export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const tarea = req.nextUrl.searchParams.get("tarea") ?? "digest";
  const real = process.env.DESEMPENO_AVISOS === "real" && req.nextUrl.searchParams.get("dry") !== "1";
  const base = process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app";
  const url = `${base}/ritmo/equipo`;
  const hoy = fechaPR(Date.now());

  if (tarea === "semanal") {
    const hasta = sumarDias(hoy, -1);
    const panel = await armarPanel(SISTEMA, sumarDias(hasta, -6), hasta);
    const texto = textoSemanal({ filas: panel.filas.map((f) => fila(f, hasta)), url, calibrando: modoScore("miembro") !== "visible" });
    if (real) await notificarCEO(texto);
    return NextResponse.json({ ok: true, real, tarea, envios: [{ para: "Elvin", texto }] });
  }

  const ayer = sumarDias(hoy, -1);
  const panel = await armarPanel(SISTEMA, sumarDias(ayer, -6), ayer);
  const filas = panel.filas.map((f) => fila(f, ayer));
  const envios: { para: string; email: string; texto: string; enviado?: boolean }[] = [];
  const todos = (process.env.RITMO_AVISO_A ?? "carilin@levelupmediapr.net").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  for (const email of todos) {
    const texto = textoDigest({ fecha: ayer, filas, url, para: "todo el equipo" });
    if (texto) envios.push({ para: email, email, texto });
  }
  // Por defecto solo la vista maestra recibe el digest (Elvin: solo Carilin, Aure y él ven el equipo).
  const lideres = process.env.RITMO_AVISO_LIDERES === "on" ? [...new Set(filas.map((f) => f.liderId).filter((x): x is string => !!x))] : [];
  if (lideres.length) {
    const d = await db();
    const users = await d.select({ id: pulseUsers.id, email: pulseUsers.email, nombre: pulseUsers.nombre }).from(pulseUsers).where(inArray(pulseUsers.id, lideres));
    for (const l of users) {
      if (todos.includes(l.email.toLowerCase())) continue; // ya recibe el de todo el equipo
      const texto = textoDigest({ fecha: ayer, filas: filas.filter((f) => f.liderId === l.id), url, para: `tu equipo, ${l.nombre.split(" ")[0]}` });
      if (texto) envios.push({ para: l.nombre, email: l.email, texto });
    }
  }
  if (real) for (const e of envios) e.enviado = await dmSlack(e.email, e.texto);
  return NextResponse.json({ ok: true, real, tarea: "digest", fecha: ayer, envios });
}

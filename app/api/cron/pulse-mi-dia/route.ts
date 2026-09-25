import { NextResponse, type NextRequest } from "next/server";

import { cuando, type Pendiente, type TipoPendiente } from "@/lib/pulse/mi-dia";
import { pendientesDe, todosLosTableros } from "@/lib/pulse/mi-dia-datos";
import { secretoValido } from "@/lib/pulse/seguridad";
import { dmSlack } from "@/lib/pulse/slack-dm";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel Cron (lun–vie 8 AM PR): le manda a Jessica y a Carilin por Slack lo que les toca hoy
// en Pulse (lo mismo que /pulse/mi-dia). Solo si hay algo. `?prueba=1` → solo a Elvin.
const BASE = process.env.PULSE_URL ?? "https://pulse-eamarket.vercel.app";
const TITULO: Record<TipoPendiente, string> = {
  nuevo: "🆕 Clientes nuevos",
  onboarding: "⏳ Onboardings detenidos (+48 h)",
  seguimiento: "📞 Seguimientos de 10 días",
  reporte: "📊 Reportes por enviar",
};

function armar(pendientes: Pendiente[], hoy: string): string {
  const fecha = new Date(`${hoy}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });
  const lineas = [`☀️ *Pulse · Mi día* — ${fecha}`];
  for (const tipo of Object.keys(TITULO) as TipoPendiente[]) {
    const xs = pendientes.filter((p) => p.tipo === tipo);
    if (!xs.length) continue;
    const muestra = xs.slice(0, 5).map((p) => `<${BASE}/pulse/${p.boardSlug}?item=${p.itemId}|${p.nombre}>${tipo === "onboarding" ? ` (${p.dias} d)` : tipo === "nuevo" ? "" : ` (${cuando(p.dias)})`}`);
    lineas.push(`${TITULO[tipo]}: *${xs.length}*\n   ${muestra.join(" · ")}${xs.length > 5 ? ` y ${xs.length - 5} más` : ""}`);
  }
  lineas.push(`👉 <${BASE}/pulse/mi-dia|Abrir Mi día> y marca lo que vayas resolviendo.`);
  return lineas.join("\n");
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && !secretoValido(auth, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const { pendientes, hoy } = await pendientesDe(await todosLosTableros());
  if (!pendientes.length) return NextResponse.json({ ok: true, enviados: 0, motivo: "sin pendientes" });
  const texto = armar(pendientes, hoy);
  const prueba = req.nextUrl.searchParams.get("prueba") === "1";
  const destinos = prueba
    ? [process.env.PULSE_ADMIN_EMAIL ?? "elvin@levelupmediapr.net"]
    : (process.env.PULSE_MI_DIA_DESTINOS ?? "jessica@levelupmediapr.net,carilin@levelupmediapr.net").split(",").map((s) => s.trim()).filter(Boolean);
  const res: Record<string, boolean> = {};
  for (const email of destinos) res[email] = await dmSlack(email, texto);
  return NextResponse.json({ ok: true, pendientes: pendientes.length, enviados: res });
}

import { NextResponse, type NextRequest } from "next/server";

import { notificarCEO } from "@/lib/notificar-ceo";
import { registrarEvento, secretoValido } from "@/lib/pulse/seguridad";
import { respaldarTodo } from "@/lib/respaldo/respaldo";

export const runtime = "nodejs";
export const maxDuration = 300;
// Vercel Cron diario: respaldo cifrado de TODA la base + archivos en Supabase y Vercel Blob,
// verificado (se abre la copia y se cuentan las filas). Detalle en lib/respaldo/respaldo.ts.
// Si algo falla, avisa a Elvin por Telegram + Slack.

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && !secretoValido(auth, `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  try {
    const r = await respaldarTodo();
    if (!r.ok) {
      const malos = [...r.destinos.filter((d) => !d.ok).map((d) => `${d.nombre}: ${d.detalle}`), ...(r.verificado.ok ? [] : [`verificación: ${r.verificado.detalle}`]), ...(r.archivos.error ? [`archivos: ${r.archivos.error}`] : [])];
      await registrarEvento({ tipo: "respaldo_fallido", detalle: malos.join(" · ").slice(0, 500) });
      await notificarCEO(`⚠️ El respaldo diario de la base tuvo problemas:\n${malos.map((m) => `• ${m}`).join("\n")}\nLos demás destinos sí se guardaron. — Nico`);
    }
    return NextResponse.json(r, { status: r.ok ? 200 : 500 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await registrarEvento({ tipo: "respaldo_fallido", detalle: msg.slice(0, 500) }).catch(() => {});
    await notificarCEO(`🚨 El respaldo diario de la base NO se hizo: ${msg.slice(0, 200)} — Nico`).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

import { type NextRequest, NextResponse } from "next/server";

import { correrBoardMeeting } from "@/lib/board-meeting";

export const runtime = "nodejs";
export const maxDuration = 300;
// Vercel Cron: board meeting diario a las 5 AM PR (9:00 UTC). 100% nube — junta las
// fuentes en vivo, sintetiza el plan del día con la Anthropic API y lo publica en
// el DM de Elvin. No depende de la compu ni de la app de Claude.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const r = await correrBoardMeeting();
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}

import Link from "next/link";
import { Crown, Hexagon } from "lucide-react";

import { listarEncargos } from "@/lib/encargos";
import { listarSkills } from "@/lib/jarvis/skills";
import {
  frescura,
  leerAgendaSnapshot,
  leerDebriefReal,
  leerInsightsIG,
  leerOps,
} from "@/lib/ops";
import { resumen } from "@/lib/mock/metricas";

import { HudMetrics } from "@/components/hud/hud-metrics";
import { HudSkills } from "@/components/hud/hud-skills";
import { JarvisChat } from "@/components/hud/jarvis-chat";
import { JarvisVideo } from "@/components/hud/jarvis-video";
import { leerOnboardings } from "@/lib/onboardings";

// El HUD: métricas (izq) + Jarvis (centro) + skills (der). Una sola pantalla.
export const dynamic = "force-dynamic";

export default async function HudPage() {
  const [skills, ops, debrief, agenda, ig, pendientes, onb] = await Promise.all([
    listarSkills(),
    leerOps("level-up"),
    leerDebriefReal(),
    leerAgendaSnapshot(),
    leerInsightsIG(),
    listarEncargos("pendiente"),
    leerOnboardings().catch(() => ({ onboardings: [] })),
  ]);

  // Clientes nuevos de ayer/hoy → el pulso arranca felicitando.
  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
  const clientesNuevos = (onb.onboardings ?? [])
    .filter((o) => (o.ganadoEl ?? "").slice(0, 10) >= desde)
    .map((o) => ({ cliente: o.cliente, unidad: o.unidad }));

  const metricas = resumen.map(({ series: _s, ...m }) => m);
  const fuentes = [
    { nombre: "Slack", frescura: frescura(ops?.actualizadoEl) },
    { nombre: "Brief", frescura: frescura(debrief?.actualizadoEl) },
    { nombre: "Calendar", frescura: frescura(agenda?.actualizadoEl) },
    { nombre: "IG Shadow", frescura: frescura(ig?.actualizadoEl) },
  ];

  return (
    <>
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <Hexagon className="size-5 text-primary" />
          <span className="font-semibold tracking-tight">CEO Command Center</span>
          <span className="label-mono text-muted-foreground">
            Jarvis HUD · Métricas · Skills · Vault
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <Link
            href="/ceo"
            className="label-mono inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <Crown className="size-3.5" /> Command Center
          </Link>
          <Link
            href="/ceo/vault"
            className="label-mono text-muted-foreground transition-colors hover:text-primary"
          >
            Vault
          </Link>
        </nav>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[300px_1fr_300px]">
        <aside className="glow order-2 min-h-0 rounded-xl border border-border bg-card/40 p-4 lg:order-none">
          <HudMetrics
            metricas={metricas}
            wins={ops?.wins ?? []}
            criticos={ops?.criticos ?? []}
            fuentes={fuentes}
            clientesNuevos={clientesNuevos}
          />
        </aside>

        <section className="glow order-first min-h-0 rounded-xl border border-primary/25 bg-card/40 p-4 lg:order-none">
          <JarvisChat habilitado={!!process.env.ANTHROPIC_API_KEY} />
        </section>

        <aside className="glow order-3 min-h-0 rounded-xl border border-border bg-card/40 p-4 lg:order-none">
          <HudSkills skills={skills} encargosPendientes={pendientes.length} />
        </aside>
      </main>

      {/* Overlay de video (cuando Jarvis usa reproducir_video) */}
      <JarvisVideo />
    </>
  );
}

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { CopiarLink } from "@/components/borinquen/portal/controles";
import { CrearPortalBoton } from "@/components/borinquen/portal/closer-controles";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { urlPortal } from "@/lib/portal/acceso";
import { listarPortales, resumenPortales } from "@/lib/portal/repo";
import { listarDemos } from "@/lib/portal/sembrar";

export const metadata = { title: "Portales · Bori" };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeZone: "America/Puerto_Rico" });

// Vista del closer: todos los portales (uno por prospecto/cliente), su link público y los
// demos de la fábrica que todavía no tienen portal.
export default async function PortalesPage() {
  const [portales, resumen] = await Promise.all([listarPortales(), resumenPortales()]);
  const conSlug = new Set(portales.map((p) => p.slug));
  const demosSinPortal = listarDemos().filter((d) => !conSlug.has(d.slug));
  const links = await Promise.all(portales.map((p) => urlPortal(p.slug)));
  const haySecreto = Boolean(process.env.AUTOFLOW_PORTAL_SECRET);

  return (
    <>
      <PageHeader titulo="Portales" descripcion="El portal de cada prospecto o cliente: agentes, llamadas, CRM y solicitudes.">
        <Badge variant="outline" className="label-mono">
          {portales.length} {portales.length === 1 ? "portal" : "portales"}
        </Badge>
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {!haySecreto ? (
          <Card className="border-[var(--status-waiting)]/40 bg-gradient-to-b from-card to-background/40">
            <CardContent className="p-4 text-sm text-muted-foreground">
              Falta <code className="font-mono">AUTOFLOW_PORTAL_SECRET</code> en el ambiente: sin él no se pueden generar los links del
              prospecto. Genera uno con <code className="font-mono">openssl rand -hex 32</code> y ponlo en .env.local y en Vercel.
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-3">
          <h2 className="label-mono text-muted-foreground">Portales</h2>
          {portales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay portales. Crea uno desde un demo de la fábrica (abajo).</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {portales.map((p, i) => {
                const r = resumen[p.id] ?? { llamadas: 0, leadsReales: 0, solicitudes: 0 };
                return (
                  <Card key={p.id} className="bg-gradient-to-b from-card to-background/40">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold leading-tight">{p.negocio}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.asistente} · {p.nicho ?? "—"} · {fmt.format(new Date(p.actualizadoEl))}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className={"label-mono " + (p.modo === "produccion" ? "text-[var(--status-working)]" : "")}>
                            {p.modo === "produccion" ? "Producción" : "Demo"}
                          </Badge>
                          {!p.activo ? (
                            <Badge variant="outline" className="label-mono text-muted-foreground">
                              inactivo
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 font-mono text-xs text-muted-foreground">
                        <span>{r.llamadas} llamadas</span>
                        <span>{r.leadsReales} leads reales</span>
                        <span>{r.solicitudes} solicitudes abiertas</span>
                        <span>{p.agentIdVoz ? "voz real" : "sin voz"}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button asChild size="sm">
                          <Link href={`/borinquen/portales/${p.slug}`}>Abrir</Link>
                        </Button>
                        {links[i] ? <CopiarLink url={links[i]!} etiqueta="Copiar link" /> : null}
                        {links[i] ? (
                          <Button asChild size="sm" variant="ghost">
                            <a href={links[i]!} target="_blank" rel="noreferrer">
                              <ExternalLink className="size-4" /> Ver como cliente
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="label-mono text-muted-foreground">Demos de la fábrica sin portal</h2>
          {demosSinPortal.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todos los demos de <code className="font-mono">data/demos/</code> ya tienen portal. Los nuevos se registran solos con{" "}
              <code className="font-mono">demo.mjs todo</code> (o <code className="font-mono">demo.mjs portal &lt;slug&gt;</code>).
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {demosSinPortal.map((d) => (
                <Card key={d.slug} className="bg-gradient-to-b from-card to-background/40">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium leading-tight">{d.negocio ?? d.slug}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.slug} · {d.estado ?? "—"} · {d.agentId ? "voz real" : "sin voz"}
                      </p>
                    </div>
                    <CrearPortalBoton slug={d.slug} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

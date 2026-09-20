import { Check, X } from "lucide-react";

import { estadoProveedores } from "@/lib/voz";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Conexiones · Bori" };
export const dynamic = "force-dynamic";

// Chequeo de env (server-only): solo mira si la variable existe, nunca el valor.
function tiene(v?: string): boolean {
  return !!v && v.trim().length > 0;
}

export default async function ConexionesPage() {
  const proveedores = estadoProveedores();

  const claves: { env: string; para: string; ok: boolean }[] = [
    { env: "RETELL_API_KEY", para: "Crear agentes de voz en Retell", ok: tiene(process.env.RETELL_API_KEY) },
    { env: "VAPI_API_KEY", para: "Agentes de voz en Vapi", ok: tiene(process.env.VAPI_API_KEY) },
    { env: "ELEVENLABS_API_KEY", para: "Voces TTS (español PR)", ok: tiene(process.env.ELEVENLABS_API_KEY) },
    { env: "DEEPGRAM_API_KEY", para: "Reconocimiento de voz (STT)", ok: tiene(process.env.DEEPGRAM_API_KEY) },
    { env: "ANTHROPIC_API_KEY", para: "Bori (el copiloto)", ok: tiene(process.env.ANTHROPIC_API_KEY) },
    { env: "TELEGRAM_BOT_TOKEN", para: "Asistente por Telegram", ok: tiene(process.env.TELEGRAM_BOT_TOKEN) },
    { env: "PIPEDRIVE_AIB_TOKEN", para: "CRM de leads (en vivo)", ok: tiene(process.env.PIPEDRIVE_AIB_TOKEN) },
  ];

  return (
    <>
      <PageHeader
        titulo="Conexiones"
        descripcion="Proveedores de voz, números y API keys. Sin key, cada módulo cae a demo."
      />

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        {/* Proveedores de voz */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            Proveedores de voz
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {proveedores.map((p) => (
              <Card
                key={p.proveedor}
                className="bg-gradient-to-b from-card to-background/40"
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold capitalize">{p.proveedor}</h3>
                    <Badge
                      variant="outline"
                      className="label-mono"
                      style={{
                        color: p.disponible
                          ? "var(--status-working)"
                          : "var(--muted-foreground)",
                      }}
                    >
                      {p.disponible ? "Conectado" : "Local (demo)"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{p.nota}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* API keys */}
        <section>
          <h2 className="label-mono mb-3 text-muted-foreground">
            API keys (.env.local)
          </h2>
          <Card className="bg-gradient-to-b from-card to-background/40">
            <CardContent className="p-2">
              <ul>
                {claves.map((c) => (
                  <li
                    key={c.env}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40"
                  >
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full"
                      style={{
                        backgroundColor: c.ok
                          ? "color-mix(in oklch, var(--status-working) 20%, transparent)"
                          : "color-mix(in oklch, var(--muted-foreground) 18%, transparent)",
                      }}
                    >
                      {c.ok ? (
                        <Check className="size-3.5 text-[var(--status-working)]" />
                      ) : (
                        <X className="size-3.5 text-muted-foreground" />
                      )}
                    </span>
                    <code className="font-mono text-sm">{c.env}</code>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {c.para}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Las keys van a{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono">.env.local</code>{" "}
            (nunca al repo). Reiniciá el server para tomarlas.
          </p>
        </section>
      </main>
    </>
  );
}

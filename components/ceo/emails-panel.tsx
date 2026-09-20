import { Mail, TriangleAlert, DollarSign, ShoppingCart, User, Wrench, Circle } from "lucide-react";

import type { CategoriaEmail, EmailsSnapshot } from "@/lib/types";
import { fmtFecha } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ICONO: Record<CategoriaEmail, typeof Mail> = {
  urgente: TriangleAlert,
  finanzas: DollarSign,
  venta: ShoppingCart,
  cliente: User,
  operativo: Wrench,
  personal: Circle,
  otro: Mail,
};

const COLOR: Record<CategoriaEmail, string> = {
  urgente: "var(--status-waiting)",
  venta: "var(--status-working)",
  finanzas: "var(--primary)",
  cliente: "var(--primary)",
  operativo: "var(--muted-foreground)",
  personal: "var(--muted-foreground)",
  otro: "var(--muted-foreground)",
};

// Bandeja del CEO: lo importante de las 3 cuentas de correo, resumido por el
// orquestador (/brief-ceo lee Gmail y escribe data/emails.json).
export function EmailsPanel({ snap }: { snap: EmailsSnapshot }) {
  if (snap.emails.length === 0) return null;

  return (
    <section>
      <h2 className="label-mono mb-3 flex items-center gap-2 text-muted-foreground">
        <Mail className="size-3.5" />
        Bandeja · lo importante de tus correos
      </h2>
      <Card className="bg-gradient-to-b from-card to-background/60">
        <CardHeader className="pb-2">
          {snap.resumen ? (
            <CardTitle className="text-sm font-medium leading-snug text-foreground/90">
              {snap.resumen}
            </CardTitle>
          ) : null}
          <p className="label-mono text-muted-foreground">
            {snap.cuentas.join(" · ")}
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {snap.emails.map((e) => {
            const Icono = ICONO[e.categoria] ?? Mail;
            return (
              <div key={e.id} className="flex gap-3 px-4 py-3">
                <div
                  className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${COLOR[e.categoria]} 15%, transparent)`,
                    color: COLOR[e.categoria],
                  }}
                >
                  <Icono className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold">{e.asunto}</span>
                    {e.noLeido ? (
                      <span
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: "var(--primary)" }}
                        title="no leído"
                      />
                    ) : null}
                    <Badge variant="outline" className="label-mono">
                      {e.categoria}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {e.de} · {fmtFecha(e.fecha.slice(0, 10))}
                  </p>
                  <p className="mt-0.5 text-sm text-foreground/80">{e.resumen}</p>
                  {e.accion ? (
                    <p className="mt-0.5 text-xs">
                      <span className="label-mono text-[var(--status-waiting)]">
                        Acción ·{" "}
                      </span>
                      <span className="text-foreground/80">{e.accion}</span>
                    </p>
                  ) : null}
                </div>
                <span className="label-mono shrink-0 text-muted-foreground">
                  {e.cuenta.split("@")[0]}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}

import { ShieldCheck } from "lucide-react";
import { inArray } from "drizzle-orm";

import { BandejaEtica, FormEtico } from "@/components/ritmo/etica";
import { CATEGORIAS_ETICA, listarReportesEticos } from "@/lib/desempeno/etica";
import { usuarioRitmo } from "@/lib/desempeno/sesion";
import { db } from "@/lib/pulse/db";
import { pulseUsers } from "@/lib/pulse/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Canal ético" };

// Canal ético: cualquiera reporta (con nombre o anónimo); SOLO Elvin (admin) ve la bandeja.
export default async function EticaPage() {
  const u = await usuarioRitmo();
  if (!u) return null;
  const esElvin = u.rol === "admin";
  let bandeja = null;
  if (esElvin) {
    const reportes = await listarReportesEticos();
    const ids = [...new Set(reportes.map((r) => r.userId).filter((x): x is string => !!x))];
    const d = await db();
    const nombres = ids.length ? await d.select({ id: pulseUsers.id, nombre: pulseUsers.nombre }).from(pulseUsers).where(inArray(pulseUsers.id, ids)) : [];
    bandeja = reportes.map((r) => ({
      id: r.id,
      categoria: CATEGORIAS_ETICA.find((c) => c.id === r.categoria)?.nombre ?? r.categoria,
      descripcion: r.descripcion,
      involucrados: r.involucrados,
      autor: r.userId ? (nombres.find((n) => n.id === r.userId)?.nombre ?? "—") : null,
      estado: r.estado,
      notaInterna: r.notaInterna,
      fecha: r.createdAt.toLocaleDateString("es-PR", { timeZone: "America/Puerto_Rico", day: "numeric", month: "short", year: "numeric" }),
    }));
  }
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 size-7 shrink-0 text-[color:var(--coral)]" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Canal ético</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Si viste algo que no está bien (acoso, fraude, maltrato a un cliente, mal uso de información…), dilo aquí. Lo lee solamente Elvin, y puedes enviarlo de forma anónima.
          </p>
        </div>
      </div>
      {bandeja ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Bandeja (solo tú la ves)</h2>
          <BandejaEtica reportes={bandeja} />
        </section>
      ) : null}
      <FormEtico categorias={CATEGORIAS_ETICA.map((c) => ({ id: c.id, nombre: c.nombre }))} />
    </div>
  );
}

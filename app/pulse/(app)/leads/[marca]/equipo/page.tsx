import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { EquipoLeads } from "@/components/leads/equipo";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { equipoLeads, manejaEquipo } from "@/lib/leads/equipo-datos";
import { MARCAS } from "@/lib/leads/reglas";
import { usuarioActual } from "@/lib/pulse/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads · Equipo · Pulse" };

// Quién entra a Leads de la marca. Lo maneja el director de ventas (Nahuel en Level Up), las editoras y Elvin.
export default async function EquipoLeadsPage({ params }: { params: Promise<{ marca: string }> }) {
  const u = await usuarioActual();
  if (!u) redirect("/pulse/login");
  const { marca } = await params;
  const m = MARCAS[marca];
  if (!m) notFound();
  if (!(await manejaEquipo(u, m.marca))) redirect(`/pulse/leads/${m.slug}`);
  const { conAcceso, candidatos } = await equipoLeads(m.marca);
  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <Link href={`/pulse/leads/${m.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
          Leads · {m.nombre}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <h1 className="text-sm font-medium">Equipo</h1>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
        <div>
          <p className="ceja-pulse">Equipo de ventas</p>
          <h2 className="mt-2 text-2xl font-semibold">Quién entra a Leads de {m.nombre}</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            Dale acceso a tus closers, setters y chatters. «Todos los leads» ve y trabaja toda la marca; «Solo sus leads» ve únicamente donde es el dueño. Cada cambio queda registrado y Elvin recibe el aviso.
          </p>
        </div>
        <EquipoLeads marca={m.marca} yoId={u.id} conAcceso={conAcceso} candidatos={candidatos} />
      </main>
    </div>
  );
}

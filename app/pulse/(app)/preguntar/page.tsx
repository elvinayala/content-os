import { Preguntar } from "@/components/pulse/preguntar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NOMBRE_APP } from "@/lib/pulse/types";

export const dynamic = "force-dynamic";
// El agente puede hacer varias búsquedas antes de responder.
export const maxDuration = 60;
export const metadata = { title: `Preguntarle al CRM · ${NOMBRE_APP}` };

export default async function PreguntarPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="fondo-malla min-h-svh">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <span className="text-sm font-medium">Preguntarle al CRM</span>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <Preguntar inicial={q?.slice(0, 500) ?? ""} />
      </main>
    </div>
  );
}

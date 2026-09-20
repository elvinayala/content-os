import { agentesEjecutivos } from "@/lib/ceo";
import { leerTareas } from "@/lib/tareas";
import { PageHeader } from "@/components/page-header";
import { TasksTable } from "@/components/ceo/tasks-table";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Tasks · CEO Command Center" };
// Los compromisos reales los escribe /brief-ceo desde Granola + Slack.
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { tareas } = await leerTareas();
  const nombresAgentes = Object.fromEntries(
    agentesEjecutivos.map((a) => [a.id, a.nombre]),
  );
  const abiertas = tareas.filter((t) => t.estado !== "hecha").length;
  const esperanCEO = tareas.filter(
    (t) => t.requiereCEO && t.estado !== "hecha",
  ).length;

  return (
    <>
      <PageHeader
        titulo="Tasks"
        descripcion="Tus compromisos: lo que quedaste en hacer (dailies, reuniones, Slack) + lo que te asigna el orquestador."
      >
        <Badge variant="outline" className="label-mono">
          {abiertas} abiertas
        </Badge>
        <Badge className="label-mono">{esperanCEO} esperan tu OK</Badge>
      </PageHeader>

      <main className="flex-1 p-4 sm:p-6">
        <TasksTable tareas={tareas} nombresAgentes={nombresAgentes} />
      </main>
    </>
  );
}

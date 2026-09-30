import { FileText, Film, Image as ImageIcon, File as FileIcon } from "lucide-react";

import { BotonSlack } from "@/components/cliente/piezas";
import { SubirArchivos } from "@/components/cliente/subir";
import { driveListo, listarArchivos } from "@/lib/clientes-app/archivos";
import { agrupar, tamano, tipoDe, type ArchivoDrive } from "@/lib/clientes-app/archivos-reglas";
import { fichaCliente } from "@/lib/clientes-app/datos";
import { visorActual } from "@/lib/clientes-app/sesion";

export const metadata = { title: "Archivos" };

const ICONO = { imagen: ImageIcon, video: Film, pdf: FileText, documento: FileText, otro: FileIcon };

export default async function ArchivosPage() {
  const v = await visorActual();
  if (!v) return null;
  const f = await fichaCliente(v.itemId);
  if (!f) return null;
  let grupos: ReturnType<typeof agrupar> | null = null;
  let error = false;
  if (f.carpetaId && driveListo()) {
    try {
      grupos = agrupar(await listarArchivos(f.carpetaId));
    } catch {
      error = true;
    }
  }
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="ceja">Tu carpeta</p>
        <h1 className="lu-titulo mt-1 text-2xl font-semibold">Archivos</h1>
        <p className="text-sm text-muted-foreground">Tu branding, tu estrategia, tus creativos, videos y reportes.</p>
      </header>

      {grupos && v.modo === "cliente" ? <SubirArchivos /> : null}

      {f.acuerdo ? (
        <a href="/cliente/acuerdo" target="_blank" className="panel flex items-center gap-3 p-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
            <FileText className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Acuerdo firmado</span>
            <span className="block truncate text-[11px] text-muted-foreground">{f.acuerdo.nombre}</span>
          </span>
        </a>
      ) : null}

      {grupos ? (
        grupos.length ? (
          grupos.map((g) => (
            <section key={g.carpeta} className="flex flex-col gap-2">
              <h2 className="lu-titulo text-sm font-semibold">{g.carpeta}</h2>
              <ul className="panel divide-y divide-border/60">
                {g.archivos.map((a) => (
                  <Fila key={a.id} a={a} />
                ))}
              </ul>
            </section>
          ))
        ) : (
          <p className="panel p-5 text-sm text-muted-foreground">Tu carpeta está vacía todavía. Aquí van a aparecer tu estrategia, tus creativos y tus reportes a medida que el equipo los prepare.</p>
        )
      ) : (
        <p className="panel p-5 text-sm text-muted-foreground">
          {error ? "No pudimos abrir tu carpeta ahora mismo. Intenta en un rato." : "Tus archivos van a aparecer aquí muy pronto. Mientras tanto, tu equipo te los comparte por Slack."}
        </p>
      )}
      <BotonSlack url={f.slackUrl} />
    </div>
  );
}

function Fila({ a }: { a: ArchivoDrive }) {
  const I = ICONO[tipoDe(a.mime)];
  return (
    <li>
      <a href={`/cliente/archivo/${a.id}`} target="_blank" className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
        <I className="size-5 shrink-0 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{a.nombre}</span>
          <span className="block text-[11px] text-muted-foreground">
            {new Date(a.fecha).toLocaleDateString("es-PR", { day: "numeric", month: "short", year: "numeric" })}
            {a.bytes ? ` · ${tamano(a.bytes)}` : ""}
          </span>
        </span>
      </a>
    </li>
  );
}

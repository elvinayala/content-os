"use client";

import { ExternalLink, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { borrarEmpresaAction, guardarEmpresaAction } from "@/app/ritmo/actions";
import { AvatarRitmo } from "@/components/ritmo/avatar";
import { EmpresaBadge } from "@/components/ritmo/piezas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bloques, NOMBRE_EMPRESA, type EmpresaDe, type ItemEmpresa, type Trozo } from "@/lib/desempeno/empresa-reglas";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };

function Trozos({ ts }: { ts: Trozo[] }) {
  return (
    <>
      {ts.map((t, i) =>
        t.t === "negrita" ? (
          <b key={i} className="font-semibold text-foreground">
            {t.v}
          </b>
        ) : t.t === "link" ? (
          <a key={i} href={t.url} target={t.url.startsWith("/") ? undefined : "_blank"} rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
            {t.v}
          </a>
        ) : (
          <span key={i}>{t.v}</span>
        ),
      )}
    </>
  );
}

/** Texto con formato sencillo (párrafos, viñetas, **negrita**, [link](url)). Sin HTML. */
export function TextoEmpresa({ cuerpo }: { cuerpo: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/85">
      {bloques(cuerpo).map((b, i) =>
        b.t === "p" ? (
          <p key={i}>
            <Trozos ts={b.trozos} />
          </p>
        ) : (
          <ul key={i} className="flex flex-col gap-1.5 pl-1">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                <span>
                  <Trozos ts={it} />
                </span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

export function TarjetaEmpresa({ it, maestro }: { it: ItemEmpresa; maestro: boolean }) {
  const [editar, setEditar] = useState(false);
  const borrar = async () => {
    if (!confirm(`¿Borrar “${it.titulo}”?`)) return;
    const r = await borrarEmpresaAction(it.id);
    if (!r.ok) toast.error(r.error, aviso);
  };
  return (
    <article className={cn("panel flex flex-col gap-3 p-5", !it.publicado && "border-dashed opacity-80")}>
      <div className="flex items-start gap-2">
        <h3 className="flex-1 text-base font-semibold tracking-tight">{it.titulo}</h3>
        {maestro ? (
          <div className="flex shrink-0 items-center gap-1">
            {!it.publicado ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-400/25">
                <EyeOff className="size-3" /> Borrador
              </span>
            ) : null}
            {it.empresa !== "todas" ? <EmpresaBadge empresa={it.empresa} siempre /> : null}
            <button type="button" onClick={() => setEditar(true)} title="Editar" className="cursor-pointer rounded-full p-1.5 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground">
              <Pencil className="size-3.5" />
            </button>
            <button type="button" onClick={borrar} title="Borrar" className="cursor-pointer rounded-full p-1.5 text-muted-foreground hover:text-red-300">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      {it.cuerpo ? <TextoEmpresa cuerpo={it.cuerpo} /> : null}
      {it.url ? (
        it.url.startsWith("/") ? (
          <Link href={it.url} className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/25 hover:bg-primary/15">
            Abrir →
          </Link>
        ) : (
          <a href={it.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/25 hover:bg-primary/15">
            Abrir <ExternalLink className="size-3" />
          </a>
        )
      ) : null}
      {editar ? <EditorEmpresa inicial={it} seccion={it.seccion} onCerrar={() => setEditar(false)} /> : null}
    </article>
  );
}

export function NuevoItemEmpresa({ seccion }: { seccion: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Button className="h-9 rounded-full" onClick={() => setAbierto(true)}>
        <Plus className="size-4" /> Agregar
      </Button>
      {abierto ? <EditorEmpresa seccion={seccion} onCerrar={() => setAbierto(false)} /> : null}
    </>
  );
}

function EditorEmpresa({ inicial, seccion, onCerrar }: { inicial?: ItemEmpresa; seccion: string; onCerrar: () => void }) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [cuerpo, setCuerpo] = useState(inicial?.cuerpo ?? "");
  const [url, setUrl] = useState(inicial?.url ?? "");
  const [empresa, setEmpresa] = useState<EmpresaDe>((inicial?.empresa as EmpresaDe) ?? "todas");
  const [publicado, setPublicado] = useState(inicial?.publicado ?? true);
  const [guardando, setGuardando] = useState(false);
  const guardar = async () => {
    setGuardando(true);
    const r = await guardarEmpresaAction({ id: inicial?.id, seccion, titulo, cuerpo, url: url || null, empresa, publicado });
    setGuardando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    toast.success(publicado ? "Guardado y publicado" : "Guardado como borrador", aviso);
    onCerrar();
  };
  return (
    <Dialog open onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="ritmo max-w-lg">
        <DialogHeader>
          <DialogTitle>{inicial ? "Editar" : "Agregar"}</DialogTitle>
          <DialogDescription>
            Formato: una línea por párrafo, <b>- </b> para viñetas, <b>**negrita**</b> y <b>[texto](https://…)</b> para links.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Título</Label>
            <Input value={titulo} maxLength={120} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Texto</Label>
            <Textarea rows={8} value={cuerpo} maxLength={4000} onChange={(e) => setCuerpo(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Link (opcional)</Label>
            <Input value={url} placeholder="https://… o /ritmo/…" onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              Lo ven
              <select value={empresa} onChange={(e) => setEmpresa(e.target.value as EmpresaDe)} className="h-9 rounded-md border border-border bg-transparent px-2 text-sm">
                {(Object.keys(NOMBRE_EMPRESA) as EmpresaDe[]).map((k) => (
                  <option key={k} value={k}>
                    {NOMBRE_EMPRESA[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={publicado} onChange={(e) => setPublicado(e.target.checked)} className="size-4 accent-[color:var(--neon)]" />
              Publicado (si no, solo lo ve la dirección)
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={guardando || titulo.trim().length < 2}>
            {guardando ? <Loader2 className="animate-spin" /> : null} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Persona = { id: string; nombre: string; puesto: string; departamento: string; lider: string | null; empresa: string };

export function Directorio({ personas, maestro, yo }: { personas: Persona[]; maestro: boolean; yo: string }) {
  const [q, setQ] = useState("");
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const lista = q ? personas.filter((p) => norm(`${p.nombre} ${p.puesto} ${p.departamento}`).includes(norm(q))) : personas;
  const deps = [...new Set(lista.map((p) => p.departamento))];
  return (
    <div className="flex flex-col gap-4">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, puesto o departamento…" className="h-10 max-w-sm rounded-full" />
      {deps.map((dep) => (
        <section key={dep} className="flex flex-col gap-2">
          <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">{dep}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {lista
              .filter((p) => p.departamento === dep)
              .map((p) => (
                <div key={p.id} className={cn("panel flex items-center gap-3 p-3", p.id === yo && "ring-1 ring-primary/30")}>
                  <AvatarRitmo userId={p.id} nombre={p.nombre} foto={null} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.nombre}
                      {p.id === yo ? <span className="text-muted-foreground"> (tú)</span> : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{p.puesto}</p>
                    {p.lider ? <p className="truncate text-[11px] text-muted-foreground/80">Supervisor: {p.lider}</p> : null}
                  </div>
                  {maestro ? <EmpresaBadge empresa={p.empresa} /> : null}
                </div>
              ))}
          </div>
        </section>
      ))}
      {!lista.length ? <div className="panel p-6 text-center text-sm text-muted-foreground">No hay nadie con ese nombre.</div> : null}
    </div>
  );
}

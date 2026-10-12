"use client";

import { Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { borrarEntregaAction, confirmarEntregasAction, prepararEntregaAction, subirEntregaLocalAction } from "@/app/cliente/actions";
import type { TipoEntrega } from "@/lib/clientes-app/entregas-reglas";

const aviso = { className: "lu-app" };

// Solo el equipo (en "Ver como el cliente"): subir el plan, los creativos aprobados o los videos del cliente.
export function SubirEntregas({ tipo, texto, acepta }: { tipo: TipoEntrega; texto: string; acepta: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const router = useRouter();
  const subir = async (lista: FileList | null) => {
    if (!lista?.length) return;
    const listos: { ruta: string; nombre: string; mime: string }[] = [];
    for (const [i, file] of [...lista].entries()) {
      setEstado(`Subiendo ${i + 1} de ${lista.length}…`);
      const prep = await prepararEntregaAction({ tipo, nombre: file.name, mime: file.type, bytes: file.size });
      if (!prep.ok) {
        toast.error(`${file.name}: ${prep.error}`, aviso);
        continue;
      }
      if (prep.signedUrl) {
        const r = await fetch(prep.signedUrl, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream", "x-upsert": "true" } }).catch(() => null);
        if (!r?.ok) {
          toast.error(`${file.name}: no se pudo subir, revisa la conexión`, aviso);
          continue;
        }
      } else {
        const fd = new FormData();
        fd.set("archivo", file);
        const r = await subirEntregaLocalAction(prep.ruta, fd);
        if (!r.ok) {
          toast.error(`${file.name}: ${r.error}`, aviso);
          continue;
        }
      }
      listos.push({ ruta: prep.ruta, nombre: file.name, mime: file.type });
    }
    if (listos.length) {
      setEstado("Guardando…");
      const c = await confirmarEntregasAction({ tipo, archivos: listos });
      if (c.ok) toast.success(c.n === 1 ? "Listo: el cliente ya lo ve" : `Listo: el cliente ya ve ${c.n} archivos`, aviso);
      else toast.error(c.error, aviso);
      router.refresh();
    }
    setEstado(null);
    if (input.current) input.current.value = "";
  };
  return (
    <>
      <input ref={input} type="file" accept={acepta} multiple={tipo !== "plan"} className="hidden" onChange={(e) => subir(e.target.files)} />
      <button onClick={() => input.current?.click()} disabled={!!estado} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-3.5 text-xs font-semibold text-primary disabled:opacity-60">
        {estado ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} {estado ?? texto}
      </button>
    </>
  );
}

export function QuitarEntrega({ id, nombre }: { id: string; nombre: string }) {
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();
  return (
    <button
      title="Quitar de la app del cliente"
      disabled={ocupado}
      onClick={async () => {
        if (!confirm(`¿Quitar «${nombre}» de la app del cliente?`)) return;
        setOcupado(true);
        const r = await borrarEntregaAction(id);
        setOcupado(false);
        if (!r.ok) return toast.error(r.error, aviso);
        router.refresh();
      }}
      className="grid size-7 shrink-0 place-items-center rounded-full bg-background/80 text-muted-foreground ring-1 ring-border hover:text-destructive"
    >
      {ocupado ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </button>
  );
}

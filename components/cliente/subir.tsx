"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { confirmarSubidaAction, prepararSubidaAction, subirLocalAction } from "@/app/cliente/actions";

// Subir fotos y videos para sus anuncios: van a su carpeta de Drive ("Material del cliente (app)").
export function SubirArchivos() {
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const router = useRouter();
  const subir = async (lista: FileList | null) => {
    if (!lista?.length) return;
    let ok = 0;
    for (const [i, file] of [...lista].entries()) {
      setEstado(`Subiendo ${i + 1} de ${lista.length}…`);
      const prep = await prepararSubidaAction({ nombre: file.name, mime: file.type, bytes: file.size });
      if (!prep.ok) {
        toast.error(`${file.name}: ${prep.error}`, { className: "lu-app" });
        continue;
      }
      if (prep.signedUrl) {
        const r = await fetch(prep.signedUrl, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream", "x-upsert": "true" } }).catch(() => null);
        if (!r?.ok) {
          toast.error(`${file.name}: no se pudo subir, revisa tu conexión`, { className: "lu-app" });
          continue;
        }
      } else {
        const fd = new FormData();
        fd.set("archivo", file);
        const r = await subirLocalAction(prep.ruta, fd);
        if (!r.ok) {
          toast.error(`${file.name}: ${r.error}`, { className: "lu-app" });
          continue;
        }
      }
      setEstado(`Guardando en tu carpeta ${i + 1} de ${lista.length}…`);
      const c = await confirmarSubidaAction({ ruta: prep.ruta, nombre: file.name });
      if (c.ok) ok++;
      else toast.error(`${file.name}: ${c.error}`, { className: "lu-app" });
    }
    setEstado(null);
    if (input.current) input.current.value = "";
    if (ok) {
      toast.success(ok === 1 ? "Listo: tu archivo quedó en tu carpeta" : `Listo: ${ok} archivos quedaron en tu carpeta`, { className: "lu-app" });
      router.refresh();
    }
  };
  return (
    <>
      <input ref={input} type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={(e) => subir(e.target.files)} />
      <button onClick={() => input.current?.click()} disabled={!!estado} className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-70">
        {estado ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {estado ?? "Subir fotos o videos"}
      </button>
    </>
  );
}

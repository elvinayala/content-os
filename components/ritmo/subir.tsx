"use client";

import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { confirmarSubidaAction, prepararSubidaAction, subirLocalAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const aviso = { className: "ritmo" };

/** Sube un archivo a la ficha: con Supabase va directo del navegador al almacenamiento (videos grandes). */
export async function subirArchivoFicha(userId: string, categoria: string, file: File): Promise<boolean> {
  const prep = await prepararSubidaAction({ userId, nombre: file.name, bytes: file.size, categoria });
  if (!prep.ok) {
    toast.error(prep.error, aviso);
    return false;
  }
  if (prep.signedUrl) {
    const r = await fetch(prep.signedUrl, { method: "PUT", body: file, headers: { "content-type": file.type || "application/octet-stream", "x-upsert": "true" } });
    if (!r.ok) {
      toast.error(`No se pudo subir (${r.status}). Si es un video muy pesado, prueba uno más liviano.`, aviso);
      return false;
    }
  } else {
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("path", prep.path);
    fd.set("file", file);
    const r = await subirLocalAction(fd);
    if (!r.ok) {
      toast.error(r.error, aviso);
      return false;
    }
  }
  const c = await confirmarSubidaAction({ id: prep.id, userId, path: prep.path, nombre: file.name, mime: file.type, bytes: file.size, categoria });
  if (!c.ok) {
    toast.error(c.error, aviso);
    return false;
  }
  return true;
}

export function BotonSubir({ userId, categoria, texto = "Subir", accept, className }: { userId: string; categoria: string; texto?: string; accept?: string; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const elegir = async (files: FileList | null) => {
    if (!files?.length) return;
    setSubiendo(true);
    let ok = 0;
    for (const f of Array.from(files)) if (await subirArchivoFicha(userId, categoria, f)) ok++;
    setSubiendo(false);
    if (ref.current) ref.current.value = "";
    if (ok) toast.success(ok === 1 ? "Archivo subido" : `${ok} archivos subidos`, aviso);
  };
  return (
    <>
      <input ref={ref} type="file" hidden multiple={categoria !== "foto"} accept={accept} onChange={(e) => elegir(e.target.files)} />
      <Button type="button" variant="outline" size="sm" disabled={subiendo} onClick={() => ref.current?.click()} className={cn("rounded-full", className)}>
        {subiendo ? <Loader2 className="animate-spin" /> : <Upload />} {subiendo ? "Subiendo…" : texto}
      </Button>
    </>
  );
}

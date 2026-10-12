"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { referirAction } from "@/app/cliente/actions";

const campo = "h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-primary";

export function FormReferir({ deshabilitado }: { deshabilitado?: string }) {
  const [v, setV] = useState({ negocio: "", contacto: "", telefono: "", nota: "" });
  const [enviando, setEnviando] = useState(false);
  const enviar = async () => {
    setEnviando(true);
    const r = await referirAction(v);
    setEnviando(false);
    if (!r.ok) return toast.error(r.error, { className: "lu-app" });
    toast.success("¡Gracias! Nuestro equipo lo va a contactar de tu parte.", { className: "lu-app" });
    setV({ negocio: "", contacto: "", telefono: "", nota: "" });
  };
  return (
    <div className="panel flex flex-col gap-3 p-5">
      <input className={campo} placeholder="Nombre del negocio" value={v.negocio} onChange={(e) => setV({ ...v, negocio: e.target.value })} />
      <input className={campo} placeholder="Nombre de la persona" value={v.contacto} onChange={(e) => setV({ ...v, contacto: e.target.value })} />
      <input className={campo} placeholder="WhatsApp (787…)" inputMode="tel" value={v.telefono} onChange={(e) => setV({ ...v, telefono: e.target.value })} />
      <textarea className={`${campo} h-20 py-3`} placeholder="¿Algo que debamos saber? (opcional)" maxLength={300} value={v.nota} onChange={(e) => setV({ ...v, nota: e.target.value })} />
      <button onClick={enviar} disabled={enviando || !!deshabilitado} className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Referir
      </button>
      {deshabilitado ? <p className="text-center text-[11px] text-muted-foreground">{deshabilitado}</p> : null}
    </div>
  );
}

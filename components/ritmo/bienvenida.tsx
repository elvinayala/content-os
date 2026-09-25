"use client";

import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { completarFichaAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { BotonSubir } from "./subir";

function Campo({ label, obligatorio, children, className }: { label: string; obligatorio?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs text-muted-foreground">
        {label}
        {obligatorio ? <span className="text-[color:var(--coral)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

// Bienvenida del empleado nuevo: llena su ficha (obligatorio antes de usar Ritmo).
export function FormBienvenida({ userId, tieneFoto, ids, contratos }: { userId: string; tieneFoto: boolean; ids: number; contratos: number }) {
  const router = useRouter();
  const [v, setV] = useState({ telefono: "", telefonoAlterno: "", ciudad: "", pais: "", documentoTipo: "Cédula", documentoNumero: "", contactoEmergencia: "" });
  const [cargando, setCargando] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const terminar = async () => {
    setCargando(true);
    const r = await completarFichaAction(v);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, { className: "ritmo" });
    toast.success("¡Listo! Tu ficha quedó completa", { className: "ritmo" });
    router.push("/ritmo");
  };
  const paso = "flex flex-col gap-4 rounded-2xl border border-border bg-white/[0.02] p-4";
  return (
    <div className="flex flex-col gap-4">
      <section className={paso}>
        <p className="text-sm font-semibold">1 · Tu foto</p>
        <div className="flex items-center gap-3">
          <BotonSubir userId={userId} categoria="foto" texto={tieneFoto ? "Cambiar foto" : "Subir foto"} accept="image/*" />
          {tieneFoto ? <span className="flex items-center gap-1 text-xs text-primary"><Check className="size-3.5" /> Lista</span> : <span className="text-xs text-muted-foreground">Una foto clara de tu cara.</span>}
        </div>
      </section>
      <section className={paso}>
        <p className="text-sm font-semibold">2 · Tus datos</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Teléfono (WhatsApp)" obligatorio><Input className="h-11" inputMode="tel" value={v.telefono} onChange={set("telefono")} placeholder="+57 300 555 1234" /></Campo>
          <Campo label="Teléfono alterno"><Input className="h-11" inputMode="tel" value={v.telefonoAlterno} onChange={set("telefonoAlterno")} /></Campo>
          <Campo label="Ciudad" obligatorio><Input className="h-11" value={v.ciudad} onChange={set("ciudad")} /></Campo>
          <Campo label="País" obligatorio><Input className="h-11" value={v.pais} onChange={set("pais")} /></Campo>
          <Campo label="Tipo de documento" obligatorio><Input className="h-11" value={v.documentoTipo} onChange={set("documentoTipo")} placeholder="Cédula, pasaporte…" /></Campo>
          <Campo label="Número de documento" obligatorio><Input className="h-11" value={v.documentoNumero} onChange={set("documentoNumero")} /></Campo>
          <Campo label="Contacto de emergencia" className="sm:col-span-2"><Input className="h-11" value={v.contactoEmergencia} onChange={set("contactoEmergencia")} placeholder="Nombre, parentesco y teléfono" /></Campo>
        </div>
      </section>
      <section className={paso}>
        <p className="text-sm font-semibold">3 · Tus documentos</p>
        <div className="flex flex-wrap items-center gap-3">
          <BotonSubir userId={userId} categoria="identificacion" texto="Subir identificación" accept="image/*,application/pdf" />
          {ids ? <span className="flex items-center gap-1 text-xs text-primary"><Check className="size-3.5" /> {ids} subida{ids > 1 ? "s" : ""}</span> : <span className="text-xs text-[color:var(--coral)]">Obligatorio · frente y reverso</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BotonSubir userId={userId} categoria="contrato" texto="Subir contrato firmado" accept="image/*,application/pdf" />
          {contratos ? <span className="flex items-center gap-1 text-xs text-primary"><Check className="size-3.5" /> Subido</span> : <span className="text-xs text-muted-foreground">Si ya lo tienes firmado.</span>}
        </div>
      </section>
      <Button onClick={terminar} disabled={cargando} className="h-12 rounded-full text-base font-semibold">
        {cargando ? <Loader2 className="animate-spin" /> : <Check />} Terminar mi ficha
      </Button>
    </div>
  );
}

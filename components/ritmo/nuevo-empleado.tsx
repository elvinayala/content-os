"use client";

import { Copy, Loader2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { altaEmpleadoAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const select = "h-11 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus:border-ring";

// Alta al firmar contrato: RR.HH. registra a la persona y le manda el link de bienvenida, donde ella misma
// completa su ficha. La empresa la pone RR.HH. (al empleado no se le pregunta).
export function NuevoEmpleado({ puestos, supervisores }: { puestos: { id: string; nombre: string }[]; supervisores: { id: string; nombre: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  const [v, setV] = useState({ nombre: "", email: "", empresa: "level_up", puesto: "", liderId: "", fechaIngreso: new Date().toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" }), salario: "" });
  const [cargando, setCargando] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const crear = async () => {
    setCargando(true);
    const r = await altaEmpleadoAction(v);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, { className: "ritmo" });
    setLink(r.url);
    try {
      await navigator.clipboard.writeText(r.url);
      toast.success("Link de bienvenida copiado", { className: "ritmo" });
    } catch {}
  };
  const cerrar = () => {
    setAbierto(false);
    setLink(null);
    setV((x) => ({ ...x, nombre: "", email: "", puesto: "", liderId: "", salario: "" }));
  };
  if (!abierto)
    return (
      <Button onClick={() => setAbierto(true)} className="rounded-full">
        <UserPlus /> Nuevo empleado
      </Button>
    );
  return (
    <div className="panel flex w-full flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Nuevo empleado (firmó contrato)</h2>
          <p className="text-sm text-muted-foreground">Lo registras aquí y le mandas su link: la persona crea su clave y llena su ficha (foto, datos e identificación).</p>
        </div>
        <button type="button" aria-label="Cerrar" onClick={cerrar} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
          <X className="size-4" />
        </button>
      </div>
      {link ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Listo. Mándale este link a <b>{v.nombre.split(" ")[0]}</b> por WhatsApp o correo. Vence en 72 h; si vence, genera otro en Ajustes → la persona → "Link de acceso".
          </p>
          <div className="flex gap-2">
            <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="h-10 flex-1 text-xs" />
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Copiado", { className: "ritmo" }))} className="rounded-full">
              <Copy /> Copiar
            </Button>
          </div>
          <Button variant="ghost" onClick={cerrar} className="self-start rounded-full">Registrar otro</Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Nombre completo</span><Input className="h-11" value={v.nombre} onChange={set("nombre")} /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Correo</span><Input className="h-11" type="email" value={v.email} onChange={set("email")} placeholder="nombre@levelupmediapr.net" /></label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Empresa</span>
            <select className={select} value={v.empresa} onChange={set("empresa")}>
              <option value="level_up">Level Up</option>
              <option value="ai_borinquen">AI Borinquen</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Puesto</span>
            <select className={select} value={v.puesto} onChange={set("puesto")}>
              <option value="">Escoge</option>
              {puestos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Supervisor</span>
            <select className={select} value={v.liderId} onChange={set("liderId")}>
              <option value="">— Sin supervisor —</option>
              {supervisores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Fecha de ingreso</span><Input className="h-11" type="date" value={v.fechaIngreso} onChange={set("fechaIngreso")} /></label>
          <label className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">Salario mensual (USD)</span><Input className="h-11" inputMode="decimal" value={v.salario} onChange={set("salario")} /></label>
          <div className="flex items-end justify-end">
            <Button onClick={crear} disabled={cargando} className="h-11 rounded-full px-6">
              {cargando ? <Loader2 className="animate-spin" /> : <UserPlus />} Registrar y generar link
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

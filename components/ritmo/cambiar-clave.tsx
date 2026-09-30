"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { cambiarMiClaveAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const aviso = { className: "ritmo" };

export function CambiarClave() {
  const router = useRouter();
  const [v, setV] = useState({ actual: "", nueva: "", otra: "" });
  const [cargando, setCargando] = useState(false);
  const cambiar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    const r = await cambiarMiClaveAction(v);
    setCargando(false);
    if (!r.ok) return toast.error(r.error, aviso);
    setV({ actual: "", nueva: "", otra: "" });
    toast.success("Listo: tu clave nueva ya sirve en Ritmo, Pulse y Leads.", aviso);
    router.push("/ritmo");
  };
  return (
    <form onSubmit={cambiar} className="panel flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="actual">Clave actual</Label>
        <Input id="actual" type="password" autoComplete="current-password" required value={v.actual} onChange={(e) => setV({ ...v, actual: e.target.value })} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nueva">Clave nueva (mínimo 8 caracteres)</Label>
        <Input id="nueva" type="password" autoComplete="new-password" required minLength={8} value={v.nueva} onChange={(e) => setV({ ...v, nueva: e.target.value })} className="h-11" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otra">Repite la clave nueva</Label>
        <Input id="otra" type="password" autoComplete="new-password" required minLength={8} value={v.otra} onChange={(e) => setV({ ...v, otra: e.target.value })} className="h-11" />
      </div>
      <Button type="submit" disabled={cargando} className="h-11 rounded-full">
        {cargando ? <Loader2 className="animate-spin" /> : null} Cambiar clave
      </Button>
      <p className="text-xs text-muted-foreground">Se cierran tus sesiones en otros equipos. Si usas la vista maestra, te va a pedir otra vez el código de tu app.</p>
    </form>
  );
}

"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { crearFichaAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";

export function CrearFicha({ userId }: { userId: string }) {
  const [cargando, setCargando] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={cargando}
      className="rounded-full"
      onClick={async () => {
        setCargando(true);
        const r = await crearFichaAction(userId);
        setCargando(false);
        if (!r.ok) toast.error(r.error, { className: "ritmo" });
      }}
    >
      {cargando ? <Loader2 className="animate-spin" /> : <Plus />} Crear ficha
    </Button>
  );
}

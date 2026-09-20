"use client";

import { useTransition } from "react";
import { Pause, Play, Rocket } from "lucide-react";
import { toast } from "sonner";

import { cambiarEstadoChatAction } from "@/app/borinquen/chat/actions";
import type { EstadoAgenteVoz } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function ChatAcciones({
  id,
  estado,
}: {
  id: string;
  estado: EstadoAgenteVoz;
}) {
  const [pendiente, startTransition] = useTransition();

  function cambiar(nuevo: EstadoAgenteVoz, msg: string) {
    startTransition(async () => {
      const res = await cambiarEstadoChatAction(id, nuevo);
      if (res.ok) toast.success(msg);
      else toast.error(res.error ?? "No se pudo cambiar el estado.");
    });
  }

  if (estado === "borrador") {
    return (
      <Button size="sm" disabled={pendiente} onClick={() => cambiar("activo", "Asistente publicado.")}>
        <Rocket className="size-4" /> Publicar
      </Button>
    );
  }
  if (estado === "activo") {
    return (
      <Button size="sm" variant="outline" disabled={pendiente} onClick={() => cambiar("pausado", "Asistente pausado.")}>
        <Pause className="size-4" /> Pausar
      </Button>
    );
  }
  return (
    <Button size="sm" disabled={pendiente} onClick={() => cambiar("activo", "Asistente reactivado.")}>
      <Play className="size-4" /> Reactivar
    </Button>
  );
}

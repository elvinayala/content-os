"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

// 24/oct (Yaileen): crear la clave tarda ~2 s y en el celular la gente tocaba dos veces; el primer toque gastaba el
// link y el segundo caía en "Este link ya no sirve" aunque la clave sí quedó creada. Mientras procesa, no se puede tocar.
export function BotonActivar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mt-2 h-12 rounded-full text-base font-semibold">
      {pending ? <><Loader2 className="animate-spin" /> Creando tu clave…</> : texto}
    </Button>
  );
}

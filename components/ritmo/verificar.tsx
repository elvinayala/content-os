"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { verificarDosPasosAction } from "@/app/ritmo/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FormCodigo() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const enviar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (codigo.length !== 6) return setError("Escribe los 6 números de la app");
    setCargando(true);
    setError(null);
    const r = await verificarDosPasosAction(codigo);
    setCargando(false);
    if (!r.ok) {
      setError(r.error);
      setCodigo("");
      return;
    }
    router.replace("/ritmo");
    router.refresh();
  };
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <Input
        value={codigo}
        onChange={(e) => {
          setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
          setError(null);
        }}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        placeholder="000000"
        aria-label="Código de 6 números"
        className="num h-14 text-center text-2xl tracking-[0.5em]"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" disabled={cargando} className="h-12 rounded-full text-base font-semibold">
        {cargando ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Verificar
      </Button>
    </form>
  );
}

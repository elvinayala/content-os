import { CambiarClave } from "@/components/ritmo/cambiar-clave";

export const metadata = { title: "Cambiar mi clave · Ritmo" };

// Cada quien cambia su clave (30/sep). Es la misma cuenta de Pulse, Leads y Ritmo.
export default function ClavePage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cambiar mi clave</h1>
        <p className="text-sm text-muted-foreground">Es la misma clave para Ritmo, Pulse y Leads. Si no recuerdas la actual, pídele a RR.HH. (Yaileen) un link para crear una nueva.</p>
      </header>
      <CambiarClave />
    </div>
  );
}

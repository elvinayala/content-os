import { Card, CardContent } from "@/components/ui/card";

// Tarjeta chica de un número (KPI). Compartida por el detalle de agente de voz y el portal.
export function Dato({
  label,
  valor,
  icono,
  nota,
  capitalizar = true,
}: {
  label: string;
  valor: string;
  icono?: React.ReactNode;
  nota?: string;
  capitalizar?: boolean;
}) {
  return (
    <Card className="bg-gradient-to-b from-card to-background/40">
      <CardContent className="p-4">
        <p className="label-mono text-muted-foreground">{label}</p>
        <p className={"mt-1 flex items-center gap-1.5 font-mono text-lg font-semibold" + (capitalizar ? " capitalize" : "")}>
          {icono}
          {valor}
        </p>
        {nota ? <p className="mt-1 text-xs text-muted-foreground">{nota}</p> : null}
      </CardContent>
    </Card>
  );
}

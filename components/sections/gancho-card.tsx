"use client";

import { useState } from "react";
import { Check, Copy, Eye, Wand2 } from "lucide-react";
import { toast } from "sonner";

import type { Gancho } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtCompacto } from "@/lib/format";

export function GanchoCard({ gancho }: { gancho: Gancho }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar(texto: string, msg: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success(msg);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  function usarEste() {
    // El calendario se llena con /guion. "Usar este" deja la plantilla lista para
    // pegarla en el comando. Ver .claude/commands/guion.md.
    copiar(
      gancho.plantilla,
      "Plantilla copiada — pegala en /guion para llevarla al calendario",
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base leading-snug">{gancho.titulo}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>Primero: {gancho.fuente}</span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Eye className="size-3.5" />
            {fmtCompacto(gancho.vistas)}
          </span>
        </CardDescription>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-xs">
            {gancho.nicho}
          </Badge>
          <Badge variant="outline" className="text-xs text-primary">
            {gancho.tipo}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <Tabs defaultValue="plantilla">
          <TabsList className="w-full">
            <TabsTrigger value="plantilla" className="flex-1">
              Plantilla
            </TabsTrigger>
            <TabsTrigger value="transcripto" className="flex-1">
              Transcripto
            </TabsTrigger>
          </TabsList>
          <TabsContent value="plantilla">
            <p className="rounded-md bg-muted/50 p-3 font-mono text-sm leading-relaxed">
              {gancho.plantilla}
            </p>
          </TabsContent>
          <TabsContent value="transcripto">
            <p className="rounded-md bg-muted/50 p-3 text-sm italic leading-relaxed text-muted-foreground">
              &ldquo;{gancho.transcripto}&rdquo;
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => copiar(gancho.plantilla, "Plantilla copiada")}
          aria-label="Copiar plantilla"
        >
          {copiado ? <Check className="text-primary" /> : <Copy />}
        </Button>
        <Button size="sm" className="flex-1" onClick={usarEste}>
          <Wand2 />
          Usar este
        </Button>
      </CardFooter>
    </Card>
  );
}

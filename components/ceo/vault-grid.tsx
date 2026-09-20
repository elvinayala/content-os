"use client";

import { useState } from "react";
import {
  BookOpenText,
  FileText,
  ListChecks,
  MessageSquareQuote,
  Video,
} from "lucide-react";

import { unidadInfo } from "@/lib/ceo";
import { fmtFecha } from "@/lib/format";
import type { ItemKnowledge, TipoKnowledge } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TIPOS: { key: TipoKnowledge; label: string; icon: typeof FileText }[] = [
  { key: "sop", label: "SOPs", icon: ListChecks },
  { key: "playbook", label: "Playbooks", icon: BookOpenText },
  { key: "prompt", label: "Prompts", icon: MessageSquareQuote },
  { key: "doc", label: "Docs", icon: FileText },
  { key: "grabacion", label: "Grabaciones", icon: Video },
];

export function VaultGrid({ items }: { items: ItemKnowledge[] }) {
  const [tipo, setTipo] = useState<TipoKnowledge | "todos">("todos");

  const filtrados = items.filter((i) => tipo === "todos" || i.tipo === tipo);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={tipo === "todos" ? "secondary" : "ghost"}
          onClick={() => setTipo("todos")}
        >
          Todos
        </Button>
        {TIPOS.map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tipo === t.key ? "secondary" : "ghost"}
            onClick={() => setTipo(t.key)}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtrados.map((item) => {
          const tipoCfg = TIPOS.find((t) => t.key === item.tipo);
          return (
            <Card
              key={item.id}
              className="bg-gradient-to-b from-card to-background/60"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-snug">
                    {item.titulo}
                  </CardTitle>
                  {tipoCfg ? (
                    <span className="label-mono flex shrink-0 items-center gap-1 text-primary">
                      <tipoCfg.icon className="size-3.5" />
                      {item.tipo}
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <p className="text-sm text-muted-foreground">{item.resumen}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="label-mono">
                    {unidadInfo(item.unidad).abrev}
                  </Badge>
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="label-mono text-muted-foreground">
                  Actualizado {fmtFecha(item.actualizado)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

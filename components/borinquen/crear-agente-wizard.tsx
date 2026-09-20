"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Check,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import {
  crearAgenteVozAction,
  crearAsistenteChatAction,
} from "@/app/borinquen/crear/actions";
import type { CanalChat, Entrenamiento, ProveedorVoz, TipoAgente } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CANALES: { id: CanalChat; label: string }[] = [
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "messenger", label: "Messenger" },
  { id: "web", label: "Web" },
];

const PASOS = ["Tipo y negocio", "Entrenamiento", "Ajustes"];

export function CrearAgenteWizard({
  tipoInicial,
}: {
  tipoInicial?: TipoAgente;
}) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();
  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState<TipoAgente | null>(tipoInicial ?? null);
  const [nombre, setNombre] = useState("");
  const [cliente, setCliente] = useState("");
  const [proposito, setProposito] = useState("");
  const [proveedor, setProveedor] = useState<ProveedorVoz>("retell");
  const [canales, setCanales] = useState<CanalChat[]>(["whatsapp"]);
  const [ent, setEnt] = useState<Entrenamiento>({
    nicho: "",
    oferta: "",
    tono: "",
    publico: "",
    cta: "",
    conversaciones: "",
  });

  const setE = (k: keyof Entrenamiento, v: string) =>
    setEnt((prev) => ({ ...prev, [k]: v }));

  function toggleCanal(c: CanalChat) {
    setCanales((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  const puedeSeguir1 = !!tipo && nombre.trim().length > 0;

  function crear() {
    if (!tipo) return;
    startTransition(async () => {
      const base = { nombre, cliente, proposito, entrenamiento: ent };
      const res =
        tipo === "voz"
          ? await crearAgenteVozAction({ ...base, proveedor })
          : await crearAsistenteChatAction({ ...base, canales });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo crear.");
        return;
      }
      toast.success(
        tipo === "voz"
          ? "Agente de voz creado y entrenado."
          : "Asistente de chat creado y entrenado.",
      );
      router.push(
        tipo === "voz" ? `/borinquen/voz/${res.id}` : `/borinquen/chat/${res.id}`,
      );
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {PASOS.map((p, i) => {
          const n = i + 1;
          const activo = n === paso;
          const hecho = n < paso;
          return (
            <div key={p} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium",
                  activo
                    ? "bg-primary text-primary-foreground"
                    : hecho
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {hecho ? <Check className="size-3.5" /> : n}
              </div>
              <span
                className={cn(
                  "label-mono hidden sm:inline",
                  activo ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {p}
              </span>
              {n < PASOS.length ? (
                <div className="h-px flex-1 bg-border" />
              ) : null}
            </div>
          );
        })}
      </div>

      <Card className="bg-gradient-to-b from-card to-background/40">
        <CardContent className="space-y-5 p-6">
          {/* PASO 1 — Tipo y negocio */}
          {paso === 1 ? (
            <>
              <div>
                <Label className="mb-2 block">Tipo de agente</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TipoCard
                    activo={tipo === "voz"}
                    onClick={() => setTipo("voz")}
                    icon={<AudioLines className="size-5" />}
                    titulo="Agente de Voz"
                    desc="Atiende llamadas 24/7"
                  />
                  <TipoCard
                    activo={tipo === "chat"}
                    onClick={() => setTipo("chat")}
                    icon={<MessageSquare className="size-5" />}
                    titulo="Asistente de Chat"
                    desc="WhatsApp, IG y web"
                  />
                </div>
              </div>
              <Campo label="Nombre del agente">
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={
                    tipo === "chat"
                      ? "Ventas WhatsApp — Barbería El Fino"
                      : "Recepción — Barbería El Fino"
                  }
                />
              </Campo>
              <Campo label="Cliente / negocio (opcional)">
                <Input
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Barbería El Fino"
                />
              </Campo>
              <Campo label="¿Qué hace?">
                <Textarea
                  value={proposito}
                  onChange={(e) => setProposito(e.target.value)}
                  placeholder="Agenda turnos, responde precios y confirma por WhatsApp."
                  rows={2}
                />
              </Campo>
            </>
          ) : null}

          {/* PASO 2 — Entrenamiento */}
          {paso === 2 ? (
            <>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary" />
                Con esto entrenamos al agente para que suene a tu negocio.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Rubro / nicho">
                  <Input value={ent.nicho} onChange={(e) => setE("nicho", e.target.value)} placeholder="Barbería" />
                </Campo>
                <Campo label="Público">
                  <Input value={ent.publico} onChange={(e) => setE("publico", e.target.value)} placeholder="Hombres del pueblo, 18-45" />
                </Campo>
              </div>
              <Campo label="¿Qué ofrece?">
                <Input value={ent.oferta} onChange={(e) => setE("oferta", e.target.value)} placeholder="Cortes, barba, diseños; turnos por WhatsApp" />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Tono de la marca">
                  <Input value={ent.tono} onChange={(e) => setE("tono", e.target.value)} placeholder="Relajado, boricua, con confianza" />
                </Campo>
                <Campo label="Meta de cada charla">
                  <Input value={ent.cta} onChange={(e) => setE("cta", e.target.value)} placeholder="Agendar un turno" />
                </Campo>
              </div>
              <Campo label="Conversaciones recientes (opcional pero recomendado)">
                <Textarea
                  value={ent.conversaciones}
                  onChange={(e) => setE("conversaciones", e.target.value)}
                  placeholder={"Pegá chats o llamadas reales para que copie el estilo.\nCliente: cuánto un corte?\nNegocio: $15 con diseño. ¿Te agendo hoy?"}
                  rows={5}
                />
              </Campo>
            </>
          ) : null}

          {/* PASO 3 — Ajustes del tipo + crear */}
          {paso === 3 ? (
            <>
              {tipo === "voz" ? (
                <Campo label="Proveedor de voz">
                  <Select value={proveedor} onValueChange={(v) => setProveedor(v as ProveedorVoz)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="borinquen">
                      <SelectItem value="retell">Retell (recomendado)</SelectItem>
                      <SelectItem value="vapi">Vapi</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Se crea con el preset probado: baja latencia, español PR,
                    turn-taking semántico.
                  </p>
                </Campo>
              ) : (
                <Campo label="Canales del asistente">
                  <div className="flex flex-wrap gap-2">
                    {CANALES.map((c) => {
                      const on = canales.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCanal(c.id)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm transition-colors",
                            on
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50",
                          )}
                        >
                          {on ? <Check className="mr-1 inline size-3.5" /> : null}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </Campo>
              )}

              {/* Resumen */}
              <div className="rounded-lg border border-border/60 bg-background/40 p-4 text-sm">
                <p className="label-mono mb-2 text-muted-foreground">Resumen</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    <span className="text-foreground">{nombre || "—"}</span> ·{" "}
                    {tipo === "voz" ? "agente de voz" : "asistente de chat"}
                  </li>
                  <li>Negocio: {cliente || "AI Borinquen"}</li>
                  <li>
                    Entrenamiento:{" "}
                    {[ent.nicho, ent.oferta, ent.tono, ent.publico, ent.cta].filter(
                      (x) => x.trim(),
                    ).length}
                    /5 campos
                    {ent.conversaciones.trim() ? " + conversaciones" : ""}
                  </li>
                </ul>
              </div>
            </>
          ) : null}

          {/* Navegación */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => (paso === 1 ? router.back() : setPaso(paso - 1))}
              disabled={pendiente}
            >
              <ArrowLeft className="size-4" />
              {paso === 1 ? "Cancelar" : "Atrás"}
            </Button>
            {paso < 3 ? (
              <Button
                onClick={() => setPaso(paso + 1)}
                disabled={paso === 1 && !puedeSeguir1}
              >
                Siguiente <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button onClick={crear} disabled={pendiente}>
                {pendiente ? "Creando…" : "Crear y entrenar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TipoCard({
  activo,
  onClick,
  icon,
  titulo,
  desc,
}: {
  activo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  titulo: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
        activo
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50",
      )}
    >
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <div>
        <p className="font-medium">{titulo}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Check, Link2, Save } from "lucide-react";
import { toast } from "sonner";

import type { Negocio, Plataforma } from "@/lib/types";
import { guardarNegocioAction } from "@/app/(tablero)/configuracion/actions";
import { PlatformBadge } from "@/components/platform-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function lineas(texto: string): string[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function ConfiguracionForm({ negocio }: { negocio: Negocio }) {
  const [estado, setEstado] = useState<Negocio>(negocio);
  const [competidoresTxt, setCompetidoresTxt] = useState(
    negocio.competidores.join("\n"),
  );
  const [fuentesTxt, setFuentesTxt] = useState(negocio.fuentes.join("\n"));
  const [horariosTxt, setHorariosTxt] = useState(
    negocio.reglas.horariosPublicacion.join(", "),
  );
  const [pending, startTransition] = useTransition();

  function setMarca<K extends keyof Negocio["marca"]>(
    k: K,
    v: Negocio["marca"][K],
  ) {
    setEstado((s) => ({ ...s, marca: { ...s.marca, [k]: v } }));
  }

  function setRegla<K extends keyof Negocio["reglas"]>(
    k: K,
    v: Negocio["reglas"][K],
  ) {
    setEstado((s) => ({ ...s, reglas: { ...s.reglas, [k]: v } }));
  }

  function setCuenta(plataforma: Plataforma, handle: string) {
    setEstado((s) => ({
      ...s,
      cuentas: s.cuentas.map((c) =>
        c.plataforma === plataforma ? { ...c, handle } : c,
      ),
    }));
  }

  function toggleConexion(plataforma: Plataforma) {
    setEstado((s) => ({
      ...s,
      cuentas: s.cuentas.map((c) =>
        c.plataforma === plataforma ? { ...c, conectada: !c.conectada } : c,
      ),
    }));
    toast.message(
      `Conectar de verdad abre el OAuth de ${plataforma} (vos autorizás). Por ahora queda marcada — demo.`,
    );
  }

  function guardar() {
    const negocioFinal: Negocio = {
      ...estado,
      competidores: lineas(competidoresTxt).slice(0, 8),
      fuentes: lineas(fuentesTxt),
      reglas: {
        ...estado.reglas,
        horariosPublicacion: horariosTxt
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
      },
    };
    startTransition(async () => {
      await guardarNegocioAction(negocioFinal);
      setEstado(negocioFinal);
      toast.success("Configuración guardada");
    });
  }

  return (
    <div className="space-y-6">
      {/* Mi marca */}
      <Card>
        <CardHeader>
          <CardTitle>Mi marca</CardTitle>
          <CardDescription>
            Con esto, Lauti y Facu escriben guiones y descripciones con tu voz.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              value={estado.marca.handle}
              onChange={(e) => setMarca("handle", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={estado.marca.nombre}
              onChange={(e) => setMarca("nombre", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nicho">Nicho</Label>
            <Input
              id="nicho"
              value={estado.marca.nicho}
              onChange={(e) => setMarca("nicho", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tono">Tono de voz</Label>
            <Textarea
              id="tono"
              rows={2}
              value={estado.marca.tono}
              onChange={(e) => setMarca("tono", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audiencia">Audiencia</Label>
            <Textarea
              id="audiencia"
              rows={2}
              value={estado.marca.audiencia}
              onChange={(e) => setMarca("audiencia", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="oferta">Oferta</Label>
            <Textarea
              id="oferta"
              rows={2}
              value={estado.marca.oferta}
              onChange={(e) => setMarca("oferta", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cta">CTA por defecto</Label>
            <Input
              id="cta"
              value={estado.marca.cta}
              onChange={(e) => setMarca("cta", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Mis cuentas */}
      <Card>
        <CardHeader>
          <CardTitle>Mis cuentas</CardTitle>
          <CardDescription>
            Mateo saca tus métricas reales de acá. Conectar abre el OAuth de cada
            plataforma (vos autorizás; no se guardan contraseñas).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {estado.cuentas.map((c) => (
            <div
              key={c.plataforma}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
            >
              <PlatformBadge plataforma={c.plataforma} />
              <Input
                value={c.handle}
                placeholder="@tu_handle"
                onChange={(e) => setCuenta(c.plataforma, e.target.value)}
                className="w-44"
              />
              <Button
                type="button"
                size="sm"
                variant={c.conectada ? "outline" : "default"}
                className="ml-auto"
                onClick={() => toggleConexion(c.plataforma)}
              >
                {c.conectada ? <Check className="text-primary" /> : <Link2 />}
                {c.conectada ? "Conectada" : "Conectar"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Competidores y fuentes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Competidores</CardTitle>
            <CardDescription>
              Las cuentas que rastrea Mateo (hasta 8). Una por línea.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              value={competidoresTxt}
              onChange={(e) => setCompetidoresTxt(e.target.value)}
              placeholder={"@cuenta_1\n@cuenta_2"}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fuentes de tendencias</CardTitle>
            <CardDescription>
              Las que revisa Cami cada día. Una por línea.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              value={fuentesTxt}
              onChange={(e) => setFuentesTxt(e.target.value)}
              placeholder={"Blog de Anthropic\nBlog de OpenAI"}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Reglas de los agentes */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas del equipo</CardTitle>
          <CardDescription>
            La estrategia de Santi y la operación de Facu y Cami.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Reels / semana</Label>
            <Input
              type="number"
              min={0}
              value={estado.reglas.mixSemanal.reels}
              onChange={(e) =>
                setRegla("mixSemanal", {
                  ...estado.reglas.mixSemanal,
                  reels: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Carruseles / semana</Label>
            <Input
              type="number"
              min={0}
              value={estado.reglas.mixSemanal.carruseles}
              onChange={(e) =>
                setRegla("mixSemanal", {
                  ...estado.reglas.mixSemanal,
                  carruseles: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>YouTube / semana</Label>
            <Input
              type="number"
              min={0}
              value={estado.reglas.mixSemanal.youtube}
              onChange={(e) =>
                setRegla("mixSemanal", {
                  ...estado.reglas.mixSemanal,
                  youtube: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Horarios de publicación</Label>
            <Input
              value={horariosTxt}
              onChange={(e) => setHorariosTxt(e.target.value)}
              placeholder="12:30, 18:00, 21:00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ideas ganadoras / semana</Label>
            <Input
              type="number"
              min={1}
              value={estado.reglas.ideasPorSemana}
              onChange={(e) => setRegla("ideasPorSemana", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Umbral de bombazo (× mediana)</Label>
            <Input
              type="number"
              min={1}
              step={0.5}
              value={estado.reglas.umbralBombazo}
              onChange={(e) => setRegla("umbralBombazo", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Resumen a Slack (hora)</Label>
            <Input
              value={estado.reglas.resumenSlackHora}
              onChange={(e) => setRegla("resumenSlackHora", e.target.value)}
              placeholder="07:00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guardar (sticky) */}
      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={guardar} disabled={pending} size="lg" className="shadow-lg">
          <Save />
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}

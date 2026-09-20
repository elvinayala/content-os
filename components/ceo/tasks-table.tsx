"use client";

import { useMemo, useState } from "react";

import { UNIDADES, unidadInfo } from "@/lib/ceo";
import { fmtFecha } from "@/lib/format";
import type {
  EstadoTarea,
  TareaEcosistema,
  UnidadNegocio,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ORDEN_ESTADO: Record<EstadoTarea, number> = {
  bloqueada: 0,
  pendiente: 1,
  "en-curso": 2,
  hecha: 3,
};

const ORDEN_PRIORIDAD = { alta: 0, media: 1, baja: 2 } as const;

const ESTADO_BADGE: Record<EstadoTarea, string> = {
  pendiente: "text-[var(--status-waiting)]",
  "en-curso": "text-[var(--status-working)]",
  bloqueada: "text-destructive",
  hecha: "text-muted-foreground",
};

type Vista = "mias" | "equipo" | "todas";

// Una tarea es "mía" (de Elvin) si él la ejecuta o decide; NO si es del equipo y
// solo debe enterarse (paraCeo="saber") o si el responsable es otra persona.
function esMia(t: TareaEcosistema): boolean {
  if (t.paraCeo === "saber") return false;
  if (t.paraCeo === "hacer" || t.paraCeo === "decidir") return true;
  if (t.requiereCEO) return true;
  const r = (t.responsable ?? "").toLowerCase();
  return r === "" || r.includes("elvin");
}

export function TasksTable({
  tareas,
  nombresAgentes,
}: {
  tareas: TareaEcosistema[];
  nombresAgentes: Record<string, string>;
}) {
  const [unidad, setUnidad] = useState<UnidadNegocio | "todas">("todas");
  const [estado, setEstado] = useState<EstadoTarea | "todos">("todos");
  const [vista, setVista] = useState<Vista>("mias");

  const filtradas = useMemo(
    () =>
      tareas
        .filter((t) =>
          vista === "todas"
            ? true
            : vista === "mias"
              ? esMia(t)
              : !esMia(t),
        )
        .filter((t) => unidad === "todas" || t.unidad === unidad)
        .filter((t) => estado === "todos" || t.estado === estado)
        .sort(
          (a, b) =>
            ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] ||
            ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad],
        ),
    [tareas, unidad, estado, vista],
  );

  const conteoMias = tareas.filter(
    (t) => esMia(t) && t.estado !== "hecha",
  ).length;
  const conteoEquipo = tareas.filter(
    (t) => !esMia(t) && t.estado !== "hecha",
  ).length;

  return (
    <div className="space-y-4">
      {/* Vista: mías / del equipo / todas */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["mias", `Mías · ${conteoMias}`],
            ["equipo", `Del equipo · ${conteoEquipo}`],
            ["todas", "Todas"],
          ] as [Vista, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className={
              "label-mono rounded-md border px-3 py-1.5 transition-colors " +
              (vista === v
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={unidad}
          onValueChange={(v) => setUnidad(v as UnidadNegocio | "todas")}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          {/* className="ceo": el dropdown portalea a <body> y sale del scope del tema */}
          <SelectContent className="ceo">
            <SelectItem value="todas">Todas las unidades</SelectItem>
            {(Object.keys(UNIDADES) as UnidadNegocio[]).map((u) => (
              <SelectItem key={u} value={u}>
                {UNIDADES[u].nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={estado}
          onValueChange={(v) => setEstado(v as EstadoTarea | "todos")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="ceo">
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en-curso">En curso</SelectItem>
            <SelectItem value="bloqueada">Bloqueada</SelectItem>
            <SelectItem value="hecha">Hecha</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarea</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Con quién</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay tareas con esos filtros.
                </TableCell>
              </TableRow>
            ) : (
              filtradas.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-md">
                    <div className="flex items-start gap-2">
                      {t.requiereCEO ? (
                        <span
                          className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--status-waiting)]"
                          title="Requiere tu decisión"
                        />
                      ) : (
                        <span className="mt-1.5 size-1.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">
                          {t.titulo}
                          {t.paraCeo === "saber" ? (
                            <Badge
                              variant="outline"
                              className="label-mono ml-2 align-middle"
                            >
                              para tu info
                            </Badge>
                          ) : t.paraCeo === "decidir" || t.requiereCEO ? (
                            <Badge className="label-mono ml-2 align-middle">
                              tu decisión
                            </Badge>
                          ) : null}
                        </p>
                        {t.detalle ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t.detalle}
                          </p>
                        ) : null}
                        {t.origen ? (
                          <p className="label-mono mt-0.5 text-muted-foreground">
                            {t.origen}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="label-mono text-muted-foreground">
                    {unidadInfo(t.unidad).abrev}
                  </TableCell>
                  <TableCell className="text-sm">
                    {t.responsable ??
                      t.conQuien ??
                      nombresAgentes[t.agenteId] ??
                      t.agenteId}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={t.prioridad === "alta" ? "default" : "outline"}
                      className="label-mono"
                    >
                      {t.prioridad}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`label-mono ${ESTADO_BADGE[t.estado]}`}>
                      {t.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.vence ? fmtFecha(t.vence) : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

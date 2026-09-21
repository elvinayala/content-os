"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Image as ImageIcon,
  Clapperboard,
  GalleryHorizontalEnd,
  Lightbulb,
  Mail,
  Megaphone,
  MessageSquarePlus,
  MessageSquareText,
  Pencil,
  Plus,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";

import { UNIDADES, unidadInfo } from "@/lib/ceo";
import { fmtFecha } from "@/lib/format";
import type { Entrega, TipoEntrega, UnidadNegocio } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TIPO_META: Record<
  TipoEntrega,
  { label: string; icon: typeof Lightbulb }
> = {
  idea: { label: "Ideas", icon: Lightbulb },
  gancho: { label: "Ganchos", icon: Sparkles },
  guion: { label: "Guiones", icon: Clapperboard },
  carrusel: { label: "Carruseles", icon: GalleryHorizontalEnd },
  historia: { label: "Historias", icon: MessageSquareText },
  anuncio: { label: "Anuncios", icon: Megaphone },
  arte: { label: "Artes", icon: ImageIcon },
  email: { label: "Emails", icon: Mail },
};

// Etiqueta legible por lista de emails (para el badge y el filtro).
const LISTA_LABEL: Record<string, string> = {
  clientes: "Clientes",
  inactivos: "Inactivos",
  "agendados-no-compraron": "Agendaron · no compraron",
  "newsletter-general": "Newsletter",
};

const MARCAS: UnidadNegocio[] = ["shadow-operator", "ai-borinquen", "level-up"];

// La decisión (aprobado/descartado) vive en el navegador — el portal en Vercel
// es read-only. Persiste por id de entrega.
type Decision = "aprobado" | "descartado";
const STORAGE_KEY = "entregas-decisiones";
type Vista = "pendientes" | "aprobadas" | "descartadas" | "todas";

const ENVIADAS_KEY = "entregas-enviadas-slack";

// Ediciones de Elvin sobre una pieza. Cuando está 99% bien y solo falta un
// ajuste, lo arregla acá mismo y lo aprueba — sin mandarlo de vuelta al agente
// y esperar horas. Igual que las decisiones: vive en el navegador (Vercel es
// read-only) y se manda ya editado al aprobar.
const EDICIONES_KEY = "entregas-ediciones";
type Edicion = { titulo: string; contenido: string };

export function EntregasInbox({ entregas }: { entregas: Entrega[] }) {
  const [marca, setMarca] = useState<UnidadNegocio | "todas">("todas");
  const [tipo, setTipo] = useState<TipoEntrega | "todos">("todos");
  const [lista, setLista] = useState<string | "todas">("todas");
  const [vista, setVista] = useState<Vista>("pendientes");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [decisiones, setDecisiones] = useState<Record<string, Decision>>({});
  // Estado del envío a Slack por id: "enviando" | "ok" | "error".
  const [envio, setEnvio] = useState<Record<string, "enviando" | "ok" | "error">>({});
  // Feedback / pedidos al agente de contenido.
  const [feedbackDe, setFeedbackDe] = useState<string | null>(null);
  const [feedbackTexto, setFeedbackTexto] = useState("");
  const [pedido, setPedido] = useState<"" | "enviando" | "ok" | "error">("");
  // Pedido libre (urgente): botón "Pedir contenido" con descripción.
  const [pedidoAbierto, setPedidoAbierto] = useState(false);
  const [pedidoTexto, setPedidoTexto] = useState("");
  const [pedidoLibre, setPedidoLibre] = useState<"" | "enviando" | "ok" | "error">("");
  // Edición inline: id de la pieza que se está editando + el borrador en curso.
  const [ediciones, setEdiciones] = useState<Record<string, Edicion>>({});
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Edicion>({ titulo: "", contenido: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDecisiones(JSON.parse(raw));
      const enviadasRaw = localStorage.getItem(ENVIADAS_KEY);
      if (enviadasRaw) {
        const ids: string[] = JSON.parse(enviadasRaw);
        setEnvio(Object.fromEntries(ids.map((id) => [id, "ok" as const])));
      }
      const edRaw = localStorage.getItem(EDICIONES_KEY);
      if (edRaw) setEdiciones(JSON.parse(edRaw));
    } catch {}
  }, []);

  // La pieza "efectiva": la original con la edición de Elvin aplicada encima.
  // TODO lo que se muestra, aprueba o envía pasa por acá.
  function conEdicion(e: Entrega): Entrega {
    const ed = ediciones[e.id];
    return ed ? { ...e, titulo: ed.titulo, contenido: ed.contenido } : e;
  }

  function abrirEdicion(e: Entrega) {
    const v = conEdicion(e);
    setBorrador({ titulo: v.titulo, contenido: v.contenido });
    setEditandoId(e.id);
    setAbierta(e.id); // desplegar la tarjeta para ver lo que se edita
  }

  function guardarEdicion(id: string) {
    setEdiciones((prev) => {
      const next = { ...prev, [id]: { ...borrador } };
      try {
        localStorage.setItem(EDICIONES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setEditandoId(null);
  }

  function revertirEdicion(id: string) {
    setEdiciones((prev) => {
      const next = { ...prev };
      delete next[id];
      try {
        localStorage.setItem(EDICIONES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    setEditandoId(null);
  }

  function decidir(id: string, d: Decision | null) {
    setDecisiones((prev) => {
      const next = { ...prev };
      if (d === null) delete next[id];
      else next[id] = d;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  // Aprobar = marca la decisión Y postea el texto a Slack (una sola vez) para
  // que la community manager lo tenga listo para publicar.
  async function aprobar(entrega: Entrega) {
    // Si Elvin editó la pieza, se aprueba y se envía SU versión, no la original.
    const e = conEdicion(entrega);
    decidir(e.id, "aprobado");
    if (envio[e.id] === "ok" || envio[e.id] === "enviando") return;
    setEnvio((p) => ({ ...p, [e.id]: "enviando" }));
    try {
      const res = await fetch("/api/aprobar-entrega", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: e.titulo,
          marca: e.marca,
          tipo: e.tipo,
          pilar: e.pilar,
          contenido: e.contenido,
          angulo: e.angulo,
          para: e.para,
          lista: e.lista,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setEnvio((p) => {
        const next = { ...p, [e.id]: "ok" as const };
        try {
          const ids = Object.keys(next).filter((k) => next[k] === "ok");
          localStorage.setItem(ENVIADAS_KEY, JSON.stringify(ids));
        } catch {}
        return next;
      });
    } catch {
      setEnvio((p) => ({ ...p, [e.id]: "error" }));
    }
  }

  // Pedido libre: Elvin describe qué necesita (urgente) y el worker lo produce
  // a la bandeja sin que tenga que ir a Claude.
  async function enviarPedidoLibre() {
    const texto = pedidoTexto.trim();
    if (!texto) return;
    setPedidoLibre("enviando");
    try {
      const res = await fetch("/api/pedir-contenido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "pedido", texto }),
      });
      setPedidoLibre(res.ok ? "ok" : "error");
      if (res.ok) {
        setPedidoTexto("");
        setPedidoAbierto(false);
      }
    } catch {
      setPedidoLibre("error");
    }
    setTimeout(() => setPedidoLibre(""), 5000);
  }

  // Pedir más opciones al agente (usa el filtro de marca/tipo actual).
  async function pedirMas() {
    setPedido("enviando");
    try {
      const res = await fetch("/api/pedir-contenido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "mas",
          marca: marca === "todas" ? undefined : marca,
          tipo: tipo === "todos" ? undefined : tipo,
        }),
      });
      setPedido(res.ok ? "ok" : "error");
    } catch {
      setPedido("error");
    }
    setTimeout(() => setPedido(""), 4000);
  }

  // Enviar feedback/sugerencia sobre una pieza → el agente lo aplica y aprende.
  async function enviarFeedback(e: Entrega) {
    const texto = feedbackTexto.trim();
    if (!texto) return;
    setEnvio((p) => ({ ...p, [`fb-${e.id}`]: "enviando" }));
    try {
      const res = await fetch("/api/pedir-contenido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "feedback",
          marca: e.marca,
          tipo: e.tipo,
          titulo: e.titulo,
          contenido: e.contenido,
          texto,
        }),
      });
      setEnvio((p) => ({ ...p, [`fb-${e.id}`]: res.ok ? "ok" : "error" }));
      if (res.ok) {
        setFeedbackDe(null);
        setFeedbackTexto("");
      }
    } catch {
      setEnvio((p) => ({ ...p, [`fb-${e.id}`]: "error" }));
    }
  }

  const conteos = useMemo(() => {
    let aprobadas = 0;
    let descartadas = 0;
    for (const e of entregas) {
      if (decisiones[e.id] === "aprobado") aprobadas++;
      else if (decisiones[e.id] === "descartado") descartadas++;
    }
    return {
      aprobadas,
      descartadas,
      pendientes: entregas.length - aprobadas - descartadas,
    };
  }, [entregas, decisiones]);

  const filtradas = useMemo(
    () =>
      entregas
        .filter((e) => marca === "todas" || e.marca === marca)
        .filter((e) => tipo === "todos" || e.tipo === tipo)
        .filter((e) => lista === "todas" || e.lista === lista)
        .filter((e) => {
          const d = decisiones[e.id];
          if (vista === "pendientes") return !d;
          if (vista === "aprobadas") return d === "aprobado";
          if (vista === "descartadas") return d === "descartado";
          return true;
        })
        .sort((a, b) => b.creadoEl.localeCompare(a.creadoEl)),
    [entregas, marca, tipo, lista, vista, decisiones],
  );

  const tiposPresentes = [...new Set(entregas.map((e) => e.tipo))];
  // Listas de email presentes (para el filtro por segmento).
  const listasPresentes = [
    ...new Set(entregas.filter((e) => e.lista).map((e) => e.lista as string)),
  ];

  return (
    <div className="space-y-4">
      {/* Vista por decisión */}
      <div className="flex flex-wrap gap-2">
        <FiltroBtn
          activo={vista === "pendientes"}
          onClick={() => setVista("pendientes")}
        >
          Pendientes · {conteos.pendientes}
        </FiltroBtn>
        <FiltroBtn
          activo={vista === "aprobadas"}
          onClick={() => setVista("aprobadas")}
        >
          <Check className="size-3.5" /> Aprobadas · {conteos.aprobadas}
        </FiltroBtn>
        <FiltroBtn
          activo={vista === "descartadas"}
          onClick={() => setVista("descartadas")}
        >
          <X className="size-3.5" /> Descartadas · {conteos.descartadas}
        </FiltroBtn>
        <FiltroBtn activo={vista === "todas"} onClick={() => setVista("todas")}>
          Todas
        </FiltroBtn>
      </div>

      {/* Filtros marca / tipo */}
      <div className="flex flex-wrap gap-2">
        <FiltroBtn activo={marca === "todas"} onClick={() => setMarca("todas")}>
          Todas las marcas
        </FiltroBtn>
        {MARCAS.map((m) => (
          <FiltroBtn key={m} activo={marca === m} onClick={() => setMarca(m)}>
            {UNIDADES[m].nombre}
          </FiltroBtn>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <FiltroBtn activo={tipo === "todos"} onClick={() => setTipo("todos")}>
          Todo
        </FiltroBtn>
        {tiposPresentes.map((t) => {
          const Icon = TIPO_META[t].icon;
          return (
            <FiltroBtn key={t} activo={tipo === t} onClick={() => setTipo(t)}>
              <Icon className="size-3.5" />
              {TIPO_META[t].label}
            </FiltroBtn>
          );
        })}
      </div>

      {/* Filtro por lista de emails (solo cuando hay emails) */}
      {listasPresentes.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="label-mono text-muted-foreground">Lista:</span>
          <FiltroBtn activo={lista === "todas"} onClick={() => setLista("todas")}>
            Todas
          </FiltroBtn>
          {listasPresentes.map((l) => (
            <FiltroBtn key={l} activo={lista === l} onClick={() => setLista(l)}>
              <Mail className="size-3.5" />
              {LISTA_LABEL[l] ?? l}
            </FiltroBtn>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <p className="label-mono text-muted-foreground">
          {filtradas.length} entregas
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={pedirMas}
          disabled={pedido === "enviando"}
        >
          <Plus className="size-3.5" />
          {pedido === "enviando"
            ? "Pidiendo…"
            : pedido === "ok"
              ? "Pedido enviado ✓"
              : pedido === "error"
                ? "Error al pedir"
                : `Pedir más opciones${marca !== "todas" ? ` · ${unidadInfo(marca).abrev}` : ""}`}
        </Button>
        <Button
          size="sm"
          onClick={() => setPedidoAbierto((v) => !v)}
          disabled={pedidoLibre === "enviando"}
        >
          <MessageSquarePlus className="size-3.5" />
          {pedidoLibre === "ok"
            ? "Pedido encolado ✓"
            : pedidoLibre === "error"
              ? "Error — reintenta"
              : "Pedir contenido"}
        </Button>
      </div>

      {/* Pedido libre: describir qué se necesita (urgente) */}
      {pedidoAbierto ? (
        <Card className="bg-gradient-to-b from-card to-background/60">
          <CardContent className="p-4">
            <label className="label-mono mb-1.5 block text-muted-foreground">
              ¿Qué necesitas? (marca, cantidad, tipo, para quién, ángulo, para cuándo)
            </label>
            <textarea
              value={pedidoTexto}
              onChange={(ev) => setPedidoTexto(ev.target.value)}
              rows={3}
              autoFocus
              placeholder="Ej: 10 anuncios para Valentina, ángulo danos-7-días de AI Borinquen, urgente para hoy…"
              className="w-full resize-y rounded-md border border-border bg-background/60 p-2 text-sm outline-none focus:border-primary/50"
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={enviarPedidoLibre}
                disabled={!pedidoTexto.trim() || pedidoLibre === "enviando"}
              >
                {pedidoLibre === "enviando" ? "Encolando…" : "Enviar pedido"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPedidoAbierto(false)}>
                Cancelar
              </Button>
              <span className="label-mono text-muted-foreground">
                el equipo lo produce y cae acá (~30 min)
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Lista */}
      <div className="space-y-2">
        {filtradas.length === 0 ? (
          <Card className="bg-gradient-to-b from-card to-background/60">
            <CardContent className="p-6 text-sm text-muted-foreground">
              {vista === "pendientes"
                ? "Nada pendiente por revisar 🎉"
                : "Sin entregas en esta vista."}
            </CardContent>
          </Card>
        ) : (
          filtradas.map((e) => {
            const Icon = TIPO_META[e.tipo].icon;
            const open = abierta === e.id;
            const d = decisiones[e.id];
            return (
              <Card
                key={e.id}
                className={cn(
                  "bg-gradient-to-b from-card to-background/60 transition-opacity",
                  d === "aprobado" && "border-[var(--status-working)]/50",
                  d === "descartado" && "opacity-55",
                )}
              >
                <button
                  onClick={() => setAbierta(open ? null : e.id)}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "font-medium leading-snug",
                        d === "descartado" && "line-through",
                      )}
                    >
                      {conEdicion(e).titulo}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="label-mono">
                        {unidadInfo(e.marca).abrev}
                      </Badge>
                      {ediciones[e.id] ? (
                        <Badge
                          variant="outline"
                          className="label-mono border-primary/60 text-primary"
                        >
                          editado por ti
                        </Badge>
                      ) : null}
                      <Badge variant="secondary" className="text-xs">
                        {e.formato ?? TIPO_META[e.tipo].label.replace(/s$/, "")}
                      </Badge>
                      {e.para ? (
                        <Badge
                          variant="outline"
                          className="label-mono border-primary/40 text-primary"
                        >
                          para {e.para}
                        </Badge>
                      ) : null}
                      {e.lista ? (
                        <Badge
                          variant="outline"
                          className="label-mono border-primary/40 text-primary"
                        >
                          {LISTA_LABEL[e.lista] ?? e.lista}
                        </Badge>
                      ) : null}
                      {e.pilar ? (
                        <span className="label-mono text-muted-foreground">
                          {e.pilar}
                        </span>
                      ) : null}
                      {d === "aprobado" ? (
                        <span className="label-mono text-[var(--status-working)]">
                          ✓ aprobado
                        </span>
                      ) : d === "descartado" ? (
                        <span className="label-mono text-muted-foreground">
                          descartado
                        </span>
                      ) : (
                        <span className="label-mono text-[var(--status-working)]">
                          nuevo
                        </span>
                      )}
                      <span className="label-mono ml-auto text-muted-foreground">
                        {e.agente} · {fmtFecha(e.creadoEl)}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {/* Acciones Aprobar / Descartar */}
                <div className="flex items-center gap-2 border-t border-border px-4 py-2">
                  {d ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => decidir(e.id, null)}
                    >
                      <Undo2 className="size-3.5" /> Reabrir
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" onClick={() => aprobar(e)}>
                        <Check className="size-3.5" /> Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decidir(e.id, "descartado")}
                      >
                        <X className="size-3.5" /> Descartar
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      editandoId === e.id ? setEditandoId(null) : abrirEdicion(e)
                    }
                  >
                    <Pencil className="size-3.5" />{" "}
                    {editandoId === e.id ? "Cerrar editor" : "Editar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFeedbackDe(feedbackDe === e.id ? null : e.id);
                      setFeedbackTexto("");
                    }}
                  >
                    <MessageSquarePlus className="size-3.5" /> Mejorar
                  </Button>
                  {/* Estado del envío a Slack para la community manager */}
                  {d === "aprobado" && envio[e.id] ? (
                    <span className="label-mono ml-auto text-muted-foreground">
                      {envio[e.id] === "enviando"
                        ? "enviando a Slack…"
                        : envio[e.id] === "ok"
                          ? e.para
                            ? `→ enviado a ${e.para} ✓`
                            : "→ en Slack ✓"
                          : "no se pudo enviar a Slack"}
                    </span>
                  ) : null}
                </div>

                {feedbackDe === e.id ? (
                  <div className="border-t border-border px-4 py-3">
                    <label className="label-mono mb-1.5 block text-muted-foreground">
                      ¿Cómo lo querés? (el agente lo aplica y lo aprende)
                    </label>
                    <textarea
                      value={feedbackTexto}
                      onChange={(ev) => setFeedbackTexto(ev.target.value)}
                      rows={3}
                      autoFocus
                      placeholder="Ej: más directo, sin relleno; hook más fuerte; que hable en primera persona; menos técnico…"
                      className="w-full resize-y rounded-md border border-border bg-background/60 p-2 text-sm outline-none focus:border-primary/50"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => enviarFeedback(e)}
                        disabled={
                          !feedbackTexto.trim() ||
                          envio[`fb-${e.id}`] === "enviando"
                        }
                      >
                        {envio[`fb-${e.id}`] === "enviando"
                          ? "Enviando…"
                          : "Enviar sugerencia"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFeedbackDe(null)}
                      >
                        Cancelar
                      </Button>
                      {envio[`fb-${e.id}`] === "error" ? (
                        <span className="label-mono text-[var(--status-waiting)]">
                          no se pudo enviar
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {editandoId === e.id ? (
                  <div className="border-t border-border bg-background/40 px-4 py-3">
                    <label className="label-mono mb-1.5 block text-muted-foreground">
                      Título
                    </label>
                    <input
                      value={borrador.titulo}
                      onChange={(ev) =>
                        setBorrador((b) => ({ ...b, titulo: ev.target.value }))
                      }
                      className="mb-3 w-full rounded-md border border-border bg-background/60 p-2 text-sm outline-none focus:border-primary/50"
                    />
                    <label className="label-mono mb-1.5 block text-muted-foreground">
                      Guión — editalo y apruébalo de una
                    </label>
                    <textarea
                      value={borrador.contenido}
                      onChange={(ev) =>
                        setBorrador((b) => ({ ...b, contenido: ev.target.value }))
                      }
                      rows={18}
                      autoFocus
                      className="w-full resize-y rounded-md border border-border bg-background/60 p-3 font-mono text-xs leading-relaxed outline-none focus:border-primary/50"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => guardarEdicion(e.id)}>
                        <Check className="size-3.5" /> Guardar cambios
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          guardarEdicion(e.id);
                          aprobar({
                            ...e,
                            titulo: borrador.titulo,
                            contenido: borrador.contenido,
                          });
                        }}
                        disabled={envio[e.id] === "enviando"}
                      >
                        Guardar y aprobar →
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditandoId(null)}
                      >
                        Cancelar
                      </Button>
                      {ediciones[e.id] ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto text-muted-foreground"
                          onClick={() => revertirEdicion(e.id)}
                        >
                          <Undo2 className="size-3.5" /> Volver al original
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {open ? (
                  <CardContent className="border-t border-border pt-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                      {conEdicion(e).contenido}
                    </pre>
                    {e.imagenUrl ? (
                      <a href={e.imagenUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.imagenUrl} alt={e.titulo} className="max-h-96 rounded-md border border-border" />
                      </a>
                    ) : null}
                    {e.videoUrl ? (
                      <p className="mt-3 text-sm">
                        <a
                          href={e.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline underline-offset-4"
                        >
                          Ver video renderizado ↗
                        </a>
                        {e.modelo ? (
                          <span className="label-mono ml-2 text-muted-foreground">
                            {e.modelo}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                    {e.angulo ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Ángulo: {e.angulo}
                      </p>
                    ) : null}
                  </CardContent>
                ) : null}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function FiltroBtn({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        activo
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

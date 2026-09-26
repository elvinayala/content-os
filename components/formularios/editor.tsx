"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Copy, ExternalLink, Eye, GripVertical, Inbox, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { guardarFormularioAction } from "@/app/pulse/(app)/formularios/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCIONES,
  type Apariencia,
  type ConfigFormulario,
  idNuevo,
  linkPublico,
  LOGOS,
  MARCAS_FORM,
  opcionesDe,
  type Pregunta,
  problemaConfig,
  slugDe,
  TEMAS,
  temaDe,
  TIPOS,
  type TipoPregunta,
} from "@/lib/formularios/reglas";

export interface FormularioEditable {
  id: string;
  titulo: string;
  slug: string;
  marca: string;
  apariencia: Apariencia;
  config: ConfigFormulario;
  accion: string;
  activo: boolean;
  total: number;
}

const selectCls = "h-9 w-full rounded-md border bg-background px-2 text-sm";
const CON_OPCIONES: TipoPregunta[] = ["opcion", "multiple"];
const CON_PLACEHOLDER: TipoPregunta[] = ["texto", "largo", "email", "telefono", "numero", "url"];

export function EditorFormulario({ inicial }: { inicial: FormularioEditable }) {
  const router = useRouter();
  const [f, setF] = useState(inicial);
  const [sel, setSel] = useState(0);
  const [pend, start] = useTransition();
  const [guardado, setGuardado] = useState(JSON.stringify(inicial));
  const sucio = JSON.stringify(f) !== guardado;
  const preguntas = f.config.preguntas;
  const p = preguntas[sel];
  const problema = useMemo(() => problemaConfig(f.config), [f.config]);
  const tema = temaDe(f.apariencia);
  const link = linkPublico(f);

  // Aviso al salir con cambios sin guardar.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (sucio) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [sucio]);

  const setConfig = (c: Partial<ConfigFormulario>) => setF((x) => ({ ...x, config: { ...x.config, ...c } }));
  const setPregunta = (i: number, cambios: Partial<Pregunta>) => setConfig({ preguntas: preguntas.map((q, k) => (k === i ? limpia({ ...q, ...cambios }) : q)) });
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= preguntas.length) return;
    const c = [...preguntas];
    [c[i], c[j]] = [c[j], c[i]];
    setConfig({ preguntas: c });
    setSel(j);
  };
  const agregar = (tipo: TipoPregunta) => {
    const id = idNuevo(preguntas.map((q) => q.id));
    const q: Pregunta = { id, titulo: "", tipo, requerida: true, ...(CON_OPCIONES.includes(tipo) ? { opciones: ["Opción 1", "Opción 2"] } : {}) };
    const c = [...preguntas];
    c.splice(sel + 1, 0, q);
    setConfig({ preguntas: c });
    setSel(sel + 1);
  };
  const duplicar = (i: number) => {
    const q = { ...preguntas[i], id: idNuevo(preguntas.map((x) => x.id)), titulo: `${preguntas[i].titulo} (copia)` };
    const c = [...preguntas];
    c.splice(i + 1, 0, q);
    setConfig({ preguntas: c });
    setSel(i + 1);
  };
  const borrar = (i: number) => {
    const q = preguntas[i];
    const dependen = preguntas.filter((x) => x.si?.id === q.id);
    if (!confirm(`¿Borrar "${q.titulo || "esta pregunta"}"?${dependen.length ? ` ${dependen.length} pregunta(s) dependen de ella y se mostrarán siempre.` : ""}`)) return;
    setConfig({ preguntas: preguntas.filter((_, k) => k !== i).map((x) => (x.si?.id === q.id ? { ...x, si: undefined } : x)) });
    setSel(Math.max(0, i - 1));
  };

  const guardar = (despues?: () => void) =>
    start(async () => {
      const r = await guardarFormularioAction(f.id, { titulo: f.titulo, slug: f.slug, marca: f.marca, apariencia: f.apariencia, config: f.config, accion: f.accion, activo: f.activo });
      if (!r.ok) return void toast.error(r.error);
      const nuevo = { ...f, slug: r.slug ?? f.slug };
      setF(nuevo);
      setGuardado(JSON.stringify(nuevo));
      toast.success("Guardado");
      router.refresh();
      despues?.();
    });
  const vistaPrevia = () => {
    const abrir = () => window.open(`/f/${f.slug}?vista=previa`, "_blank");
    if (sucio) guardar(abrir);
    else abrir();
  };

  return (
    <div className="pulse flex min-h-svh flex-col bg-background">
      <header className="vidrio sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4">
        <Button asChild variant="ghost" size="icon" aria-label="Volver">
          <Link href="/pulse/formularios">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{f.titulo || "Sin nombre"}</div>
          <div className="truncate text-xs text-muted-foreground">{link.replace(/^https:\/\//, "")}</div>
        </div>
        {sucio ? <span className="hidden text-xs text-amber-600 sm:inline">Cambios sin guardar</span> : null}
        <Button asChild variant="ghost" size="sm">
          <Link href={`/pulse/formularios/${f.id}/respuestas`}>
            <Inbox className="size-4" /> {f.total}
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            toast.success("Link copiado");
          }}
        >
          <Copy className="size-4" /> <span className="hidden sm:inline">Copiar link</span>
        </Button>
        <Button variant="outline" size="sm" onClick={vistaPrevia} disabled={pend}>
          <Eye className="size-4" /> <span className="hidden sm:inline">Vista previa</span>
        </Button>
        <Button size="sm" onClick={() => guardar()} disabled={pend || !sucio}>
          <Save className="size-4" /> Guardar
        </Button>
      </header>

      {problema ? <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-800">⚠ {problema}</div> : null}

      <Tabs defaultValue="preguntas" className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        <TabsList>
          <TabsTrigger value="preguntas">Preguntas ({preguntas.length})</TabsTrigger>
          <TabsTrigger value="pantallas">Bienvenida y final</TabsTrigger>
          <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
        </TabsList>

        <TabsContent value="preguntas" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
            <div className="flex flex-col gap-1.5">
              {preguntas.map((q, i) => (
                <button
                  key={q.id + i}
                  type="button"
                  onClick={() => setSel(i)}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition ${i === sel ? "border-primary bg-primary/5 shadow-sm" : "bg-card hover:bg-muted/60"}`}
                >
                  <GripVertical className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                  <span className="mt-px w-5 shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${q.titulo ? "" : "text-muted-foreground italic"}`}>{q.titulo || "Pregunta sin escribir"}</span>
                    <span className="mt-0.5 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                      {TIPOS[q.tipo]}
                      {q.requerida ? " · obligatoria" : ""}
                      {q.si ? ` · si ${preguntas.find((x) => x.id === q.si?.id)?.titulo.slice(0, 18) ?? "?"}… = ${q.si.valor}` : ""}
                    </span>
                  </span>
                </button>
              ))}
              <AgregarPregunta onAgregar={agregar} />
            </div>

            {p ? (
              <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold">Pregunta {sel + 1}</span>
                  <span className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => mover(sel, -1)} disabled={sel === 0} aria-label="Subir">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => mover(sel, 1)} disabled={sel === preguntas.length - 1} aria-label="Bajar">
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicar(sel)} aria-label="Duplicar">
                    <Copy className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => borrar(sel)} disabled={preguntas.length === 1} aria-label="Borrar">
                    <Trash2 className="size-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid gap-1.5">
                  <Label>Pregunta</Label>
                  <Input value={p.titulo} onChange={(e) => setPregunta(sel, { titulo: e.target.value })} placeholder="¿Cómo te llamas?" className="text-base" />
                </div>
                <div className="grid gap-1.5">
                  <Label>Texto de ayuda (opcional)</Label>
                  <Textarea value={p.ayuda ?? ""} onChange={(e) => setPregunta(sel, { ayuda: e.target.value || undefined })} rows={2} placeholder="Una línea que explique qué esperas." />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>Tipo de respuesta</Label>
                    <select className={selectCls} value={p.tipo} onChange={(e) => setPregunta(sel, { tipo: e.target.value as TipoPregunta, ...(CON_OPCIONES.includes(e.target.value as TipoPregunta) && !p.opciones?.length ? { opciones: ["Opción 1", "Opción 2"] } : {}) })}>
                      {Object.entries(TIPOS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 sm:mt-6">
                    <span className="text-sm">Obligatoria</span>
                    <Switch checked={p.requerida} onCheckedChange={(v) => setPregunta(sel, { requerida: v })} />
                  </label>
                </div>

                {CON_OPCIONES.includes(p.tipo) ? (
                  <div className="grid gap-1.5">
                    <Label>Opciones (una por línea)</Label>
                    <Textarea
                      value={(p.opciones ?? []).join("\n")}
                      onChange={(e) => setPregunta(sel, { opciones: e.target.value.split("\n") })}
                      onBlur={() => setPregunta(sel, { opciones: (p.opciones ?? []).map((o) => o.trim()).filter(Boolean) })}
                      rows={Math.min(10, Math.max(3, (p.opciones?.length ?? 0) + 1))}
                    />
                    {p.tipo === "opcion" ? (
                      <label className="mt-1 flex items-center gap-2 text-sm">
                        <Switch checked={!!p.otra} onCheckedChange={(v) => setPregunta(sel, { otra: v || undefined })} /> Permitir “Otra…” con texto libre
                      </label>
                    ) : null}
                  </div>
                ) : null}

                {CON_PLACEHOLDER.includes(p.tipo) ? (
                  <div className="grid gap-1.5">
                    <Label>Ejemplo dentro de la casilla (opcional)</Label>
                    <Input value={p.placeholder ?? ""} onChange={(e) => setPregunta(sel, { placeholder: e.target.value || undefined })} placeholder="Ej. María Rivera" />
                  </div>
                ) : null}

                <Condicion p={p} anteriores={preguntas.slice(0, sel)} onCambio={(si) => setPregunta(sel, { si })} />

                <details className="rounded-md border px-3 py-2 text-sm">
                  <summary className="cursor-pointer text-muted-foreground">Avanzado</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label>Sección (arriba de la pregunta)</Label>
                      <Input value={p.seccion ?? ""} onChange={(e) => setPregunta(sel, { seccion: e.target.value || undefined })} placeholder="Tu negocio" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Identificador</Label>
                      <Input value={p.id} onChange={(e) => setPregunta(sel, { id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })} />
                    </div>
                    {f.accion === "pulse-onboarding-lu" ? (
                      <div className="grid gap-1.5 sm:col-span-2">
                        <Label>Columna en Pulse (LEVEL UP MEDIA)</Label>
                        <Input value={p.columna ?? ""} onChange={(e) => setPregunta(sel, { columna: e.target.value || undefined })} placeholder="Vacío = va solo en el comentario de la ficha" />
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="pantallas" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Pantalla de bienvenida</h3>
              <Campo label="Etiqueta (arriba, opcional)" valor={f.config.bienvenida.etiqueta ?? ""} onCambio={(v) => setConfig({ bienvenida: { ...f.config.bienvenida, etiqueta: v || undefined } })} ph="Onboarding · 5 minutos" />
              <Campo label="Título" ayuda="Pon *entre asteriscos* la palabra que quieras resaltar con el color de la marca." valor={f.config.bienvenida.titulo} onCambio={(v) => setConfig({ bienvenida: { ...f.config.bienvenida, titulo: v } })} />
              <Campo largo label="Texto" valor={f.config.bienvenida.texto ?? ""} onCambio={(v) => setConfig({ bienvenida: { ...f.config.bienvenida, texto: v || undefined } })} />
              <div className="grid gap-1.5">
                <Label>Puntos (hasta 3, opcional)</Label>
                {[0, 1, 2].map((i) => (
                  <Input
                    key={i}
                    value={f.config.bienvenida.puntos?.[i] ?? ""}
                    onChange={(e) => {
                      const pts = [...(f.config.bienvenida.puntos ?? []), "", "", ""].slice(0, 3);
                      pts[i] = e.target.value;
                      setConfig({ bienvenida: { ...f.config.bienvenida, puntos: pts.some(Boolean) ? pts : undefined } });
                    }}
                    placeholder={`Punto ${i + 1}`}
                  />
                ))}
              </div>
              <Campo label="Botón" valor={f.config.bienvenida.boton ?? ""} onCambio={(v) => setConfig({ bienvenida: { ...f.config.bienvenida, boton: v || undefined } })} ph="Empezar" />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Pantalla final</h3>
              <Campo label="Título" ayuda="{nombre} se cambia por el primer nombre de quien respondió (si hay pregunta con id “nombre”)." valor={f.config.gracias.titulo} onCambio={(v) => setConfig({ gracias: { ...f.config.gracias, titulo: v } })} />
              <Campo largo label="Texto" valor={f.config.gracias.texto ?? ""} onCambio={(v) => setConfig({ gracias: { ...f.config.gracias, texto: v || undefined } })} />
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={!!f.config.gracias.boton}
                  onCheckedChange={(v) => setConfig({ gracias: { ...f.config.gracias, boton: v ? { texto: "Agendar mi cita", url: "" } : undefined } })}
                />
                Botón con link al final (p. ej. agendar en Calendly)
              </label>
              {f.config.gracias.boton ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo label="Texto del botón" valor={f.config.gracias.boton.texto} onCambio={(v) => setConfig({ gracias: { ...f.config.gracias, boton: { ...f.config.gracias.boton!, texto: v } } })} />
                  <Campo label="Link" valor={f.config.gracias.boton.url} onCambio={(v) => setConfig({ gracias: { ...f.config.gracias, boton: { ...f.config.gracias.boton!, url: v.trim() } } })} ph="https://calendly.com/…" />
                </div>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ajustes" className="mt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">General</h3>
              <Campo label="Nombre (solo lo ves tú y la pestaña del navegador)" valor={f.titulo} onCambio={(v) => setF({ ...f, titulo: v })} />
              <div className="grid gap-1.5">
                <Label>Link</Label>
                <div className="flex items-center rounded-md border bg-muted/40 text-sm">
                  <span className="shrink-0 pl-3 text-muted-foreground">…/f/</span>
                  <input className="h-9 min-w-0 flex-1 bg-transparent px-1 outline-none" value={f.slug} onChange={(e) => setF({ ...f, slug: slugDe(e.target.value) || e.target.value.toLowerCase() })} />
                  <a href={link} target="_blank" rel="noreferrer" className="px-3 text-muted-foreground hover:text-foreground" aria-label="Abrir">
                    <ExternalLink className="size-4" />
                  </a>
                </div>
                {inicial.slug !== f.slug && inicial.total > 0 ? <p className="text-xs text-amber-700">Ojo: el link viejo deja de funcionar para quien ya lo tenga.</p> : null}
              </div>
              <div className="grid gap-1.5">
                <Label>Marca</Label>
                <select className={selectCls} value={f.marca} onChange={(e) => setF({ ...f, marca: e.target.value })}>
                  {Object.entries(MARCAS_FORM).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
                <span>
                  <span className="block text-sm font-medium">Abierto</span>
                  <span className="text-xs text-muted-foreground">Cerrado = el link muestra “Este formulario está cerrado”.</span>
                </span>
                <Switch checked={f.activo} onCheckedChange={(v) => setF({ ...f, activo: v })} />
              </label>
              <div className="grid gap-1.5">
                <Label>Al recibir una respuesta</Label>
                <select className={selectCls} value={f.accion} onChange={(e) => setF({ ...f, accion: e.target.value })}>
                  {Object.entries(ACCIONES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="font-semibold">Apariencia</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TEMAS).map(([k, t]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setF({ ...f, apariencia: { tema: k, logo: f.apariencia.logo } })}
                    className={`overflow-hidden rounded-lg border text-left text-xs transition ${f.apariencia.tema === k ? "ring-2 ring-primary" : "hover:shadow"}`}
                  >
                    <div className="flex h-14 items-end gap-1.5 p-2" style={{ background: t.fondo }}>
                      <span className="h-2 w-10 rounded-full" style={{ background: t.texto, opacity: 0.8 }} />
                      <span className="h-4 w-8 rounded-full" style={{ background: t.acento }} />
                    </div>
                    <div className="px-2 py-1.5">{t.nombre}</div>
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Color de acento</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={tema.acento} onChange={(e) => setF({ ...f, apariencia: { ...f.apariencia, acento: e.target.value } })} className="h-9 w-12 cursor-pointer rounded border" />
                    {f.apariencia.acento ? (
                      <Button variant="ghost" size="sm" onClick={() => setF({ ...f, apariencia: { ...f.apariencia, acento: null } })}>
                        Volver al del tema
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Logo</Label>
                  <select
                    className={selectCls}
                    value={f.apariencia.logo === undefined || f.apariencia.logo === null ? "__tema" : f.apariencia.logo}
                    onChange={(e) => setF({ ...f, apariencia: { ...f.apariencia, logo: e.target.value === "__tema" ? null : e.target.value } })}
                  >
                    <option value="__tema">El del tema</option>
                    {Object.entries(LOGOS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border" style={{ background: tema.fondo, color: tema.texto }}>
                <div className="flex flex-col gap-3 p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {tema.logo ? <img src={tema.logo} alt="" className="h-8 w-fit" /> : null}
                  <span className="text-lg font-semibold">{preguntas[0]?.titulo || "Tu primera pregunta"}</span>
                  <span className="h-px w-full" style={{ background: tema.texto, opacity: 0.2 }} />
                  <span className="w-fit rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: tema.acento, color: tema.tinta }}>
                    OK ✓
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Quita campos que no aplican al tipo (para no guardar basura al cambiar de tipo). */
function limpia(q: Pregunta): Pregunta {
  const c = { ...q };
  if (!CON_OPCIONES.includes(c.tipo)) {
    delete c.opciones;
    delete c.etiquetas;
  }
  if (c.tipo !== "opcion") delete c.otra;
  if (!CON_PLACEHOLDER.includes(c.tipo)) delete c.placeholder;
  return c;
}

function Campo({ label, valor, onCambio, ph, ayuda, largo }: { label: string; valor: string; onCambio: (v: string) => void; ph?: string; ayuda?: string; largo?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {largo ? <Textarea value={valor} onChange={(e) => onCambio(e.target.value)} rows={3} placeholder={ph} /> : <Input value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={ph} />}
      {ayuda ? <p className="text-xs text-muted-foreground">{ayuda}</p> : null}
    </div>
  );
}

function AgregarPregunta({ onAgregar }: { onAgregar: (t: TipoPregunta) => void }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto)
    return (
      <Button variant="outline" className="mt-1 justify-start border-dashed" onClick={() => setAbierto(true)}>
        <Plus className="size-4" /> Agregar pregunta
      </Button>
    );
  return (
    <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-lg border border-dashed p-2">
      {Object.entries(TIPOS).map(([k, v]) => (
        <button
          key={k}
          type="button"
          onClick={() => {
            onAgregar(k as TipoPregunta);
            setAbierto(false);
          }}
          className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function Condicion({ p, anteriores, onCambio }: { p: Pregunta; anteriores: Pregunta[]; onCambio: (si: Pregunta["si"]) => void }) {
  const candidatas = anteriores.filter((q) => ["opcion", "multiple", "si-no", "escala"].includes(q.tipo));
  const base = candidatas.find((q) => q.id === p.si?.id);
  if (!candidatas.length && !p.si) return null;
  return (
    <div className="grid gap-1.5">
      <Label>Mostrar esta pregunta</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          className={selectCls}
          value={p.si?.id ?? ""}
          onChange={(e) => {
            const q = candidatas.find((x) => x.id === e.target.value);
            onCambio(q ? { id: q.id, valor: opcionesDe(q)[0] ?? "" } : undefined);
          }}
        >
          <option value="">Siempre</option>
          {candidatas.map((q) => (
            <option key={q.id} value={q.id}>
              Solo si «{q.titulo.slice(0, 40)}» es…
            </option>
          ))}
        </select>
        {base ? (
          <select className={selectCls} value={p.si?.valor ?? ""} onChange={(e) => onCambio({ id: base.id, valor: e.target.value })}>
            {opcionesDe(base).map((o) => (
              <option key={o} value={o}>
                {base.etiquetas?.[o] ?? o}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

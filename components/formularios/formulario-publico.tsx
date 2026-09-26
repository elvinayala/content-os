"use client";

import { ArrowLeft, ArrowRight, Check, ExternalLink, Loader2 } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { conNombre, type ConfigFormulario, errorDe, opcionesDe, type Pregunta, type Respuestas, type Tema, verOpcion, visible } from "@/lib/formularios/reglas";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function nuevoToken(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

/** "*Level Up*" en un título → en el color de acento. */
function Resaltado({ t }: { t: string }) {
  return (
    <>
      {t.split(/(\*[^*]+\*)/g).map((x, i) =>
        x.startsWith("*") && x.endsWith("*") && x.length > 2 ? (
          <span key={i} className="f-acento">
            {x.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{x}</Fragment>
        ),
      )}
    </>
  );
}

// Formulario público de una pregunta por pantalla (el "Typeform" de la casa). `previa` = vista
// previa del editor: no guarda nada ni envía.
export function FormularioPublico({ slug, config, tema, previa = false, origen }: { slug: string; config: ConfigFormulario; tema: Tema; previa?: boolean; origen?: string }) {
  const BORRADOR = `formulario-borrador:${slug}`;
  const [r, setR] = useState<Respuestas>({});
  const [paso, setPaso] = useState(0); // 0 = bienvenida; 1..n = preguntas; n+1 = final
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [token, setToken] = useState("");
  const [trampa, setTrampa] = useState("");
  const [dir, setDir] = useState<1 | -1>(1);

  // Borrador: si cierra la pestaña, sigue donde iba (el onboarding hereda el borrador de su versión anterior).
  useEffect(() => {
    if (previa) return setToken(nuevoToken());
    try {
      const raw = localStorage.getItem(BORRADOR) ?? (slug === "onboarding-level-up" ? localStorage.getItem("lu-onboarding-borrador") : null);
      if (raw) {
        const b = JSON.parse(raw) as { r: Respuestas; token: string };
        setR(b.r ?? {});
        setToken(b.token || nuevoToken());
        return;
      }
    } catch {}
    setToken(nuevoToken());
  }, [BORRADOR, slug, previa]);
  useEffect(() => {
    if (!token || previa) return;
    try {
      localStorage.setItem(BORRADOR, JSON.stringify({ r, token }));
    } catch {}
  }, [r, token, BORRADOR, previa]);

  const preguntas = useMemo(() => config.preguntas.filter((p) => visible(p, r)), [config.preguntas, r]);
  const total = preguntas.length;
  const actual: Pregunta | undefined = paso >= 1 && paso <= total ? preguntas[paso - 1] : undefined;
  const terminado = paso > total;

  const set = (id: string, v: Respuestas[string]) => {
    setError(null);
    setR((x) => ({ ...x, [id]: v }));
  };

  const enviar = useCallback(async () => {
    if (previa) {
      setDir(1);
      return setPaso(total + 1);
    }
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`/api/f/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, respuestas: r, empresa_web: trampa, origen }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        if (j.errores) {
          const primera = preguntas.findIndex((p) => j.errores[p.id]);
          if (primera >= 0) {
            setPaso(primera + 1);
            setError(j.errores[preguntas[primera].id]);
            return;
          }
        }
        setError(j.error ?? "No pudimos enviar. Revisa tu conexión e intenta otra vez.");
        return;
      }
      try {
        localStorage.removeItem(BORRADOR);
        if (slug === "onboarding-level-up") localStorage.removeItem("lu-onboarding-borrador");
      } catch {}
      setDir(1);
      setPaso(total + 1);
    } catch {
      setError("No pudimos enviar. Revisa tu conexión e intenta otra vez.");
    } finally {
      setEnviando(false);
    }
  }, [previa, slug, token, r, trampa, origen, preguntas, total, BORRADOR]);

  const siguiente = useCallback(
    (respuestasActuales?: Respuestas) => {
      const estado = respuestasActuales ?? r;
      if (actual) {
        const e = errorDe(actual, estado);
        if (e) return setError(e);
      }
      setError(null);
      setDir(1);
      // La última visible puede cambiar según la respuesta (condiciones): se recalcula.
      const vis = config.preguntas.filter((p) => visible(p, estado));
      if (paso >= vis.length) return void enviar();
      setPaso((p) => p + 1);
    },
    [actual, r, paso, config.preguntas, enviar],
  );
  const atras = () => {
    setError(null);
    setDir(-1);
    setPaso((p) => Math.max(0, p - 1));
  };

  const progreso = terminado ? 100 : paso === 0 ? 0 : Math.round(((paso - 1) / total) * 100);
  const estilo = { "--f-fondo": tema.fondo, "--f-texto": tema.texto, "--f-sutil": tema.sutil, "--f-acento": tema.acento, "--f-tinta": tema.tinta } as React.CSSProperties;

  return (
    <main className="formulario lu-fondo relative flex min-h-svh flex-col" data-oscuro={tema.oscuro} style={estilo}>
      <div className="fixed inset-x-0 top-0 z-20 h-1" style={{ background: "color-mix(in srgb, var(--f-texto) 6%, transparent)" }}>
        <div className="h-full transition-[width] duration-500 ease-out" style={{ width: `${progreso}%`, background: "var(--f-acento)" }} />
      </div>

      {previa ? (
        <div className="fixed top-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white shadow">Vista previa · no se guarda nada</div>
      ) : null}

      <header className="flex items-center justify-between px-5 pt-6 sm:px-10">
        {tema.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tema.logo} alt="" className="h-12 w-auto sm:h-14" />
        ) : (
          <span />
        )}
        {actual ? (
          <span className="f-sutil text-xs font-medium tracking-[0.18em] uppercase">
            {paso} de {total}
          </span>
        ) : null}
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div key={paso} className={dir === 1 ? "lu-entra" : "lu-entra-atras"}>
          {paso === 0 ? (
            <Bienvenida
              config={config}
              onEmpezar={() => {
                setDir(1);
                // Si viene de un borrador, salta a la primera pregunta que le falta.
                const falta = preguntas.findIndex((p) => errorDe(p, r) || r[p.id] === undefined);
                setPaso(falta >= 0 ? falta + 1 : total);
              }}
              continuar={Object.keys(r).length > 0}
            />
          ) : null}

          {actual ? (
            <PreguntaVista
              p={actual}
              numero={paso}
              valor={r[actual.id]}
              onCambio={(v) => set(actual.id, v)}
              onSiguiente={siguiente}
              respuestas={r}
              error={error}
              ultima={paso === total}
              enviando={enviando}
            />
          ) : null}

          {terminado ? <Final config={config} r={r} /> : null}
        </div>
      </section>

      {actual ? (
        <footer className="flex items-center justify-between px-5 pb-6 sm:px-10">
          <button type="button" onClick={atras} className="f-sutil flex items-center gap-2 rounded-full px-3 py-2 text-sm transition hover:opacity-80">
            <ArrowLeft className="size-4" /> Atrás
          </button>
          <span className="f-tenue hidden text-xs sm:block">Tus respuestas se guardan en este dispositivo mientras llenas el formulario.</span>
        </footer>
      ) : null}

      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={trampa} onChange={(e) => setTrampa(e.target.value)} name="empresa_web" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
    </main>
  );
}

function Bienvenida({ config, onEmpezar, continuar }: { config: ConfigFormulario; onEmpezar: () => void; continuar: boolean }) {
  const b = config.bienvenida;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Enter" && onEmpezar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onEmpezar]);
  return (
    <div className="flex flex-col gap-6">
      {b.etiqueta ? <span className="lu-chip">{b.etiqueta}</span> : null}
      <h1 className="font-[family-name:var(--font-sora)] text-4xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
        <Resaltado t={b.titulo} />
      </h1>
      {b.texto ? <p className="f-sutil max-w-xl text-lg leading-relaxed whitespace-pre-line">{b.texto}</p> : null}
      {b.puntos?.filter(Boolean).length ? (
        <ul className="f-sutil grid gap-2 text-sm sm:grid-cols-3">
          {b.puntos.filter(Boolean).map((t, i) => (
            <li key={t} className="lu-tarjeta flex items-center gap-2 px-3 py-2.5">
              <span className="lu-numero size-6 shrink-0 text-xs">{i + 1}</span>
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={onEmpezar} className="lu-boton">
          {continuar ? "Continuar donde iba" : b.boton || "Empezar"} <ArrowRight className="size-5" />
        </button>
        <span className="f-tenue hidden text-sm sm:inline">
          o presiona <kbd className="rounded border border-current/30 px-1.5 py-0.5 text-xs">Enter ↵</kbd>
        </span>
      </div>
    </div>
  );
}

function Final({ config, r }: { config: ConfigFormulario; r: Respuestas }) {
  const g = config.gracias;
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="lu-numero size-16 rounded-2xl" style={{ boxShadow: "0 20px 60px -15px color-mix(in srgb, var(--f-acento) 60%, transparent)" }}>
        <Check className="size-9" strokeWidth={3} />
      </div>
      <h1 className="font-[family-name:var(--font-sora)] text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
        <Resaltado t={conNombre(g.titulo, r)} />
      </h1>
      {g.texto ? <p className="f-sutil max-w-xl text-lg leading-relaxed whitespace-pre-line">{conNombre(g.texto, r)}</p> : null}
      {g.boton?.url ? (
        <a href={g.boton.url} target="_blank" rel="noopener noreferrer" className="lu-boton">
          {g.boton.texto} <ExternalLink className="size-5" />
        </a>
      ) : (
        <p className="f-tenue text-sm">Ya puedes cerrar esta página.</p>
      )}
    </div>
  );
}

function PreguntaVista({
  p,
  numero,
  valor,
  onCambio,
  onSiguiente,
  respuestas,
  error,
  ultima,
  enviando,
}: {
  p: Pregunta;
  numero: number;
  valor: Respuestas[string];
  onCambio: (v: Respuestas[string]) => void;
  onSiguiente: (r?: Respuestas) => void;
  respuestas: Respuestas;
  error: string | null;
  ultima: boolean;
  enviando: boolean;
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, [p.id]);

  const unica = p.tipo === "opcion" || p.tipo === "si-no" || p.tipo === "escala";
  const opciones = opcionesDe(p);

  // Opción única: elegir avanza solo.
  const elegir = (op: string) => {
    onCambio(op);
    setTimeout(() => onSiguiente({ ...respuestas, [p.id]: op }), 220);
  };

  // Letras (o números en la escala) como atajo.
  useEffect(() => {
    if ((!unica && p.tipo !== "multiple") || opciones.length > 12) return;
    const k = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const op = p.tipo === "escala" ? opciones.find((o) => o === e.key) : opciones[LETRAS.indexOf(e.key.toUpperCase())];
      if (!op) {
        if (e.key === "Enter" && p.tipo === "multiple") onSiguiente();
        return;
      }
      if (unica) elegir(op);
      else {
        const lista = Array.isArray(valor) ? valor : [];
        onCambio(lista.includes(op) ? lista.filter((x) => x !== op) : [...lista, op]);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, valor]);

  const s = typeof valor === "string" ? valor : "";

  return (
    <div className="flex flex-col gap-5">
      {p.seccion ? <span className="f-acento text-xs font-semibold tracking-[0.18em] uppercase">{p.seccion}</span> : null}
      <h2 className="flex gap-3 font-[family-name:var(--font-sora)] text-2xl leading-snug font-semibold sm:text-4xl">
        <span className="f-acento mt-1 flex shrink-0 items-center gap-1 text-base font-medium sm:mt-2 sm:text-lg">
          {numero} <ArrowRight className="size-4" />
        </span>
        <span>
          {p.titulo}
          {p.requerida ? <span className="f-acento"> *</span> : null}
        </span>
      </h2>
      {p.ayuda ? <p className="f-sutil -mt-2 text-base sm:pl-10">{p.ayuda}</p> : null}

      <div className="sm:pl-10">
        {p.tipo === "largo" ? (
          <textarea
            ref={ref}
            value={s}
            rows={3}
            placeholder={p.placeholder}
            onChange={(e) => onCambio(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSiguiente();
              }
            }}
            className="lu-input min-h-28 resize-none"
          />
        ) : p.tipo === "escala" ? (
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
            {opciones.map((op) => (
              <button key={op} type="button" onClick={() => elegir(op)} className="lu-opcion lu-escala" data-on={s === op}>
                {op}
              </button>
            ))}
            <div className="f-tenue col-span-full flex justify-between text-xs">
              <span>0 · Nada probable</span>
              <span>10 · Muy probable</span>
            </div>
          </div>
        ) : unica ? (
          <Opciones p={p} opciones={opciones} valor={s} onElegir={elegir} onOtra={(t) => onCambio(t)} onSiguiente={onSiguiente} />
        ) : p.tipo === "multiple" ? (
          <div className="flex flex-col gap-2">
            {opciones.map((op, i) => {
              const lista = Array.isArray(valor) ? valor : [];
              const on = lista.includes(op);
              return (
                <button key={op} type="button" onClick={() => onCambio(on ? lista.filter((x) => x !== op) : [...lista, op])} className="lu-opcion" data-on={on}>
                  <span className="lu-letra">{LETRAS[i]}</span>
                  <span className="flex-1 text-left">{verOpcion(p, op)}</span>
                  {on ? <Check className="f-acento size-5" /> : null}
                </button>
              );
            })}
          </div>
        ) : p.tipo === "redes" ? (
          <Redes valor={(valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {}) as Record<string, string>} onCambio={onCambio} onSiguiente={onSiguiente} />
        ) : (
          <input
            ref={ref}
            value={s}
            inputMode={p.tipo === "telefono" ? "tel" : p.tipo === "numero" ? "decimal" : p.tipo === "email" ? "email" : p.tipo === "url" ? "url" : "text"}
            type={p.tipo === "email" ? "email" : p.tipo === "telefono" ? "tel" : "text"}
            autoComplete={p.id === "nombre" ? "name" : p.tipo === "email" ? "email" : p.tipo === "telefono" ? "tel" : p.id === "negocio" ? "organization" : "off"}
            placeholder={p.placeholder}
            onChange={(e) => onCambio(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSiguiente();
              }
            }}
            className="lu-input"
          />
        )}

        {error ? (
          <p role="alert" className="mt-4 flex w-fit items-center gap-2 rounded-md bg-[#ff5a4e]/15 px-3 py-1.5 text-sm text-[#e5483d]">
            ⚠ {error}
          </p>
        ) : null}

        {!unica ? (
          <div className="mt-6 flex items-center gap-4">
            <button type="button" onClick={() => onSiguiente()} disabled={enviando} className="lu-boton">
              {enviando ? <Loader2 className="size-5 animate-spin" /> : null}
              {ultima ? (enviando ? "Enviando…" : "Enviar") : "OK"} {!enviando ? <Check className="size-5" /> : null}
            </button>
            <span className="f-tenue hidden text-sm sm:block">{p.tipo === "largo" ? "⌘/Ctrl + Enter ↵" : "o presiona Enter ↵"}</span>
          </div>
        ) : ultima && s ? (
          <div className="mt-6">
            <button type="button" onClick={() => onSiguiente()} disabled={enviando} className="lu-boton">
              {enviando ? <Loader2 className="size-5 animate-spin" /> : null}
              {enviando ? "Enviando…" : "Enviar"} {!enviando ? <Check className="size-5" /> : null}
            </button>
          </div>
        ) : null}
        {!p.requerida && !unica ? <p className="f-tenue mt-3 text-xs">Opcional: puedes seguir sin responder.</p> : null}
      </div>
    </div>
  );
}

function Opciones({ p, opciones, valor, onElegir, onOtra, onSiguiente }: { p: Pregunta; opciones: string[]; valor: string; onElegir: (op: string) => void; onOtra: (t: string) => void; onSiguiente: () => void }) {
  const muchas = opciones.length > 12;
  const [filtro, setFiltro] = useState("");
  const [otra, setOtra] = useState(valor.startsWith("Otra:") ? valor.slice(5).trim() : "");
  const [modoOtra, setModoOtra] = useState(valor.startsWith("Otra:"));
  const lista = opciones.filter((o) => !filtro || verOpcion(p, o).toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      {muchas ? <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Busca…" className="lu-input text-lg" autoFocus /> : null}
      <div className={muchas ? "grid max-h-[46vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" : p.tipo === "si-no" ? "grid max-w-md grid-cols-2 gap-2" : "flex flex-col gap-2"}>
        {lista.map((op, i) => (
          <button key={op} type="button" onClick={() => onElegir(op)} className="lu-opcion" data-on={valor === op}>
            {!muchas ? <span className="lu-letra">{LETRAS[i]}</span> : null}
            <span className="flex-1 text-left">{verOpcion(p, op)}</span>
            {valor === op ? <Check className="f-acento size-5" /> : null}
          </button>
        ))}
        {p.otra ? (
          <button type="button" onClick={() => setModoOtra(true)} className="lu-opcion" data-on={modoOtra}>
            <span className="flex-1 text-left">Otra…</span>
          </button>
        ) : null}
      </div>
      {modoOtra ? (
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={otra}
            placeholder="¿Cuál?"
            onChange={(e) => {
              setOtra(e.target.value);
              onOtra(`Otra: ${e.target.value}`);
            }}
            onKeyDown={(e) => e.key === "Enter" && onSiguiente()}
            className="lu-input"
          />
          <button type="button" onClick={() => onSiguiente()} className="lu-boton w-fit">
            OK <Check className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Redes({ valor, onCambio, onSiguiente }: { valor: Record<string, string>; onCambio: (v: Record<string, string>) => void; onSiguiente: () => void }) {
  const campos = [
    ["Instagram", "@tunegocio"],
    ["Facebook", "facebook.com/tunegocio"],
    ["Página web", "tunegocio.com"],
    ["TikTok", "@tunegocio"],
  ] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.map(([k, ph], i) => (
        <label key={k} className="flex flex-col gap-1.5">
          <span className="f-sutil text-xs font-medium tracking-wide uppercase">{k}</span>
          <input
            autoFocus={i === 0}
            value={valor[k] ?? ""}
            placeholder={ph}
            onChange={(e) => onCambio({ ...valor, [k]: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && onSiguiente()}
            className="lu-input text-xl"
          />
        </label>
      ))}
    </div>
  );
}

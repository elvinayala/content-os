"use client";

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { errorDe, PREGUNTAS, type Pregunta, type Respuestas, verOpcion, visible } from "@/lib/onboarding/level-up";

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const BORRADOR = "lu-onboarding-borrador";

function nuevoToken(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function FormularioLevelUp() {
  const [r, setR] = useState<Respuestas>({});
  const [paso, setPaso] = useState(0); // 0 = bienvenida; 1..n = preguntas; n+1 = gracias
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [token, setToken] = useState("");
  const [trampa, setTrampa] = useState("");
  const [dir, setDir] = useState<1 | -1>(1);

  // Borrador: si cierra la pestaña, sigue donde iba.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BORRADOR);
      if (raw) {
        const b = JSON.parse(raw) as { r: Respuestas; token: string };
        setR(b.r ?? {});
        setToken(b.token || nuevoToken());
        return;
      }
    } catch {}
    setToken(nuevoToken());
  }, []);
  useEffect(() => {
    if (!token) return;
    try {
      localStorage.setItem(BORRADOR, JSON.stringify({ r, token }));
    } catch {}
  }, [r, token]);

  const preguntas = useMemo(() => PREGUNTAS.filter((p) => visible(p, r)), [r]);
  const total = preguntas.length;
  const actual: Pregunta | undefined = paso >= 1 && paso <= total ? preguntas[paso - 1] : undefined;
  const terminado = paso > total;

  const set = (id: string, v: Respuestas[string]) => {
    setError(null);
    setR((x) => ({ ...x, [id]: v }));
  };

  const enviar = useCallback(async () => {
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/level-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, respuestas: r, empresa_web: trampa }),
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
      } catch {}
      setDir(1);
      setPaso(total + 1);
    } catch {
      setError("No pudimos enviar. Revisa tu conexión e intenta otra vez.");
    } finally {
      setEnviando(false);
    }
  }, [token, r, trampa, preguntas, total]);

  const siguiente = useCallback(
    (respuestasActuales?: Respuestas) => {
      const estado = respuestasActuales ?? r;
      if (actual) {
        const e = errorDe(actual, estado);
        if (e) return setError(e);
      }
      setError(null);
      setDir(1);
      if (paso === total) return void enviar();
      setPaso((p) => p + 1);
    },
    [actual, r, paso, total, enviar],
  );
  const atras = () => {
    setError(null);
    setDir(-1);
    setPaso((p) => Math.max(0, p - 1));
  };

  const progreso = terminado ? 100 : paso === 0 ? 0 : Math.round(((paso - 1) / total) * 100);

  return (
    <main className="lu-fondo relative flex min-h-svh flex-col text-[#f5f1e8]">
      {/* barra de progreso */}
      <div className="fixed inset-x-0 top-0 z-20 h-1 bg-white/5">
        <div className="h-full bg-[#f5ce1a] transition-[width] duration-500 ease-out" style={{ width: `${progreso}%` }} />
      </div>

      <header className="flex items-center justify-between px-5 pt-6 sm:px-10">
        <Image src="/marcas/level-up-logo-dark.png" alt="Level Up Media" width={160} height={116} priority className="h-14 w-auto" />
        {actual ? (
          <span className="text-xs font-medium tracking-[0.18em] text-[#a3a3a3] uppercase">
            {paso} de {total}
          </span>
        ) : null}
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div key={paso} className={dir === 1 ? "lu-entra" : "lu-entra-atras"}>
          {paso === 0 ? (
            <Bienvenida
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

          {terminado ? <Gracias nombre={String(r.nombre ?? "").split(" ")[0]} /> : null}
        </div>
      </section>

      {actual ? (
        <footer className="flex items-center justify-between px-5 pb-6 sm:px-10">
          <button type="button" onClick={atras} className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[#a3a3a3] transition hover:bg-white/5 hover:text-[#f5f1e8]">
            <ArrowLeft className="size-4" /> Atrás
          </button>
          <span className="hidden text-xs text-[#6b6b6b] sm:block">
            Tus respuestas se guardan en este dispositivo mientras llenas el formulario.
          </span>
        </footer>
      ) : null}

      {/* trampa para bots: invisible para personas */}
      <input tabIndex={-1} autoComplete="off" aria-hidden="true" value={trampa} onChange={(e) => setTrampa(e.target.value)} name="empresa_web" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
    </main>
  );
}

function Bienvenida({ onEmpezar, continuar }: { onEmpezar: () => void; continuar: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Enter" && onEmpezar();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onEmpezar]);
  return (
    <div className="flex flex-col gap-6">
      <span className="w-fit rounded-full border border-[#f5ce1a]/30 bg-[#f5ce1a]/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#f5ce1a] uppercase">Onboarding · 5 minutos</span>
      <h1 className="font-[family-name:var(--font-sora)] text-4xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
        Bienvenido a <span className="text-[#f5ce1a]">Level Up</span>.<br />
        Vamos a preparar tu campaña.
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-[#bdbab2]">
        Con estas respuestas tu estratega arma los anuncios, el público y el presupuesto. Mientras más claro seas, más rápido salimos al aire.
      </p>
      <ul className="grid gap-2 text-sm text-[#a3a3a3] sm:grid-cols-3">
        {["Tu negocio y lo que vendes", "Tu cliente ideal y tus metas", "Accesos y contenido"].map((t, i) => (
          <li key={t} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f5ce1a] text-xs font-bold text-[#0b0b0b]">{i + 1}</span>
            {t}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={onEmpezar} className="lu-boton">
          {continuar ? "Continuar donde iba" : "Empezar"} <ArrowRight className="size-5" />
        </button>
        <span className="hidden text-sm text-[#6b6b6b] sm:inline">
          o presiona <kbd className="rounded border border-white/15 px-1.5 py-0.5 text-xs">Enter ↵</kbd>
        </span>
      </div>
    </div>
  );
}

function Gracias({ nombre }: { nombre: string }) {
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-[#f5ce1a] text-[#0b0b0b] shadow-[0_20px_60px_-15px_rgba(245,206,26,0.6)]">
        <Check className="size-9" strokeWidth={3} />
      </div>
      <h1 className="font-[family-name:var(--font-sora)] text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
        ¡Listo{nombre ? `, ${nombre}` : ""}! 🚀
      </h1>
      <p className="max-w-xl text-lg leading-relaxed text-[#bdbab2]">
        Tu equipo de Level Up ya tiene toda la información. En las próximas <b className="text-[#f5f1e8]">24 horas</b> te escribimos por WhatsApp para coordinar los accesos y el arranque de tu campaña.
      </p>
      <p className="text-sm text-[#6b6b6b]">Ya puedes cerrar esta página.</p>
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

  // Opción única: elegir avanza solo.
  const elegir = (op: string) => {
    onCambio(op);
    setTimeout(() => onSiguiente({ ...respuestas, [p.id]: op }), 220);
  };

  // Letras como atajo en preguntas de opciones cortas.
  useEffect(() => {
    if ((p.tipo !== "opcion" && p.tipo !== "multiple") || (p.opciones?.length ?? 0) > 12) return;
    const k = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const i = LETRAS.indexOf(e.key.toUpperCase());
      const op = p.opciones?.[i];
      if (!op) {
        if (e.key === "Enter" && p.tipo === "multiple") onSiguiente();
        return;
      }
      if (p.tipo === "opcion") elegir(op);
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
      <span className="text-xs font-semibold tracking-[0.18em] text-[#f5ce1a] uppercase">{p.seccion}</span>
      <h2 className="flex gap-3 font-[family-name:var(--font-sora)] text-2xl leading-snug font-semibold sm:text-4xl">
        <span className="mt-1 flex shrink-0 items-center gap-1 text-base font-medium text-[#f5ce1a] sm:mt-2 sm:text-lg">
          {numero} <ArrowRight className="size-4" />
        </span>
        <span>
          {p.titulo}
          {p.requerida ? <span className="text-[#f5ce1a]"> *</span> : null}
        </span>
      </h2>
      {p.ayuda ? <p className="-mt-2 text-base text-[#a3a3a3] sm:pl-10">{p.ayuda}</p> : null}

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
        ) : p.tipo === "opcion" ? (
          <Opciones p={p} valor={s} onElegir={elegir} onOtra={(t) => onCambio(t)} onSiguiente={onSiguiente} />
        ) : p.tipo === "multiple" ? (
          <div className="flex flex-col gap-2">
            {p.opciones?.map((op, i) => {
              const lista = Array.isArray(valor) ? valor : [];
              const on = lista.includes(op);
              return (
                <button key={op} type="button" onClick={() => onCambio(on ? lista.filter((x) => x !== op) : [...lista, op])} className="lu-opcion" data-on={on}>
                  <span className="lu-letra">{LETRAS[i]}</span>
                  <span className="flex-1 text-left">{op}</span>
                  {on ? <Check className="size-5 text-[#f5ce1a]" /> : null}
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
          <p role="alert" className="mt-4 flex w-fit items-center gap-2 rounded-md bg-[#ff5a4e]/15 px-3 py-1.5 text-sm text-[#ff8a80]">
            ⚠ {error}
          </p>
        ) : null}

        {p.tipo !== "opcion" ? (
          <div className="mt-6 flex items-center gap-4">
            <button type="button" onClick={() => onSiguiente()} disabled={enviando} className="lu-boton">
              {enviando ? <Loader2 className="size-5 animate-spin" /> : null}
              {ultima ? (enviando ? "Enviando…" : "Enviar") : "OK"} {!enviando ? <Check className="size-5" /> : null}
            </button>
            <span className="hidden text-sm text-[#6b6b6b] sm:block">
              {p.tipo === "largo" ? "⌘/Ctrl + Enter ↵" : "o presiona Enter ↵"}
            </span>
          </div>
        ) : null}
        {!p.requerida && p.tipo !== "opcion" ? <p className="mt-3 text-xs text-[#6b6b6b]">Opcional: puedes seguir sin responder.</p> : null}
      </div>
    </div>
  );
}

function Opciones({ p, valor, onElegir, onOtra, onSiguiente }: { p: Pregunta; valor: string; onElegir: (op: string) => void; onOtra: (t: string) => void; onSiguiente: () => void }) {
  const muchas = (p.opciones?.length ?? 0) > 12;
  const [filtro, setFiltro] = useState("");
  const [otra, setOtra] = useState(valor.startsWith("Otra:") ? valor.slice(5).trim() : "");
  const [modoOtra, setModoOtra] = useState(valor.startsWith("Otra:"));
  const lista = (p.opciones ?? []).filter((o) => !filtro || verOpcion(o).toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="flex flex-col gap-3">
      {muchas ? <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Busca tu industria…" className="lu-input text-lg" autoFocus /> : null}
      <div className={muchas ? "grid max-h-[46vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" : "flex flex-col gap-2"}>
        {lista.map((op, i) => (
          <button key={op} type="button" onClick={() => onElegir(op)} className="lu-opcion" data-on={valor === op}>
            {!muchas ? <span className="lu-letra">{LETRAS[i]}</span> : null}
            <span className="flex-1 text-left">{verOpcion(op)}</span>
            {valor === op ? <Check className="size-5 text-[#f5ce1a]" /> : null}
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
          <span className="text-xs font-medium tracking-wide text-[#a3a3a3] uppercase">{k}</span>
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

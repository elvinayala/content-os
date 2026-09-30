"use client";

import { Bell, BellOff, CheckCircle2, Download, ExternalLink, Loader2, Share, SquarePlus, Smartphone, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// La app de Ritmo en el teléfono, sin App Store ni Play Store (PWA + Web Push, 29/sep).
//  <RegistrarApp />       → en el layout: registra el service worker y guarda el "Instalar" de Android.
//  <AppMovil tarjeta />   → en Hoy: aparece solo en el teléfono mientras falte instalar o activar avisos.
//  <AppMovil />           → en /ritmo/app: todos los pasos, prueba y desactivar.

type Plataforma = "ios" | "android" | "escritorio";
type Estado = {
  listo: boolean;
  plataforma: Plataforma;
  instalada: boolean;
  dentroDeOtraApp: boolean; // WhatsApp, Instagram, Slack… (no instalan ni dan push)
  iosSinSafari: boolean; // Chrome/Firefox en iPhone: instalar solo desde Safari
  soporta: boolean;
  permiso: NotificationPermission | "sin-soporte";
  suscrito: boolean;
  puedeInstalar: boolean; // Android: tenemos el evento para mostrar el diálogo de instalar
};

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let eventoInstalar: EventoInstalar | null = null;
const AVISO_INSTALAR = "ritmo-puede-instalar";

function claveBytes(b64: string) {
  const relleno = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function plataforma(ua: string): Plataforma {
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "escritorio";
}

const esInstalada = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

async function registro() {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration("/ritmo")) ?? navigator.serviceWorker.register("/ritmo/sw.js", { scope: "/ritmo", updateViaCache: "none" });
}

async function llamar(cuerpo: Record<string, unknown>) {
  const r = await fetch("/ritmo/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
  return (await r.json().catch(() => ({ ok: false, error: `Error ${r.status}` }))) as { ok: boolean; error?: string };
}

/** Registra el service worker en toda la app y re-sincroniza la suscripción (por si la base la perdió). */
export function RegistrarApp() {
  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault();
      eventoInstalar = e as EventoInstalar;
      window.dispatchEvent(new Event(AVISO_INSTALAR));
    };
    window.addEventListener("beforeinstallprompt", guardar);
    (async () => {
      const reg = await registro().catch(() => null);
      if (!reg || !("PushManager" in window) || Notification.permission !== "granted") return;
      const sub = await reg.pushManager.getSubscription();
      if (sub && !sessionStorage.getItem("ritmo-push-sync")) {
        await llamar({ accion: "suscribir", sub: sub.toJSON(), instalada: esInstalada() }).catch(() => null);
        sessionStorage.setItem("ritmo-push-sync", "1");
      }
    })();
    return () => window.removeEventListener("beforeinstallprompt", guardar);
  }, []);
  return null;
}

function useEstadoApp() {
  const [e, setE] = useState<Estado>({ listo: false, plataforma: "escritorio", instalada: false, dentroDeOtraApp: false, iosSinSafari: false, soporta: false, permiso: "sin-soporte", suscrito: false, puedeInstalar: false });
  const leer = useCallback(async () => {
    const ua = navigator.userAgent;
    const soporta = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    let suscrito = false;
    if (soporta) {
      const reg = await navigator.serviceWorker.getRegistration("/ritmo").catch(() => undefined);
      suscrito = !!(await reg?.pushManager.getSubscription().catch(() => null));
    }
    setE({
      listo: true,
      plataforma: plataforma(ua),
      instalada: esInstalada(),
      dentroDeOtraApp: /FBAN|FBAV|Instagram|WhatsApp|Slack|Line\/|Messenger|TikTok|Snapchat|GSA\//.test(ua),
      iosSinSafari: /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua),
      soporta,
      permiso: soporta ? Notification.permission : "sin-soporte",
      suscrito,
      puedeInstalar: !!eventoInstalar,
    });
  }, []);
  useEffect(() => {
    leer();
    const r = () => leer();
    window.addEventListener(AVISO_INSTALAR, r);
    window.addEventListener("appinstalled", r);
    document.addEventListener("visibilitychange", r);
    return () => {
      window.removeEventListener(AVISO_INSTALAR, r);
      window.removeEventListener("appinstalled", r);
      document.removeEventListener("visibilitychange", r);
    };
  }, [leer]);
  return [e, leer] as const;
}

export function AppMovil({ clave, tarjeta = false }: { clave: string; tarjeta?: boolean }) {
  const [e, leer] = useEstadoApp();
  const [ocupado, setOcupado] = useState<null | "activar" | "probar" | "quitar" | "instalar">(null);
  const [oculta, setOculta] = useState(true);

  useEffect(() => {
    try {
      const hasta = Number(localStorage.getItem("ritmo-app-tarjeta") || 0);
      setOculta(hasta > Date.now());
    } catch {
      setOculta(false);
    }
  }, []);

  const activar = async () => {
    setOcupado("activar");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        toast.error(permiso === "denied" ? "Bloqueaste las notificaciones. Actívalas en los ajustes del teléfono." : "No se activaron las notificaciones.");
        return;
      }
      const reg = await registro();
      await navigator.serviceWorker.ready;
      if (!reg) throw new Error("sin service worker");
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveBytes(clave) }));
      const r = await llamar({ accion: "suscribir", sub: sub.toJSON(), instalada: esInstalada() });
      if (!r.ok) throw new Error(r.error);
      toast.success("Notificaciones activadas en este teléfono");
      await llamar({ accion: "probar" });
    } catch (err) {
      toast.error(`No se pudo activar: ${err instanceof Error ? err.message : "error"}`);
    } finally {
      setOcupado(null);
      leer();
    }
  };

  const probar = async () => {
    setOcupado("probar");
    const r = await llamar({ accion: "probar" }).catch(() => ({ ok: false, error: "sin conexión" }));
    setOcupado(null);
    if (r.ok) toast.success("Enviada. Debe llegarte en unos segundos.");
    else toast.error(r.error ?? "No se pudo enviar");
  };

  const quitar = async () => {
    setOcupado("quitar");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/ritmo");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await llamar({ accion: "quitar", endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      toast.success("Notificaciones desactivadas en este teléfono");
    } finally {
      setOcupado(null);
      leer();
    }
  };

  const instalar = async () => {
    if (!eventoInstalar) return;
    setOcupado("instalar");
    await eventoInstalar.prompt();
    await eventoInstalar.userChoice.catch(() => null);
    eventoInstalar = null;
    setOcupado(null);
    leer();
  };

  if (!e.listo) return tarjeta ? null : <div className="panel h-40 animate-pulse" />;
  const activo = e.suscrito && e.permiso === "granted";
  const faltaInstalar = e.plataforma === "ios" ? !e.instalada : e.plataforma === "android" && !e.instalada && e.puedeInstalar;

  // Hoy: solo en el teléfono y solo mientras falte algo. Se puede esconder una semana.
  if (tarjeta) {
    if (e.plataforma === "escritorio" || oculta || (activo && !faltaInstalar)) return null;
    const esconder = () => {
      try {
        localStorage.setItem("ritmo-app-tarjeta", String(Date.now() + 7 * 864e5));
      } catch {}
      setOculta(true);
    };
    const titulo = e.plataforma === "ios" && !e.instalada ? "Instala Ritmo en tu iPhone" : faltaInstalar ? "Instala Ritmo en tu teléfono" : "Activa los avisos de Ritmo";
    const detalle = e.plataforma === "ios" && !e.instalada ? "Así te llegan los avisos como cualquier app. Toma 10 segundos." : faltaInstalar ? "Ábrela como una app y recibe los avisos." : "Solicitudes, recordatorio de salida y avisos de RR.HH. directo en tu teléfono.";
    return (
      <div className="panel relative flex items-center gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
          <Smartphone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{titulo}</p>
          <p className="text-[12px] text-muted-foreground">{detalle}</p>
        </div>
        {e.instalada && !activo && e.soporta ? (
          <button onClick={activar} disabled={!!ocupado} className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60">
            {ocupado === "activar" ? <Loader2 className="size-4 animate-spin" /> : "Activar"}
          </button>
        ) : (
          <Link href="/ritmo/app" className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground">
            Cómo
          </Link>
        )}
        <button onClick={esconder} aria-label="Ahora no" className="absolute top-1.5 right-1.5 rounded-full p-1 text-muted-foreground/70 hover:text-foreground">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  // /ritmo/app: la guía completa según el teléfono y en qué paso está.
  const pasos: { hecho: boolean; titulo: string; cuerpo: React.ReactNode }[] = [];
  if (e.plataforma === "ios") {
    pasos.push({
      hecho: e.instalada,
      titulo: "Agrégala a tu pantalla de inicio",
      cuerpo: e.instalada ? (
        "Estás usando Ritmo como app. 👌"
      ) : e.dentroDeOtraApp || e.iosSinSafari ? (
        <>
          Estás dentro de {e.iosSinSafari ? "otro navegador" : "otra app (WhatsApp, Instagram, Slack…)"}. En iPhone solo se instala desde <b>Safari</b>: copia el link <b>ritmo.levelupmediapr.net</b> y ábrelo en Safari.
        </>
      ) : (
        <ol className="mt-1 flex flex-col gap-1.5">
          <li className="flex items-center gap-2">
            1. Toca <Share className="inline size-4 text-primary" /> <b>Compartir</b> (abajo en Safari).
          </li>
          <li className="flex items-center gap-2">
            2. Baja y toca <SquarePlus className="inline size-4 text-primary" /> <b>Agregar a pantalla de inicio</b>.
          </li>
          <li>
            3. Toca <b>Agregar</b> y abre <b>Ritmo</b> desde el ícono nuevo.
          </li>
        </ol>
      ),
    });
  } else if (e.plataforma === "android") {
    pasos.push({
      hecho: e.instalada,
      titulo: "Instálala en tu teléfono",
      cuerpo: e.instalada ? (
        "Estás usando Ritmo como app. 👌"
      ) : e.dentroDeOtraApp ? (
        <>Estás dentro de otra app (WhatsApp, Instagram, Slack…). Ábrela en <b>Chrome</b>: menú ⋮ → Abrir en Chrome.</>
      ) : e.puedeInstalar ? (
        <button onClick={instalar} disabled={!!ocupado} className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Download className="size-4" /> Instalar Ritmo
        </button>
      ) : (
        <>En Chrome, toca el menú <b>⋮</b> → <b>Instalar app</b> (o &quot;Agregar a la pantalla principal&quot;).</>
      ),
    });
  }
  const bloqueadoPorIos = e.plataforma === "ios" && !e.instalada;
  pasos.push({
    hecho: activo,
    titulo: "Activa las notificaciones",
    cuerpo: !e.soporta ? (
      bloqueadoPorIos ? "Primero agrégala a la pantalla de inicio: en iPhone los avisos solo funcionan desde la app instalada (iOS 16.4 o más nuevo)." : "Este navegador no recibe notificaciones. Usa Chrome (Android) o Safari (iPhone)."
    ) : !clave ? (
      "Las notificaciones todavía no están configuradas en el servidor."
    ) : e.permiso === "denied" ? (
      <>Las bloqueaste. Ve a los <b>Ajustes</b> del teléfono → Notificaciones → <b>Ritmo</b> y permítelas; luego vuelve aquí.</>
    ) : activo ? (
      <span className="flex flex-wrap gap-2">
        <button onClick={probar} disabled={!!ocupado} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/30">
          {ocupado === "probar" ? <Loader2 className="size-3.5 animate-spin" /> : <Bell className="size-3.5" />} Enviar prueba
        </button>
        <button onClick={quitar} disabled={!!ocupado} className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground ring-1 ring-border hover:text-foreground">
          {ocupado === "quitar" ? <Loader2 className="size-3.5 animate-spin" /> : <BellOff className="size-3.5" />} Desactivar en este teléfono
        </button>
      </span>
    ) : (
      <button onClick={activar} disabled={!!ocupado} className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
        {ocupado === "activar" ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />} Activar notificaciones
      </button>
    ),
  });

  return (
    <div className="flex flex-col gap-3">
      {pasos.map((p, i) => (
        <div key={p.titulo} className={cn("panel flex gap-3 p-4", p.hecho && "border-primary/30")}>
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold", p.hecho ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{p.hecho ? <CheckCircle2 className="size-4" /> : i + 1}</span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">{p.titulo}</p>
            <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.cuerpo}</div>
          </div>
        </div>
      ))}
      {e.plataforma === "escritorio" ? (
        <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <ExternalLink className="size-3.5" /> En el teléfono abre <b className="text-foreground">ritmo.levelupmediapr.net</b> y sigue los pasos para tenerla como app.
        </p>
      ) : null}
    </div>
  );
}

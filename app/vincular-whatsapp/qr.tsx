"use client";

import { useEffect, useState } from "react";

// Pide un QR nuevo cada 15 s (el de WhatsApp vence rápido) hasta que el teléfono lo escanea.
export function QrWhatsapp({ e, k }: { e: string; k: string }) {
  const [estado, setEstado] = useState<"cargando" | "connecting" | "open" | "error" | "vencido">("cargando");
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    let t: ReturnType<typeof setTimeout>;
    const pedir = async () => {
      try {
        const r = await fetch(`/api/vincular-whatsapp?e=${encodeURIComponent(e)}&k=${encodeURIComponent(k)}`, { cache: "no-store" });
        if (r.status === 410) return vivo && setEstado("vencido");
        const j = (await r.json()) as { estado?: string; base64?: string | null };
        if (!vivo) return;
        if (j.estado === "open") { setEstado("open"); return; }
        setImg(j.base64 ?? null);
        setEstado(j.base64 ? "connecting" : "error");
      } catch {
        if (vivo) setEstado("error");
      }
      t = setTimeout(pedir, 15000);
    };
    pedir();
    return () => { vivo = false; clearTimeout(t); };
  }, [e, k]);

  if (estado === "open") return <p style={{ fontSize: 20 }}>✅ ¡Listo! El WhatsApp quedó vinculado. Ya puedes cerrar esta página.</p>;
  if (estado === "vencido") return <p style={{ color: "#a3a3a3" }}>Este enlace venció. Pídele uno nuevo a Nico.</p>;
  return (
    <>
      <ol style={{ textAlign: "left", color: "#d4d0c6", lineHeight: 1.6, paddingLeft: 20 }}>
        <li>En el teléfono que tiene el número <b>939-244-4237</b>, abre WhatsApp.</li>
        <li>Ve a <b>Ajustes → Dispositivos vinculados → Vincular un dispositivo</b>.</li>
        <li>Escanea este código (se renueva solo cada 15 segundos).</li>
      </ol>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, display: "inline-block", minWidth: 280, minHeight: 280 }}>
        {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="Código QR de WhatsApp" width={280} height={280} /> : <p style={{ color: "#555", paddingTop: 120 }}>{estado === "error" ? "No pude traer el código, reintentando…" : "Cargando…"}</p>}
      </div>
    </>
  );
}

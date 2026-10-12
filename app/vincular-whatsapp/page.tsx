import { enlaceValido } from "@/lib/whatsapp-qr/enlace";

import { QrWhatsapp } from "./qr";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vincular WhatsApp", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string; k?: string }> }) {
  const { e = "", k = "" } = await searchParams;
  const v = enlaceValido(e, k);
  return (
    <main style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "#0b0b0b", color: "#f5f1e8", fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, margin: "0 0 8px" }}>Vincular el WhatsApp de Level Up</h1>
        {v === "ok" ? (
          <QrWhatsapp e={e} k={k} />
        ) : (
          <p style={{ color: "#a3a3a3" }}>{v === "vencido" ? "Este enlace venció. Pídele uno nuevo a Nico." : "Enlace no válido."}</p>
        )}
      </div>
    </main>
  );
}

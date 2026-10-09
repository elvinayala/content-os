import { headers } from "next/headers";

import { FirmarContrato } from "@/components/aib-contratos/firmar";
import { contratoPorToken, marcarAbierto } from "@/lib/aib-contratos/repo";

export const dynamic = "force-dynamic";

// Contrato de AI Borinquen con firma electrónica: el cliente abre su link, completa, inicia cada hoja y firma.
export default async function ContratoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const c = await contratoPorToken(token);
  if (c?.estado === "pendiente") {
    const h = await headers();
    await marcarAbierto(c, h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "?").catch(() => null);
  }
  return (
    <FirmarContrato
      token={token}
      contrato={c && c.estado !== "anulado" ? { codigo: c.codigo, estado: c.estado, oferta: c.oferta, emitidoEn: c.emitido.en } : null}
    />
  );
}

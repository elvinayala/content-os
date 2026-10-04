/**
 * Gasto en anuncios de Meta de Resuelto en un rango de fechas, para el resumen del dueño (3/oct/2026). Cuenta publicitaria
 * de Resuelto; token largo del dueño (META_ADS_TOKEN, ~60 días: cuando se renueva en Content OS hay que copiarlo aquí).
 * Separa clientes de reclutamiento por el nombre de la campaña. Caché de 1 hora por rango.
 */
const CUENTA = process.env.META_ADS_CUENTA_RESUELTO || "act_1564735818086768";
const cache = new Map<string, { hasta: number; v: GastoAnuncios }>();

export type GastoAnuncios = { ok: true; total: number; clientes: number; reclutamiento: number; conversaciones: number; porCampana: { nombre: string; gasto: number; conversaciones: number }[] } | { ok: false; motivo: string };

export async function gastoAnuncios(desde: string, hasta: string): Promise<GastoAnuncios> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) return { ok: false, motivo: "Falta META_ADS_TOKEN en el servidor" };
  const k = `${desde}|${hasta}`, c = cache.get(k);
  if (c && c.hasta > Date.now()) return c.v;
  try {
    const u = `https://graph.facebook.com/v25.0/${CUENTA}/insights?level=campaign&fields=campaign_name,spend,actions&time_range=${encodeURIComponent(JSON.stringify({ since: desde, until: hasta }))}&limit=200&access_token=${token}`;
    const j: any = await (await fetch(u, { signal: AbortSignal.timeout(15000) })).json();
    if (j.error) return { ok: false, motivo: j.error.code === 190 ? "El token de Meta venció: hay que renovarlo" : `Meta: ${j.error.message}` };
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const porCampana = (j.data ?? []).map((x: any) => ({ nombre: String(x.campaign_name), gasto: r2(Number(x.spend) || 0), conversaciones: Number((x.actions ?? []).find((a: any) => a.action_type === "onsite_conversion.messaging_conversation_started_7d")?.value ?? 0) }))
      .sort((a: any, b: any) => b.gasto - a.gasto);
    const esReclutamiento = (n: string) => /plomero|contratista|reclut|t[eé]cnico/i.test(n);
    const sum = (xs: typeof porCampana) => r2(xs.reduce((a: number, x: any) => a + x.gasto, 0));
    const v: GastoAnuncios = { ok: true, total: sum(porCampana), clientes: sum(porCampana.filter((x: any) => !esReclutamiento(x.nombre))), reclutamiento: sum(porCampana.filter((x: any) => esReclutamiento(x.nombre))),
      conversaciones: porCampana.filter((x: any) => !esReclutamiento(x.nombre)).reduce((a: number, x: any) => a + x.conversaciones, 0), porCampana };
    cache.set(k, { hasta: Date.now() + 3600_000, v });
    return v;
  } catch (e) {
    return { ok: false, motivo: "No se pudo leer Meta ahora" };
  }
}

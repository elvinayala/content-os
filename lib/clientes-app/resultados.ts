import "server-only";

import { notificarCEO } from "../notificar-ceo";
import { esErrorDeToken, mejoresAnuncios, PERIODOS, serieDiaria, sumar, type FilaMeta, type Numeros, type Periodo } from "./resultados-reglas";

// Resultados de anuncios del cliente, directo de la Marketing API de Meta con el token del portafolio (META_ADS_TOKEN,
// el mismo que usa Max; dura ~60 días y lo renueva Elvin desde Bori). Solo LECTURA. Caché de 1 h por cuenta y periodo.

const GRAPH = `https://graph.facebook.com/${process.env.META_API_VERSION || "v25.0"}`;

export interface AnuncioTop {
  id: string;
  nombre: string;
  miniatura: string | null;
  numeros: Numeros;
}

export interface ResultadosCliente {
  estado: "ok" | "sin-cuenta" | "no-disponible";
  periodo: Periodo;
  moneda: string;
  totales: Numeros | null;
  serie: { fecha: string; inversion: number; resultados: number }[];
  anuncios: AnuncioTop[];
  actualizado: string;
}

class ErrorMeta extends Error {
  constructor(
    msg: string,
    public codigo?: number,
    public subcodigo?: number,
  ) {
    super(msg);
  }
}

async function graph<T>(ruta: string, params: Record<string, string>): Promise<T> {
  const token = process.env.META_ADS_TOKEN;
  if (!token) throw new ErrorMeta("sin token", 190);
  const url = new URL(GRAPH + ruta);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const r = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
  const j = (await r.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number; error_subcode?: number } };
  if (!r.ok || j.error) throw new ErrorMeta(j.error?.message ?? `HTTP ${r.status}`, j.error?.code, j.error?.error_subcode);
  return j;
}

const cache = new Map<string, { hasta: number; valor: ResultadosCliente }>();
let ultimoAvisoToken = "";

async function avisarToken(msg: string) {
  const hoy = new Date().toISOString().slice(0, 10);
  if (ultimoAvisoToken === hoy) return;
  ultimoAvisoToken = hoy;
  await notificarCEO(`⚠️ App de clientes: Meta no deja leer resultados (${msg.slice(0, 140)}). Probablemente venció META_ADS_TOKEN en Vercel: renuévalo desde Bori (scripts/meta-ads/token-desde-bori.mjs).`).catch(() => null);
}

export async function resultadosCliente(cuentaId: string | null, periodo: Periodo): Promise<ResultadosCliente> {
  const vacio = (estado: ResultadosCliente["estado"]): ResultadosCliente => ({ estado, periodo, moneda: "USD", totales: null, serie: [], anuncios: [], actualizado: new Date().toISOString() });
  if (!cuentaId) return vacio("sin-cuenta");
  const clave = `${cuentaId}:${periodo}`;
  const guardado = cache.get(clave);
  if (guardado && guardado.hasta > Date.now()) return guardado.valor;

  const preset = PERIODOS.find((p) => p.id === periodo)?.preset ?? "last_7d";
  const act = `/act_${cuentaId}`;
  const campos = "spend,impressions,reach,clicks,actions,action_values,purchase_roas";
  try {
    const [cuenta, total, diario, ads] = await Promise.all([
      graph<{ currency?: string }>(act, { fields: "currency" }),
      graph<{ data: FilaMeta[] }>(`${act}/insights`, { level: "account", date_preset: preset, fields: campos }),
      graph<{ data: FilaMeta[] }>(`${act}/insights`, { level: "account", date_preset: preset, time_increment: "1", fields: "spend,actions", limit: "100" }),
      graph<{ data: FilaMeta[] }>(`${act}/insights`, { level: "ad", date_preset: preset, fields: `ad_id,ad_name,${campos}`, limit: "200" }),
    ]);
    const top = mejoresAnuncios(ads.data ?? []);
    const creativos = top.length
      ? await graph<Record<string, { creative?: { thumbnail_url?: string; image_url?: string } }>>("/", { ids: top.map((a) => a.id).join(","), fields: "creative{thumbnail_url,image_url}" }).catch(() => ({}) as Record<string, { creative?: { thumbnail_url?: string; image_url?: string } }>)
      : {};
    const valor: ResultadosCliente = {
      estado: "ok",
      periodo,
      moneda: cuenta.currency ?? "USD",
      totales: (total.data ?? []).length ? sumar(total.data) : sumar([]),
      serie: serieDiaria(diario.data ?? []),
      anuncios: top.map((a) => ({ ...a, miniatura: creativos[a.id]?.creative?.image_url ?? creativos[a.id]?.creative?.thumbnail_url ?? null })),
      actualizado: new Date().toISOString(),
    };
    cache.set(clave, { hasta: Date.now() + 60 * 60_000, valor });
    return valor;
  } catch (e) {
    const err = e as ErrorMeta;
    if (esErrorDeToken(err.codigo, err.subcodigo)) await avisarToken(err.message);
    else console.error("resultados cliente", cuentaId, err.message);
    const valor = vacio("no-disponible");
    cache.set(clave, { hasta: Date.now() + 5 * 60_000, valor });
    return valor;
  }
}

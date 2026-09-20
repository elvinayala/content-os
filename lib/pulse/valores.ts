import type { SettingsColumna, TipoColumna, ValorCelda, ValorLink } from "./types";

// Normaliza y valida un valor de celda según el tipo de columna. Devuelve `null` para
// "vacío". Lanza si el valor no puede representarse en ese tipo. Compartido entre el
// cliente (antes de enviar) y las server actions (antes de guardar).
export function validarValor(
  tipo: TipoColumna,
  valor: unknown,
  settings: SettingsColumna = {},
): ValorCelda {
  if (valor === null || valor === undefined || valor === "") return null;
  switch (tipo) {
    case "text":
    case "long_text":
    case "email":
    case "phone": {
      if (typeof valor !== "string") throw new Error(`Se esperaba texto para ${tipo}`);
      const s = valor.trim();
      if (s === "") return null;
      if (tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Error("E-mail inválido");
      return s.slice(0, tipo === "long_text" ? 20000 : 2000);
    }
    case "number": {
      const n = typeof valor === "number" ? valor : Number(String(valor).replace(/[$,\s]/g, ""));
      if (!Number.isFinite(n)) throw new Error("Número inválido");
      return settings.formato === "entero" ? Math.round(n) : n;
    }
    case "date": {
      if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        throw new Error("Fecha inválida (YYYY-MM-DD)");
      }
      return valor;
    }
    case "checkbox":
      return valor === true || valor === "true";
    case "status": {
      if (typeof valor !== "string") throw new Error("Estado inválido");
      const ok = (settings.labels ?? []).some((l) => l.id === valor);
      if (!ok) throw new Error("La etiqueta no existe");
      return valor;
    }
    case "dropdown": {
      const ids = listaDeIds(valor);
      const validos = new Set((settings.labels ?? []).map((l) => l.id));
      const filtrados = ids.filter((id) => validos.has(id));
      return filtrados.length ? filtrados : null;
    }
    case "people":
    case "relation":
    case "file": {
      const ids = listaDeIds(valor);
      return ids.length ? ids : null;
    }
    case "link": {
      const v = valor as Partial<ValorLink> | string;
      const url = typeof v === "string" ? v : v?.url;
      if (!url || typeof url !== "string") return null;
      const limpio = url.trim();
      if (!limpio) return null;
      const conProtocolo = /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
      const text = typeof v === "object" && v?.text ? String(v.text).trim() : undefined;
      return text ? { url: conProtocolo, text } : { url: conProtocolo };
    }
    default:
      throw new Error(`Tipo de columna desconocido: ${tipo}`);
  }
}

function listaDeIds(valor: unknown): string[] {
  if (Array.isArray(valor)) return valor.filter((v): v is string => typeof v === "string" && v !== "");
  if (typeof valor === "string") return [valor];
  throw new Error("Se esperaba una lista");
}

// Texto plano de un valor (para buscar, ordenar y mostrar en tarjetas).
export function textoDeValor(
  tipo: TipoColumna,
  valor: ValorCelda | undefined,
  ctx: { labels?: { id: string; label: string }[]; usuarios?: { id: string; nombre: string }[]; items?: { id: string; name: string }[] } = {},
): string {
  if (valor === null || valor === undefined) return "";
  switch (tipo) {
    case "status":
      return ctx.labels?.find((l) => l.id === valor)?.label ?? "";
    case "dropdown":
      return (valor as string[]).map((id) => ctx.labels?.find((l) => l.id === id)?.label ?? "").filter(Boolean).join(", ");
    case "people":
      return (valor as string[]).map((id) => ctx.usuarios?.find((u) => u.id === id)?.nombre ?? "").filter(Boolean).join(", ");
    case "relation":
      return (valor as string[]).map((id) => ctx.items?.find((i) => i.id === id)?.name ?? "").filter(Boolean).join(", ");
    case "file":
      return (valor as string[]).length ? `${(valor as string[]).length} archivo(s)` : "";
    case "link":
      return (valor as ValorLink).text ?? (valor as ValorLink).url;
    case "checkbox":
      return valor ? "sí" : "";
    case "number":
      return String(valor);
    default:
      return String(valor);
  }
}

export function formatearNumero(n: number, formato?: SettingsColumna["formato"]): string {
  if (formato === "moneda") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
  }
  if (formato === "entero") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "tablero";
}

export function nuevoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

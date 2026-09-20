import type { ColorPulse } from "./types";

// Paleta de status/grupos (hex de Monday). Las CSS vars `--pulse-color-*` de
// app/globals.css usan estos mismos valores; acá viven para la migración y los avatares.
export const HEX_COLOR: Record<ColorPulse, string> = {
  green: "#00c875",
  bright_green: "#9cd326",
  yellow: "#ffcb00",
  orange: "#fdab3d",
  dark_orange: "#ff642e",
  red: "#e2445c",
  dark_red: "#bb3354",
  pink: "#ff158a",
  purple: "#a25ddc",
  dark_purple: "#784bd1",
  indigo: "#5559df",
  blue: "#0086c0",
  bright_blue: "#579bfc",
  dark_blue: "#225091",
  aqua: "#4eccc6",
  teal: "#175a63",
  river: "#68a1bd",
  brown: "#7f5347",
  grey: "#c4c4c4",
  dark_grey: "#808080",
};

export const COLORES: ColorPulse[] = Object.keys(HEX_COLOR) as ColorPulse[];

// Colores claros donde el texto va oscuro en vez de blanco.
export const TEXTO_OSCURO = new Set<ColorPulse>(["yellow", "grey", "bright_green", "aqua"]);

export function esColor(c: unknown): c is ColorPulse {
  return typeof c === "string" && c in HEX_COLOR;
}

export function cssColor(c: ColorPulse | null | undefined): string {
  return `var(--pulse-color-${c && esColor(c) ? c : "grey"})`;
}

// Hex (cualquier formato) → token más cercano (distancia RGB). Para la migración,
// que recibe colores de grupo como "#579bfc".
export function hexAColor(hex: string | null | undefined): ColorPulse {
  if (!hex) return "grey";
  const h = hex.replace("#", "");
  if (h.length !== 6) return "grey";
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  let mejor: ColorPulse = "grey";
  let dist = Infinity;
  for (const c of COLORES) {
    const t = HEX_COLOR[c].replace("#", "");
    const trgb = [0, 2, 4].map((i) => parseInt(t.slice(i, i + 2), 16));
    const d = rgb.reduce((s, v, i) => s + (v - trgb[i]) ** 2, 0);
    if (d < dist) {
      dist = d;
      mejor = c;
    }
  }
  return mejor;
}

// Color estable por texto (avatares de usuarios sin color asignado).
export function colorPorTexto(texto: string): ColorPulse {
  const paleta: ColorPulse[] = [
    "purple", "blue", "dark_orange", "green", "pink", "indigo", "aqua", "brown", "dark_blue", "red",
  ];
  let h = 0;
  for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return paleta[h % paleta.length];
}

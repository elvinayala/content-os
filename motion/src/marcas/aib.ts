// Marca AI Borinquen — agentes de IA de voz y chat, a la medida (NO es Bori: Bori es la agencia de
// marketing en una sola plataforma, con su coquí cobre). Paleta de las páginas de AIB
// (demos/auditorias/ai-borinquen/index.html) + colores del logo de circuitos. Fuentes: Outfit + Inter.
import { loadFont as cargarOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as cargarMono } from "@remotion/google-fonts/JetBrainsMono";

const outfit = cargarOutfit("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
const mono = cargarMono("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const FUENTE = outfit.fontFamily;
export const FUENTE_MONO = mono.fontFamily;

// Mismas claves que marcas/bori.ts para que los videos cambien de marca con un import.
export const C = {
  fondo: "#050E0A",
  superficie: "#0D1F16",
  superficie2: "#10271B",
  borde: "#1F4030",
  texto: "#E8F3EC",
  gris: "#8FB3A0",
  verde: "#2BFF88", // acento / CTA
  teal: "#1FB6A6",
  verdeClaro: "#8CFFC0",
  // colores del logo (coquí de circuitos)
  verdeLogo: "#3A8232",
  azulLogo: "#1D6BBD",
  rojoLogo: "#E53935",
  alarma: "#FF6B5E",
};

export const GRADIENTE = `linear-gradient(120deg, ${C.teal} 0%, ${C.verde} 60%, ${C.verdeClaro} 100%)`;

export const LOGO_COQUI = "marcas/aib-coqui.png"; // recorte del logo oficial (sin el nombre)

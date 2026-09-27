// Marca Bori / AI Borinquen — paleta y tipografía del kit v1
// (vault/proyectos/bori-crecimiento/marca/LEEME.txt). No inventar colores fuera de acá.
import { loadFont as cargarOnest } from "@remotion/google-fonts/Onest";
import { loadFont as cargarMono } from "@remotion/google-fonts/JetBrainsMono";

const onest = cargarOnest("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });
const mono = cargarMono("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const FUENTE = onest.fontFamily;
export const FUENTE_MONO = mono.fontFamily;

export const C = {
  fondo: "#07160F",
  superficie: "#0E2B1E",
  borde: "#1F4D36",
  texto: "#EAF5EE",
  gris: "#8FB3A0",
  verde: "#35C06F",
  teal: "#1FB6A6",
  verdeClaro: "#7BE08A",
  cobre: "#B8733A",
  cobreOscuro: "#8E5124",
  cobreSombra: "#6A3A17",
  crema: "#EAD7B2",
  oro: "#E0A93C",
  pupila: "#0A0806",
  // Solo para el "problema" (llamada perdida): el rojo no es de marca, es la alarma.
  alarma: "#FF4D4D",
};

export const GRADIENTE = `linear-gradient(120deg, ${C.teal} 0%, ${C.verde} 55%, ${C.verdeClaro} 100%)`;

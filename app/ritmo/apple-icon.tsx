import { iconoRitmo } from "./iconos/dibujo";

// Ícono del iPhone (Agregar a pantalla de inicio): 180 px sin esquinas, iOS pone las suyas.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return iconoRitmo({ px: 180, lleno: true, escala: 0.7 });
}

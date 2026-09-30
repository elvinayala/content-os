import type { ConfigApp } from "@/components/app-movil";

// La app de clientes para la pantalla común de instalar/activar avisos (components/app-movil.tsx).
export const CLIENTE_APP: ConfigApp = {
  base: "/cliente",
  nombre: "Level Up",
  clave: "lu",
  guia: "/cliente/cuenta",
  dominio: "app.levelupmediapr.net",
  avisos: "Cuando llega un archivo nuevo, avanza tu cuenta o tu equipo te avisa algo.",
};

import { PantallaCargando } from "@/components/borinquen/cargando";

// Portales cargando: la lista sale de la base, en dos columnas como la final.
export default function CargandoPortales() {
  return <PantallaCargando tarjetas={4} columnas="md:grid-cols-2" />;
}

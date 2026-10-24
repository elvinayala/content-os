import { Esqueleto, EsqueletoEncabezado, EsqueletoTarjetas } from "@/components/ritmo/esqueleto";

// Mientras el servidor arma la pestaña: esqueleto inmediato (sin esto el clic parecía no hacer nada).
// Además, con loading.tsx Next precarga el marco de cada pestaña del menú (prefetch hasta este borde).
// Las pestañas pesadas (equipo, personas, calendario, ranking, solicitudes, noticias) tienen el suyo con su forma.
export default function Cargando() {
  return (
    <Esqueleto>
      <EsqueletoEncabezado />
      <EsqueletoTarjetas />
      <div className="panel h-64" />
    </Esqueleto>
  );
}

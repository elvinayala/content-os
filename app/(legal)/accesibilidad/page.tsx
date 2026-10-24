import type { Metadata } from "next";

import { DocumentoLegal, NavLegal, Pendiente, Seccion } from "@/components/legal/documento";
import { LEGAL } from "@/lib/legal/versiones";

export const metadata: Metadata = { title: "Accesibilidad" };

const D = LEGAL.accesibilidad;

export default function AccesibilidadPage() {
  return (
    <div className="flex flex-col gap-8">
      <NavLegal actual={D.ruta} />
      <DocumentoLegal titulo="Accesibilidad" version={D.version} fecha={D.fecha}>
        <Seccion titulo="Nuestro compromiso">
          <p>
            Queremos que todas las personas puedan usar nuestras plataformas. Trabajamos para cumplir las pautas WCAG 2.1 nivel AA:
            todo se puede usar con el teclado y con foco visible, los campos tienen etiquetas, respetamos el modo de &quot;reducir
            movimiento&quot; del sistema y el texto se puede agrandar sin romper la pantalla.
          </p>
        </Seccion>
        <Seccion titulo="¿Encontraste una barrera?">
          <p>
            Escríbenos a <Pendiente>correo para reportar barreras de accesibilidad</Pendiente> con la página y lo que pasó. Te
            contestamos y te ayudamos por otra vía mientras lo arreglamos.
          </p>
        </Seccion>
      </DocumentoLegal>
    </div>
  );
}

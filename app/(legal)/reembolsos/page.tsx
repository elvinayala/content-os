import type { Metadata } from "next";

import { DocumentoLegal, NavLegal, Seccion } from "@/components/legal/documento";
import { ENTIDAD, LEGAL } from "@/lib/legal/versiones";

export const metadata: Metadata = { title: "Política de reembolsos y cancelación" };

const D = LEGAL.reembolsos;

export default function ReembolsosPage() {
  return (
    <div className="flex flex-col gap-8">
      <NavLegal actual={D.ruta} />
      <DocumentoLegal
        titulo="Reembolsos y cancelación"
        version={D.version}
        fecha={D.fecha}
        resumen={
          <>
            Aplica a los servicios de Level Up Media y AI Borinquen ({ENTIDAD}). Las condiciones exactas de tu servicio (pago
            inicial, mensualidad, plazos) están en tu acuerdo firmado; esta página explica las reglas generales.
          </>
        }
      >
        <Seccion titulo="1. Lo que dice tu acuerdo">
          <p>
            Los plazos y condiciones de reembolso de tu servicio son los de tu acuerdo o contrato firmado. En el contrato de AI
            Borinquen, los pagos no son reembolsables salvo incumplimiento grave verificado. En todos los casos aplica lo que
            dice la sección 2.
          </p>
        </Seccion>

        <Seccion titulo="2. Lo que siempre se reembolsa">
          <p>
            Sin importar lo anterior, <strong>siempre reembolsamos si el servicio está defectuoso o no cumple lo que se
            anunció</strong>, además de los derechos que te dan las reglas del DACO de Puerto Rico.
          </p>
        </Seccion>

        <Seccion titulo="3. Mensualidades y cancelación">
          <ul>
            <li>Los servicios mensuales se cobran según tu acuerdo; la permanencia y la cancelación son las que dice ese acuerdo.</li>
            <li>
              Para cancelar, escríbenos al correo de la sección 5 antes de la próxima fecha de cobro. No tienes que llamar ni dar
              explicaciones.
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="4. Ventas en eventos o fuera de nuestra oficina">
          <p>
            Si compraste $25 o más en un evento, seminario, hotel o en tu casa o negocio, tienes 3 días laborables para cancelar
            sin penalidad (regla federal de &quot;Cooling-Off&quot;), con aviso por escrito.
          </p>
        </Seccion>

        <Seccion titulo="5. Cómo pedirlo y cuándo llega">
          <p>
            Escríbenos a <a className="underline underline-offset-2" href="mailto:info@levelupmediapr.net">info@levelupmediapr.net</a>{" "}
            (Level Up Media) o <a className="underline underline-offset-2" href="mailto:hola@aiborinquen.co">hola@aiborinquen.co</a>{" "}
            (AI Borinquen) con tu nombre, negocio y el motivo. Si procede, el dinero vuelve al mismo método de pago.
          </p>
        </Seccion>
      </DocumentoLegal>
    </div>
  );
}

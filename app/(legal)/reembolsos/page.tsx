import type { Metadata } from "next";

import { DocumentoLegal, NavLegal, Pendiente, Seccion } from "@/components/legal/documento";
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
        <Seccion titulo="1. Plazo para pedir un reembolso">
          <p>
            Puedes pedir el reembolso del pago inicial dentro de <Pendiente>número de días para pedir reembolso y desde cuándo cuentan (firma, pago o inicio)</Pendiente>,
            siempre que <Pendiente>condiciones (p. ej., antes de empezar la producción o la configuración del agente)</Pendiente>.
            Pasado ese plazo, el trabajo ya hecho no es reembolsable, salvo lo que dice la sección 2.
          </p>
        </Seccion>

        <Seccion titulo="2. Lo que siempre se reembolsa">
          <p>
            Sin importar lo anterior, si el servicio <strong>no funciona, no sirve para lo que se contrató o no cumple lo que se
            anunció</strong>, tienes derecho a que se corrija o a la devolución, según las reglas del DACO de Puerto Rico.
          </p>
        </Seccion>

        <Seccion titulo="3. Mensualidades y cancelación">
          <ul>
            <li>Los servicios mensuales se cobran mes a mes según tu acuerdo. No hay penalidad por cancelar <Pendiente>confirmar si hay permanencia mínima</Pendiente>.</li>
            <li>
              Para cancelar, avísanos por <Pendiente>canal para cancelar (correo / Slack de tu negocio)</Pendiente> antes de la
              próxima fecha de cobro. Cancelar es igual de fácil que contratar: no tienes que llamar ni dar explicaciones.
            </li>
            <li>El mes ya pagado no se prorratea <Pendiente>confirmar</Pendiente>; el servicio sigue hasta que termina ese período.</li>
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
            Escríbenos a <Pendiente>correo para reembolsos</Pendiente> con tu nombre, negocio y el motivo. Te contestamos en{" "}
            <Pendiente>días hábiles para contestar</Pendiente> y, si procede, el dinero vuelve al mismo método de pago en{" "}
            <Pendiente>días hábiles para devolver</Pendiente>.
          </p>
        </Seccion>
      </DocumentoLegal>
    </div>
  );
}

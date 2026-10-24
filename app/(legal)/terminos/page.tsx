import type { Metadata } from "next";

import { DocumentoLegal, NavLegal, Seccion } from "@/components/legal/documento";
import { ENTIDAD, LEGAL } from "@/lib/legal/versiones";

export const metadata: Metadata = { title: "Términos y condiciones" };

const D = LEGAL.terminos;

export default function TerminosPage() {
  return (
    <div className="flex flex-col gap-8">
      <NavLegal actual={D.ruta} />
      <DocumentoLegal
        titulo="Términos y condiciones"
        version={D.version}
        fecha={D.fecha}
        resumen={
          <>
            En corto: estas reglas aplican cuando usas nuestras plataformas para clientes y prospectos (la app de clientes de
            Level Up Media, el Portal AutoFlow de AI Borinquen y nuestros formularios). Lo que contrataste con nosotros se rige
            por tu acuerdo firmado; si algo aquí choca con ese acuerdo, manda el acuerdo.
          </>
        }
      >
        <Seccion titulo="1. Quiénes somos">
          <p>
            Las plataformas las opera <strong>{ENTIDAD}</strong>, compañía de Puerto Rico, dueña de las marcas Level Up Media y
            AI Borinquen. Contacto: <a className="underline underline-offset-2" href="mailto:info@levelupmediapr.net">info@levelupmediapr.net</a>{" "}
            (Level Up Media) o <a className="underline underline-offset-2" href="mailto:hola@aiborinquen.co">hola@aiborinquen.co</a> (AI Borinquen).
          </p>
        </Seccion>

        <Seccion titulo="2. A qué aplican">
          <ul>
            <li>
              <strong>App de clientes de Level Up Media</strong> (app.levelupmediapr.net): en qué va tu servicio, los resultados de
              tu cuenta publicitaria de Meta, tus archivos y tu equipo.
            </li>
            <li>
              <strong>Portal AutoFlow de AI Borinquen</strong>: tus agentes de IA (chat y voz), las llamadas, el embudo de tu
              negocio, tus solicitudes de cambio y tus métricas.
            </li>
            <li>
              <strong>Formularios</strong> de Level Up Media y AI Borinquen (solicitudes, encuestas, agendas y onboarding).
            </li>
          </ul>
          <p>
            Las herramientas internas del equipo (Pulse, Leads y Ritmo) no son para el público; quien las usa como empleado o
            contratista sigue el <a className="underline underline-offset-4 hover:text-foreground" href={LEGAL.privacidadEquipo.ruta}>aviso de privacidad del equipo</a> y las políticas internas.
          </p>
        </Seccion>

        <Seccion titulo="3. Tu acceso">
          <ul>
            <li>
              La app de clientes y el Portal AutoFlow se abren con un <strong>enlace personal</strong>. Es como una llave: no lo
              compartas fuera de tu negocio. Si crees que alguien más lo tiene, escríbenos y lo cambiamos (el viejo deja de
              funcionar).
            </li>
            <li>Podemos desactivar un acceso cuando termina el servicio, si se usa mal o para proteger tus datos.</li>
            <li>Tienes que ser mayor de edad y tener autoridad para actuar por el negocio que representas.</li>
          </ul>
        </Seccion>

        <Seccion titulo="4. Uso aceptable">
          <p>No puedes usar las plataformas para:</p>
          <ul>
            <li>intentar entrar a datos de otro cliente, saltarte la seguridad o probar vulnerabilidades sin permiso escrito;</li>
            <li>subir archivos con virus, contenido ilegal o material del que no tienes derechos;</li>
            <li>copiar, revender o automatizar el acceso a la plataforma (bots, scraping);</li>
            <li>usar los agentes de IA para engañar, acosar o contactar personas sin su consentimiento.</li>
          </ul>
        </Seccion>

        <Seccion titulo="5. Servicios, precios y pagos">
          <p>
            Las plataformas no cobran: no hay pagos dentro de la app ni del portal. Los precios, plazos, renovaciones y
            cancelaciones de cada servicio están en tu <strong>propuesta o acuerdo firmado</strong>. Para devoluciones, mira la{" "}
            <a className="underline underline-offset-4 hover:text-foreground" href={LEGAL.reembolsos.ruta}>política de reembolsos</a>.
          </p>
          <p>
            Los resultados de publicidad dependen de muchos factores (presupuesto, oferta, mercado, la plataforma de Meta) y{" "}
            <strong>no se garantizan</strong>. Las métricas que ves salen de las fuentes conectadas y pueden tener atrasos o
            diferencias con lo que ves directo en Meta.
          </p>
        </Seccion>

        <Seccion titulo="6. Agentes y llamadas con inteligencia artificial">
          <ul>
            <li>
              Los agentes de AI Borinquen son <strong>inteligencia artificial</strong>, no personas. Así se presentan a quien
              habla con ellos.
            </li>
            <li>
              Las llamadas de prueba y las llamadas reales con los agentes de voz <strong>se graban y se transcriben</strong>{" "}
              para mostrártelas en el portal, mejorar el agente y registrar los datos que la persona dé (nombre, teléfono,
              interés). Antes de empezar una llamada de prueba se te pide aceptarlo.
            </li>
            <li>
              Lo que dice un agente de IA puede tener errores. Revisa las respuestas importantes (precios, citas, promesas) antes
              de que tus clientes dependan de ellas. Eres responsable de usar el agente conforme a las leyes que aplican a tu
              negocio (por ejemplo, las de llamadas y mensajes de marketing).
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="7. Tu contenido y tus archivos">
          <p>
            Lo que nos subes (fotos, videos, documentos, datos de tu negocio) sigue siendo tuyo. Nos das permiso para usarlo
            solo para darte el servicio (por ejemplo, crear tus anuncios o entrenar tu agente). Garantizas que tienes derecho a
            usarlo, incluidas las personas que salen en las fotos y videos.
          </p>
        </Seccion>

        <Seccion titulo="8. Nuestra propiedad intelectual">
          <p>
            Las plataformas, su diseño, código, marcas y textos son de {ENTIDAD}. Lo que se te entrega como parte de tu servicio
            se rige por tu acuerdo firmado.
          </p>
        </Seccion>

        <Seccion titulo="9. Garantías y responsabilidad">
          <p>
            Las plataformas se ofrecen &quot;tal cual&quot; y &quot;según disponibilidad&quot;. Hacemos lo razonable para que funcionen y
            estén seguras, pero pueden fallar, pausarse por mantenimiento o depender de terceros (Meta, Google, proveedores de
            voz e IA).
          </p>
          <p>
            Hasta donde lo permite la ley, {ENTIDAD} no responde por daños indirectos, lucro cesante ni pérdida de datos causada
            por terceros. Nada de esto limita los derechos que te da la ley como consumidor en Puerto Rico.
          </p>
        </Seccion>

        <Seccion titulo="10. Ley aplicable y disputas">
          <p>
            Estos términos se rigen por las leyes de Puerto Rico y las federales que apliquen. Cualquier disputa se atenderá en
            los tribunales de Puerto Rico.
          </p>
        </Seccion>

        <Seccion titulo="11. Cambios a estos términos">
          <p>
            Si cambiamos algo importante, subimos la versión y la fecha arriba y te lo avisamos en la plataforma o por tu canal
            con nosotros antes de que aplique. Guardamos cada versión publicada.
          </p>
        </Seccion>

        <Seccion titulo="12. Idioma">
          <p>
            Estos términos están en español. Si existe una traducción y hay diferencias, prevalece la versión en español.
          </p>
        </Seccion>
      </DocumentoLegal>
    </div>
  );
}

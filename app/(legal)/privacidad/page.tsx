import type { Metadata } from "next";

import { DocumentoLegal, NavLegal, Seccion } from "@/components/legal/documento";
import { ENTIDAD, LEGAL } from "@/lib/legal/versiones";

export const metadata: Metadata = { title: "Política de privacidad" };

const D = LEGAL.privacidad;
const a = "underline underline-offset-4 hover:text-foreground";

export default function PrivacidadPage() {
  return (
    <div className="flex flex-col gap-8">
      <NavLegal actual={D.ruta} />
      <DocumentoLegal
        titulo="Política de privacidad"
        version={D.version}
        fecha={D.fecha}
        resumen={
          <>
            En corto: usamos tus datos para darte el servicio que pediste y comunicarnos contigo. No vendemos tus datos. No hay
            píxeles de publicidad ni analítica de terceros en estas plataformas. Puedes pedirnos ver, corregir o borrar tus
            datos. Si trabajas con nosotros, lee también el{" "}
            <a className={a} href={LEGAL.privacidadEquipo.ruta}>aviso de privacidad del equipo</a>.
          </>
        }
      >
        <Seccion titulo="1. Quién es responsable">
          <p>
            {ENTIDAD} (marcas Level Up Media y AI Borinquen), Puerto Rico. Contacto de privacidad:{" "}
            <a className="underline underline-offset-2" href="mailto:info@levelupmediapr.net">info@levelupmediapr.net</a> (Level Up Media) ·{" "}
            <a className="underline underline-offset-2" href="mailto:hola@aiborinquen.co">hola@aiborinquen.co</a> (AI Borinquen). Esta política cumple con la
            Ley 39-2012 de Puerto Rico (aviso de política de privacidad) y aplica a visitantes de otros estados, incluido
            California (CalOPPA).
          </p>
        </Seccion>

        <Seccion id="datos" titulo="2. Qué datos recogemos y para qué">
          <ul>
            <li>
              <strong>Formularios</strong> (solicitudes, encuestas, agendas, onboarding): lo que escribes (nombre, correo,
              teléfono, negocio, respuestas). Para contestarte, agendar, darte el servicio y darle seguimiento.
            </li>
            <li>
              <strong>App de clientes de Level Up Media</strong>: los datos de tu servicio (empresa, plan, etapa, fechas de
              reporte, tu equipo asignado y tu acuerdo firmado); los resultados de tu cuenta publicitaria de Meta (solo lectura);
              los archivos que subes; la fecha de tu último acceso; y, si activas los avisos, la suscripción de tu teléfono para
              notificaciones.
            </li>
            <li>
              <strong>Portal AutoFlow de AI Borinquen</strong>: las conversaciones y llamadas con tus agentes de IA (grabación,
              transcripción y los datos que da quien llama: nombre, teléfono, interés, si quiere cita), los contactos de tu
              embudo y tus solicitudes de cambio.
            </li>
            <li>
              <strong>Llamadas de venta</strong> con nuestro equipo: pueden grabarse y resumirse para darte seguimiento.
            </li>
            <li>
              <strong>Datos técnicos</strong>: dirección IP, navegador y fecha/hora de acceso, para seguridad y para registrar tus
              consentimientos.
            </li>
          </ul>
          <p>
            No pedimos números de seguro social, datos de tarjeta en estas plataformas ni datos de salud. Si eres proveedor de
            salud y tu agente atiende pacientes, eso se rige por un acuerdo aparte (HIPAA). No dirigimos los servicios a menores
            de 13 años ni recogemos sus datos a sabiendas.
          </p>
        </Seccion>

        <Seccion id="mensajes" titulo="3. Mensajes, llamadas y avisos">
          <ul>
            <li>
              Solo te enviamos <strong>mensajes de marketing</strong> por SMS, WhatsApp o llamadas (incluida voz automatizada o de
              IA) si lo aceptaste en una casilla aparte. No es condición de compra. Responde <strong>STOP</strong> para salir en
              cualquier momento.
            </li>
            <li>Los correos promocionales traen enlace para darte de baja; lo procesamos en menos de 10 días laborables.</li>
            <li>
              Los <strong>avisos push</strong> de la app de clientes solo llegan si los activas en tu teléfono, y los puedes
              desactivar en Mi cuenta o en los ajustes del teléfono.
            </li>
            <li>Los mensajes sobre tu servicio (reportes, citas, soporte) no son marketing y siguen mientras seas cliente.</li>
          </ul>
        </Seccion>

        <Seccion id="terceros" titulo="4. Con quién compartimos datos">
          <p>No vendemos ni alquilamos tus datos. Los compartimos solo con proveedores que nos ayudan a darte el servicio:</p>
          <ul>
            <li>Supabase (base de datos y archivos) y Vercel (hospedaje de las plataformas).</li>
            <li>Meta (lectura de los resultados de tu cuenta publicitaria; WhatsApp e Instagram cuando nos escribes por ahí).</li>
            <li>Google (Drive para tus archivos y Calendar para citas).</li>
            <li>Retell AI y ElevenLabs (voz de los agentes, grabación y transcripción de llamadas); Anthropic y OpenAI (modelos de IA que generan respuestas y resúmenes).</li>
            <li>Slack y Telegram (avisos internos al equipo, sin compartirlos contigo ni con otros clientes).</li>
            <li>Calendly (agendas), ActiveCampaign (correos), Timelines y Zernio (WhatsApp y redes), Fathom (resumen de llamadas de venta).</li>
            <li>Apple y Google (entrega de avisos push a tu teléfono).</li>
          </ul>
          <p>
            También podemos compartir datos si la ley o una orden judicial lo exige, o para proteger la seguridad de las
            personas o de la plataforma.
          </p>
        </Seccion>

        <Seccion id="cookies" titulo="5. Cookies">
          <p>
            Solo usamos cookies necesarias para mantener tu sesión y la seguridad. No usamos Meta Pixel, Google Analytics ni
            grabación de sesiones en estas plataformas. Detalle en la <a className={a} href={LEGAL.cookies.ruta}>política de cookies</a>.
            No respondemos de forma distinta a la señal &quot;Do Not Track&quot; porque no rastreamos entre sitios.
          </p>
        </Seccion>

        <Seccion titulo="6. Cuánto tiempo guardamos los datos">
          <p>
            El tiempo necesario para los fines descritos y lo que exija la ley.
            Los registros de consentimiento se guardan al menos 5 años. Cuando ya no se necesitan, se borran de forma segura (Ley 234-2014).
          </p>
        </Seccion>

        <Seccion titulo="7. Tus derechos">
          <p>
            Puedes pedirnos ver, corregir o borrar tus datos, o retirar un consentimiento, escribiendo a{" "}
            <a className="underline underline-offset-2" href="mailto:info@levelupmediapr.net">info@levelupmediapr.net</a> o{" "}
            <a className="underline underline-offset-2" href="mailto:hola@aiborinquen.co">hola@aiborinquen.co</a>.
            Puede que tengamos que guardar algunos datos por ley (por ejemplo, facturas y contratos).
          </p>
        </Seccion>

        <Seccion titulo="8. Seguridad y brechas">
          <p>
            Usamos conexiones cifradas, accesos con clave y verificación en dos pasos para el equipo, enlaces personales para
            clientes, permisos por empresa y respaldos cifrados. Si ocurre un acceso no autorizado a datos personales, avisaremos
            a las personas afectadas y al DACO según la Ley 111-2005 de Puerto Rico.
          </p>
        </Seccion>

        <Seccion titulo="9. Cambios">
          <p>
            Si cambiamos esta política, subimos la versión y la fecha de arriba y lo avisamos en la plataforma. Guardamos cada
            versión publicada.
          </p>
        </Seccion>
      </DocumentoLegal>
    </div>
  );
}

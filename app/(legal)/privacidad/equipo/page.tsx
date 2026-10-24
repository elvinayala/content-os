import type { Metadata } from "next";

import { DocumentoLegal, NavLegal, Pendiente, Seccion } from "@/components/legal/documento";
import { ENTIDAD, LEGAL } from "@/lib/legal/versiones";

export const metadata: Metadata = { title: "Aviso de privacidad del equipo" };

const D = LEGAL.privacidadEquipo;

// Para empleados y contratistas que usan Ritmo, Pulse y Leads. Debe decir exactamente lo que las plataformas hacen
// (docs/contexto/ritmo.md y pulse.md): si cambia el ponche, la seguridad o lo que se guarda, se actualiza aquí y sube la versión.
export default function PrivacidadEquipoPage() {
  return (
    <div className="flex flex-col gap-8">
      <NavLegal actual={D.ruta} />
      <DocumentoLegal
        titulo="Aviso de privacidad del equipo"
        version={D.version}
        fecha={D.fecha}
        resumen={
          <>
            Para empleados y contratistas de {ENTIDAD} (Level Up Media y AI Borinquen) que usan <strong>Ritmo</strong>,{" "}
            <strong>Pulse</strong> y <strong>Leads</strong>. En corto: medimos asistencia, cumplimiento y resultados por puesto{" "}
            <strong>sin vigilarte</strong>: no usamos GPS, no tomamos capturas de pantalla ni grabamos lo que tecleas. Cada
            quien ve solo lo de su empresa.
          </>
        }
      >
        <Seccion id="ritmo" titulo="1. Qué guarda Ritmo y para qué">
          <ul>
            <li>
              <strong>Ponche</strong> (entrada, almuerzo y salida): la hora la pone el servidor y se guarda la dirección IP. Para
              llevar tus horas, tu asistencia y tus días libres.
            </li>
            <li>
              <strong>Seguridad del ponche</strong>: solo se poncha desde una computadora registrada. Para reconocerla guardamos una
              cookie de esa computadora, una huella técnica del navegador y la red desde la que entras, y te pedimos declarar tu
              Wi-Fi principal. Recursos Humanos aprueba computadoras o redes nuevas y el ponche manual. Esto protege los datos de
              clientes; <strong>no es rastreo de ubicación</strong>.
            </li>
            <li>
              <strong>Tu ficha</strong>: foto, teléfonos, ciudad y país, contacto de emergencia, documento e identificación,
              contrato firmado, puesto, supervisor, fecha de ingreso, salario y documentos de nómina. Para la relación de trabajo,
              pagarte y cumplir con la ley. La ven tú, Recursos Humanos y la dirección; tu líder no ve salario ni documentos.
            </li>
            <li>
              <strong>Desempeño</strong>: tus KPIs por puesto, reporte del día, prioridades, solicitudes (tiempo libre, cambios) y
              su aprobación. Para medir resultados de forma justa y darte reconocimiento (ranking, Arena, Carreras).
            </li>
            <li>
              <strong>Bienestar</strong> (voluntario): pausas, ejercicio y energía del día. Es privado y <strong>no cuenta para tu
              desempeño</strong>; la dirección solo ve la energía en grupo (cuando contestan 5 o más). La Comunidad es opcional: solo
              la ve y aparece quien se une.
            </li>
            <li>
              <strong>Canal ético</strong>: puedes reportar de forma anónima (es lo predeterminado). Solo lo lee el CEO; el aviso
              que le llega no incluye el contenido. No se permiten represalias por reportar de buena fe.
            </li>
            <li>
              <strong>Avisos</strong>: te llegan por Slack y, si activas los avisos en tu teléfono, por push. Si conectas tu Google
              Calendar, solo se usa para mostrar tu agenda en Mi día; lo puedes desconectar cuando quieras.
            </li>
          </ul>
        </Seccion>

        <Seccion id="pulse" titulo="2. Pulse y Leads: confidencialidad y registro de seguridad">
          <ul>
            <li>
              Pulse (clientes) y Leads (ventas) tienen <strong>información confidencial de clientes y prospectos</strong>. Úsala
              solo para tu trabajo; no la copies, descargues en masa, compartas fuera de la empresa ni la uses después de irte.
            </li>
            <li>
              Para proteger esa información registramos los inicios de sesión (correo, IP, fecha), los intentos fallidos, los
              cambios de acceso, los archivos que se descargan y los cambios que haces en los registros (quién, qué y cuándo). Si
              hay algo fuera de lo normal (por ejemplo, muchas descargas seguidas o una IP nueva en una cuenta con permisos altos),
              le llega un aviso a la dirección.
            </li>
            <li>Las cuentas son personales: no compartas tu clave ni tu código de verificación.</li>
          </ul>
        </Seccion>

        <Seccion titulo="3. Quién más ve tus datos">
          <p>
            La dirección y Recursos Humanos de tu empresa, según su rol. Proveedores que usamos para operar: Supabase (base de
            datos y archivos), Vercel (hospedaje), Slack y Telegram (avisos), Google (calendario, si lo conectas) y Apple/Google
            (avisos push). No vendemos tus datos. Los compartimos con autoridades solo cuando la ley lo exige.
          </p>
        </Seccion>

        <Seccion titulo="4. Cookies">
          <p>
            Solo necesarias: tu sesión (<code>pulse-session</code>, 14 días o 90 con &quot;recordarme&quot;) y la de la computadora registrada para ponchar
            (<code>ritmo-equipo</code>). Detalle en la <a className="underline underline-offset-4 hover:text-foreground" href={LEGAL.cookies.ruta}>política de cookies</a>.
          </p>
        </Seccion>

        <Seccion titulo="5. Cuánto tiempo">
          <p>
            Mientras trabajes con nosotros y después el tiempo que exige la ley laboral y contributiva:{" "}
            <Pendiente>plazo de retención de expedientes, ponches y documentos de nómina tras la salida</Pendiente>. El registro de
            seguridad se guarda <Pendiente>plazo del registro de seguridad</Pendiente>.
          </p>
        </Seccion>

        <Seccion titulo="6. Tus derechos">
          <p>
            Puedes ver tu ficha y tus documentos en Ritmo (Mi ficha) y pedir que se corrija lo que esté mal. Para pedir una copia
            de tus datos o hacer preguntas sobre este aviso, escribe a Recursos Humanos: <Pendiente>correo de Recursos Humanos</Pendiente>.
          </p>
        </Seccion>

        <Seccion titulo="7. Seguridad y brechas">
          <p>
            Claves cifradas, verificación en dos pasos, bloqueo tras intentos fallidos, archivos privados con enlaces que vencen,
            permisos por rol y por empresa, y respaldos cifrados. Si hubiera un acceso no autorizado a datos personales, te
            avisaremos y notificaremos al DACO según la Ley 111-2005.
          </p>
        </Seccion>

        <Seccion titulo="8. Cambios">
          <p>
            Si cambia lo que guardamos o cómo lo usamos, actualizamos este aviso (versión y fecha arriba) y te lo avisamos en Ritmo.
          </p>
        </Seccion>
      </DocumentoLegal>
    </div>
  );
}

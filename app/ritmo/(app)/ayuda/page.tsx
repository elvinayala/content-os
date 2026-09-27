import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { MIN_RESPUESTAS_ANIMO } from "@/lib/desempeno/bienestar-reglas";
import { BONO_REFERIDO } from "@/lib/desempeno/carreras-reglas";
import { TOLERANCIA_MIN } from "@/lib/desempeno/reglas";
import { POLITICA } from "@/lib/desempeno/rrhh";

export const metadata = { title: "Preguntas frecuentes" };

// Las preguntas más comunes del equipo (en vez de un chatbot, 26/sep): respuestas cortas y exactas, sacadas de las
// mismas reglas que usa Ritmo (si cambia una política en rrhh.ts/reglas.ts, esto cambia solo).
const GRUPOS: { titulo: string; preguntas: { p: string; r: React.ReactNode }[] }[] = [
  {
    titulo: "Mi día",
    preguntas: [
      { p: "¿Cómo marco entrada y salida?", r: <>En <Link href="/ritmo" className="text-primary">Hoy</Link>, toca el círculo grande para entrar y otra vez (o “Marcar salida”) para salir. La hora la pone el sistema, no tu teléfono.</> },
      { p: "¿Puedo marcar varias veces en el día?", r: "Sí. Si trabajas en tramos (por ejemplo, mañana y tarde), marca entrada y salida en cada tramo: Ritmo suma las horas." },
      { p: "Se me olvidó marcar la salida", r: "La próxima vez que entres a Ritmo te va a pedir a qué hora saliste. Pon la hora real; la dirección la confirma." },
      { p: "¿Qué pasa si llego tarde?", r: `Hay ${TOLERANCIA_MIN} minutos de tolerancia. Si llegas tarde pero completas tus horas, no se castiga la salida.` },
      { p: "¿Qué pongo al marcar la salida?", r: "Si algo te frenó ese día (bloqueos), escríbelo; es opcional. En algunos puestos también se anota lo que el sistema no ve, como reuniones con clientes." },
      { p: "¿Ritmo me vigila?", r: "No. Solo guarda tu hora de entrada y salida y lo que tú reportes. Nada de capturas de pantalla, GPS ni lo que tecleas." },
    ],
  },
  {
    titulo: "Vacaciones, días libres y permisos",
    preguntas: [
      { p: "¿Cuántos días de vacaciones tengo?", r: `${POLITICA.vacacionesAnual} días al año, que se acumulan mes a mes desde tu fecha de ingreso. Tu saldo exacto está en tu ficha (en días y horas).` },
      { p: "¿Cuándo puedo tomar vacaciones?", r: `A partir de los ${POLITICA.mesesParaVacaciones} meses de haber entrado. Ritmo te avisa cuando cumples el tiempo.` },
      { p: "¿Cómo pido un día libre, vacaciones, un permiso o una carta?", r: <>En <Link href="/ritmo/solicitudes" className="text-primary">Solicitudes</Link>. Tu supervisor la aprueba y RR.HH. la firma; te llega un aviso por Slack en cada paso.</> },
      { p: "¿Y si me enfermo?", r: `Tienes ${POLITICA.enfermedadAnual} días al año por enfermedad con certificado médico. Sin certificado, se descuentan de tus vacaciones.` },
      { p: "¿Y la maternidad?", r: `${POLITICA.maternidad} días por evento.` },
      { p: "¿Qué pasa si no me alcanzan los días?", r: "Los días que no cubra tu saldo se toman sin paga." },
    ],
  },
  {
    titulo: "Mi ficha y mis datos",
    preguntas: [
      { p: "¿Quién ve mi información?", r: "Tu ficha (datos personales, documentos y salario) solo la ven tú, RR.HH. y la dirección. Tu día a día lo ve la dirección; tus compañeros no ven nada tuyo." },
      { p: "¿Cómo subo mis documentos?", r: <>En <b>Mi ficha</b>. Foto hasta 10 MB, documentos hasta 25 MB y videos hasta 50 MB. La nómina la sube RR.HH.</> },
      { p: "Olvidé mi contraseña", r: "Pídele a Carilin, Aure o Elvin un enlace nuevo: con él creas una contraseña nueva. Nadie más la conoce." },
      { p: "¿Puedo tener Ritmo como app en el celular?", r: "Sí. Abre Ritmo en el navegador del celular y usa “Agregar a pantalla de inicio”." },
    ],
  },
  {
    titulo: "Crecer, noticias y bienestar",
    preguntas: [
      { p: "¿Cómo aplico a una vacante o refiero a alguien?", r: <>En <Link href="/ritmo/carreras" className="text-primary">Carreras</Link>. Si la persona que refieres se contrata y completa su onboarding, te damos US${BONO_REFERIDO} en tu próxima nómina.</> },
      { p: "¿Dónde veo las noticias de la empresa?", r: <>Las últimas salen en Hoy; todas están en <Link href="/ritmo/noticias" className="text-primary">Noticias</Link>.</> },
      { p: "¿El bienestar cuenta para mi evaluación?", r: `No. Es voluntario y tuyo. Tu energía del día nadie la ve: la dirección solo ve el promedio del equipo y solo si respondieron ${MIN_RESPUESTAS_ANIMO} o más.` },
      { p: "¿Cómo reporto algo que no está bien?", r: <>En el <Link href="/ritmo/etica" className="text-primary">Canal ético</Link>. Es anónimo si quieres y solo lo ve Elvin.</> },
    ],
  },
];

export default function AyudaPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <p className="ceja">Ayuda</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Preguntas frecuentes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lo que más pregunta el equipo. ¿No está tu duda? Pídela en Solicitudes (“Otra petición”) y RR.HH. te responde.</p>
      </div>
      {GRUPOS.map((g) => (
        <section key={g.titulo} className="flex flex-col gap-2">
          <h2 className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">{g.titulo}</h2>
          <div className="panel divide-y divide-border/60 overflow-hidden">
            {g.preguntas.map((q) => (
              <details key={q.p} className="group fila">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{q.p}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 text-sm leading-relaxed text-foreground/80">{q.r}</div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

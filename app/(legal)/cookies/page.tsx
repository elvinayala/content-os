import type { Metadata } from "next";

import { DocumentoLegal, NavLegal, Seccion } from "@/components/legal/documento";
import { LEGAL } from "@/lib/legal/versiones";

export const metadata: Metadata = { title: "Política de cookies" };

const D = LEGAL.cookies;

// Lista real (proxy.ts y lib/*/acceso.ts, 24/oct/2026). Si se agrega un píxel o analítica, se lista aquí y se pide
// permiso ANTES de cargarlo (skill legal-sitio-web, punto 3).
const COOKIES = [
  { nombre: "pulse-session", donde: "Pulse, Leads y Ritmo (equipo)", para: "Mantener tu sesión iniciada.", dura: "14 días (90 con \"recordarme\")" },
  { nombre: "ritmo-equipo", donde: "Ritmo (equipo)", para: "Reconocer la computadora registrada para ponchar.", dura: "400 días" },
  { nombre: "lu-cliente", donde: "App de clientes de Level Up Media", para: "Recordar tu enlace personal para que no tengas que abrirlo cada vez.", dura: "90 días" },
  { nombre: "lu-cliente-ver", donde: "App de clientes (vista previa del equipo)", para: "Que el equipo vea la app como el cliente.", dura: "4 horas" },
  { nombre: "autoflow-portal", donde: "Portal AutoFlow de AI Borinquen", para: "Recordar el acceso a tu portal.", dura: "30 días" },
  { nombre: "ceo-session", donde: "Herramientas internas de la dirección", para: "Mantener la sesión de la dirección.", dura: "Según la sesión" },
];

export default function CookiesPage() {
  return (
    <div className="flex flex-col gap-8">
      <NavLegal actual={D.ruta} />
      <DocumentoLegal
        titulo="Política de cookies"
        version={D.version}
        fecha={D.fecha}
        resumen={<>Solo usamos cookies necesarias para la sesión y la seguridad. No usamos cookies de publicidad ni de analítica, ni Meta Pixel, ni Google Analytics.</>}
      >
        <Seccion titulo="1. Cookies que usamos">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Cookie</th>
                  <th className="px-3 py-2 font-medium">Dónde</th>
                  <th className="px-3 py-2 font-medium">Para qué</th>
                  <th className="px-3 py-2 font-medium">Dura</th>
                </tr>
              </thead>
              <tbody>
                {COOKIES.map((c) => (
                  <tr key={c.nombre} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-xs">{c.nombre}</td>
                    <td className="px-3 py-2">{c.donde}</td>
                    <td className="px-3 py-2">{c.para}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{c.dura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Todas son &quot;esenciales&quot;: sin ellas no puedes entrar. Algunas pantallas también guardan preferencias en tu
            navegador (por ejemplo, una vista o un filtro); no salen de tu equipo.
          </p>
        </Seccion>

        <Seccion titulo="2. Cómo borrarlas">
          <p>
            Puedes borrar las cookies en los ajustes de tu navegador. Si lo haces, tendrás que volver a entrar (y, en Ritmo, puede
            que Recursos Humanos tenga que aprobar de nuevo tu computadora).
          </p>
        </Seccion>

        <Seccion titulo="3. Si esto cambia">
          <p>
            Si algún día agregamos cookies de analítica o publicidad, las listaremos aquí y te pediremos permiso antes de
            activarlas.
          </p>
        </Seccion>
      </DocumentoLegal>
    </div>
  );
}

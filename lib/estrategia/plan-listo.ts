import "server-only";

import { usuarioSlack } from "@/lib/max/flujo";
import { clientesParaRevision } from "@/lib/max/revision-clientes";
import { notificarCEO } from "@/lib/notificar-ceo";

import { emparejarCliente, esPlanListo, negocioDelTexto, textoAlerta } from "./plan-listo-reglas";

// "Plan listo" de un cliente nuevo en #office-5-revision-estrategica (19/oct/2026): cuando un estratega sube el plan
// completo para arrancar ("PLAN LISTO | Negocio | …"), a Elvin le llega una alerta por Telegram (+ espejo en su DM de
// Slack) con los datos del cliente sacados de Pulse. Leo (Director Creativo) sigue revisando en el mismo hilo como siempre.
// Reglas puras en plan-listo-reglas.ts.

async function permalink(canal: string, ts: string): Promise<string | null> {
  const tok = process.env.SLACK_BOT_TOKEN;
  if (!tok) return null;
  try {
    const r = await fetch(`https://slack.com/api/chat.getPermalink?${new URLSearchParams({ channel: canal, message_ts: ts })}`, { headers: { Authorization: `Bearer ${tok}` }, signal: AbortSignal.timeout(8000) });
    const j = (await r.json()) as { ok: boolean; permalink?: string };
    return j.ok ? (j.permalink ?? null) : null;
  } catch {
    return null;
  }
}

export { esPlanListo };

/** Arma y manda la alerta. Devuelve el texto (para el acuse en el hilo) o null si falló. */
export async function alertarPlanListo(o: { canal: string; ts: string; userId: string; texto: string; archivos: number }): Promise<string | null> {
  const [autor, clientes, link] = await Promise.all([
    usuarioSlack(o.userId).then((u) => u.nombre).catch(() => "un estratega"),
    clientesParaRevision({ todos: true }).catch(() => []),
    permalink(o.canal, o.ts),
  ]);
  const { cliente, candidatos } = emparejarCliente(o.texto, clientes);
  const texto = textoAlerta({ cliente, candidatos, negocio: negocioDelTexto(o.texto), autor, texto: o.texto, archivos: o.archivos, link });
  await notificarCEO(texto);
  return cliente?.empresa || cliente?.nombre || negocioDelTexto(o.texto) || "el cliente";
}

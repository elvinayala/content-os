## Plan listo de cliente nuevo → alerta a Elvin (19/oct/2026)

Elvin: "cuando un cliente esté listo, que me llegue una alerta por Telegram… dueño, negocio, pago inicial". En
**#office-5-revision-estrategica** (C0C3SKWHZ50, el mismo canal del Director Creativo: Leo sigue revisando todo) el estratega
sube el plan completo empezando con **`PLAN LISTO | Negocio | …`** (también vale "plan completo" / "listo para arrancar"); las
piezas sueltas ("Negocio | Fase 2") NO avisan. `/api/slack-eventos` → `alertarPlanListo` (`lib/estrategia/plan-listo.ts`) busca
el cliente en LEVEL UP MEDIA (todos los grupos menos bajas, `clientesParaRevision({ todos: true })`) y manda `notificarCEO`
(Telegram + DM de Slack) con dueño, pueblo, industria, pago inicial y fecha, acuerdo, servicio, etapa en Pulse, estratega y el
link; acusa en el hilo. Reglas puras `plan-listo-reglas.ts` (tests `tests/plan-listo.test.mjs`). Aprueban Elvin o Carilin en el hilo.

---
name: encuesta-fin-onboarding
description: Encuesta automática por WhatsApp al terminar la llamada de onboarding de Level Up (Jessica) — cómo funciona, estado (simulación hasta OK de Elvin) y dónde ver resultados
metadata:
  type: project
---

11/oct/2026, pedido de Elvin: "una encuesta apenas termina el onboarding, para saber que Jessica hizo un buen onboarding, que nada raro pasó y que se cumplió todo".

- Cron `/api/cron/encuesta-onboarding` (cada 10 min, `lib/onboarding/encuesta.ts` + reglas puras `encuesta-reglas.ts`, tests `tests/encuesta-onboarding.test.mjs`): lee Calendly de LU, eventos "onboarding" cuya hora de FIN pasó hace 15 min–4 h (de noche → 8 AM siguiente), y manda por n8n (`L-) Enviar WhatsApp (Content OS)`, webhook `enviar-whatsapp`) el link `levelupmedia.vercel.app/f/onboarding-experiencia?origen=ob-<ref>`.
- Una sola vez: tabla `onboarding_encuestas` (llave única por invitado de Calendly) se escribe ANTES de mandar; nunca reintenta (ver [[n8n-envios-sin-repetir]]). No manda si el invitado está marcado no-show en Calendly o no dejó teléfono.
- Formulario (acción `encuesta-onboarding-lu`): ¿tuvo el onboarding? (si no: qué pasó, "nadie me atendió" = alerta roja) · nota 0-10 · ¿quedó claro qué sigue? · ¿se cubrió todo? · ¿algo no le gustó? · mejora. Verde/ámbar/rojo (`evaluar`): nota ≤ 6 o "no" en claro/cumplió o algo raro = rojo; 7-8 o "casi" = ámbar.
- Cada respuesta: comentario en la ficha de LEVEL UP MEDIA (Pulse), aviso a Elvin por Telegram (`notificarCEO`) y, si no es verde, DM de Carilin. Jessica NO recibe los resultados. Respuestas completas en Pulse → Formularios.
- MODO: simulación hasta `ENCUESTA_ONBOARDING_MODO=real` en Vercel (esperando OK de Elvin + prueba del envío real con su número). Las llamadas de Jessica duran 120 min en Calendly (la encuesta sale 15 min después del fin del bloque aunque ella termine antes).
- Pendiente opcional: promedio por Project Manager en Ritmo; hora real de fin con Zoom/Fathom (cuidado con [[privacidad-reuniones-elvin]]).

Relacionado: [[n8n-level-up]], [[formularios-propios]].

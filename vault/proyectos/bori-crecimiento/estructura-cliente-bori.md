---
fecha: 2026-09-21
fuente: manual
unidad: bori
tags: [bori, clientes, soporte, whatsapp, canal, postventa, lis, angela, aure]
estado: estructura decidida el 21/sep · Aure monta el Canal + número · Lis y Ángela reciben la ruta
---

# Bori — cómo se atiende a un cliente sin convertir Bori en un servicio

Elvin (21/sep/2026): "Bori lo creé para que sea una plataforma que se mantenga sola. Ahora mismo
tengo a todos los clientes volviéndose locos pidiendo cosas que no entienden. No quiero convertir
esto en un servicio." Esta es la estructura que lo resuelve. Complementa la Ruta Post-Venta del
19/sep (Ángela dueña del cliente hasta que publica; artifact "Ruta Post-Venta Bori").

## 1. La regla de oro
**El producto atiende; las personas destraban.** Toda pregunta repetida se convierte en una guía,
un mensaje automático o un arreglo en la app — nunca en una conversación más. Si la misma duda
llega 3 veces, es un bug de onboarding y va a Equipo → Fallos, no a WhatsApp.

## 2. Tres capas de comunicación (y ninguna es un chat 1:1 abierto)

| Capa | Qué es | Dirección | Quién la lleva | Para qué |
|---|---|---|---|---|
| **A. Canal de WhatsApp "Bori"** | *Canal* de WhatsApp (no grupo, no lista de difusión): los clientes lo siguen, **no pueden escribir**, solo reaccionar | Bori → clientes | **Lis** publica (Ángela y Elvin admins); Aure lo monta | Anuncios, funciones nuevas, avisos de Meta caído, tips de 1 minuto, casos de clientes, promos. 2–3 mensajes por semana, nunca más de 1 al día |
| **B. Dentro de la app** | Chat de Bori 24/7 (IA que sabe su plan, créditos y estado de Meta) + guía de primer uso + Reto 7 Días + "Primeros pasos" + botón **"¿Algo no funciona?"** que registra el fallo | cliente ↔ producto | Bori (automático); los fallos caen en Slack | El 90 % de las dudas: cómo conectar Meta, cómo hacer el primer anuncio, qué pasó con mis créditos |
| **C. WhatsApp de soporte** | UN número de WhatsApp Business de Bori (no el de nadie del equipo), con mensaje de bienvenida automático y horario | cliente → Bori, con captura | **Lis** hace triage en horario laboral; Ángela toma lo de onboarding; lo técnico va a Equipo → Fallos (Nico) | Trabas puntuales que la app no resolvió. Regla: se contesta con un enlace a la guía o con el arreglo, no con una llamada |

Lo que **no** existe: chat 1:1 permanente con cada suscriptor, grupos de WhatsApp de clientes,
videollamadas para Pro/Starter/Creador. La única atención humana 1:1 es la del **plan Agencia
($249)**: Ángela, videollamada día 2 y llamada día 7. Si un cliente Pro pide acompañamiento, se le
ofrece Agencia. Eso es lo que evita que Bori se vuelva un servicio.

### ¿Por qué Canal y no grupo ni lista de difusión?
- **Grupo**: todos escriben, se llena de quejas públicas y de preguntas repetidas. Descartado.
- **Lista de difusión**: máximo 256, solo llega a quien guardó el número, y cada uno puede
  responder (se convierte en 1:1). Descartado.
- **Canal**: ilimitado, un enlace público (`whatsapp.com/channel/…`), los seguidores no pueden
  escribir, solo reaccionar y hacer encuestas. Se administra desde la app de WhatsApp Business.
  Es exactamente "informativo, que no puedan responder".

## 3. Quién hace qué
| Persona | Rol en Bori | Tiempo |
|---|---|---|
| **Aure** | Monta la infraestructura: número de WhatsApp Business de soporte (`WHATSAPP_SOPORTE`) y el Canal "Bori" (nombre, foto del kit de marca, descripción, admins). Entrega el enlace del canal y el número | 1 h, una vez |
| **Lis Acevedo** | Voz del Canal (publica lo que Sofi/Lola le dejan listo o lo que Elvin diga) + triage del WhatsApp de soporte en horario laboral: contesta con guía, pasa onboarding a Ángela, pasa bugs a Equipo → Fallos | 30 min al día |
| **Ángela** (PM) | Dueña de cada cliente nuevo hasta que publica (ruta día 0→30), plan Agencia 1:1, empuje del Reto | según ventas |
| **Nico** (agente) | Lee Equipo → Fallos y el canal de bugs, arregla, marca arreglado; agrega `CANAL_WHATSAPP` a la app (enlace del canal en bienvenida, Primeros pasos y correo de bienvenida) | ronda diaria |
| **Sofi / Lola** (agentes) | Dejan listos los mensajes del Canal (calendario semanal: lunes tip, miércoles caso/función, viernes aviso) para que Lis solo copie y publique | semanal |
| **Elvin** | Decide qué se anuncia; audio semanal. No atiende clientes | 0 |

## 4. Qué le llega al cliente (secuencia mínima, todo ya construido salvo el Canal)
1. **Día 0** — correo de bienvenida (Resend) + WhatsApp de Ángela (versión A/B según página propia
   o de agencia) **+ enlace al Canal "Bori"** ("síguelo: ahí avisamos todo").
2. **Día 0–7** — guía de primer uso, Reto 7 Días, empuje por WhatsApp un paso a la vez.
3. **Día 7 / 14 / 30** — "¿qué te frenó?", fin de garantía, salida de la ruta.
4. **Siempre** — Canal (anuncios) + chat de Bori + "¿Algo no funciona?" + WhatsApp de soporte con
   captura.

## 5. Guion para Lis (triage del WhatsApp de soporte)
- "No me deja conectar Meta / Sin páginas" → enlace a Primeros pasos → Conecta tu Meta (versión B
  si la página la montó una agencia). Si ya lo hizo y sigue igual: captura → Equipo → Fallos.
- "No sé hacer el anuncio / me inventó un precio" → guía "Tu primer anuncio en 4 pasos"; el precio
  se edita antes de publicar.
- "Quiero que me lo hagan" → "Eso es el plan Agencia ($249): Ángela lo hace contigo en una
  videollamada" → si dice sí, se lo pasa a Ángela.
- "Se me fueron los créditos / no me descargó" → captura → Equipo → Fallos (Nico revisa cobro;
  nunca se prometen reembolsos por WhatsApp).
- "Quiero cancelar" → una pregunta ("¿qué te faltó?"), se anota, y se le da el enlace del portal
  de Stripe. Sin retención agresiva.
- Nada se responde fuera de horario; el mensaje automático dice el horario y enlaza las guías.

## 6. Lo que falta para encender esto
| Qué | Quién | Estado |
|---|---|---|
| Número de WhatsApp Business de soporte de Bori | Aure | pedido 21/sep (pendiente desde el 19) |
| Canal de WhatsApp "Bori" creado, con foto y descripción, enlace + admins (Lis, Ángela, Elvin) | Aure | pedido 21/sep |
| `WHATSAPP_SOPORTE` y `CANAL_WHATSAPP` en Railway (servicio bori) + enlace del canal en bienvenida/Primeros pasos/correo | Nico | cuando Aure entregue |
| Ruta post-venta y este guion enviados a Lis (y a Ángela cuando entre a Slack) | Elvin OK → Sofi | borrador listo |
| Ángela en Slack (#bori-clientes) | Aure | pendiente desde el 19 |
| Calendario semanal de mensajes del Canal | Sofi | arranca cuando exista el canal |

## 7. Textos listos
**Descripción del Canal:** "Canal oficial de Bori (heybori.ai): novedades, funciones nuevas,
avisos de Meta y tips de 1 minuto para que tu negocio publique solo. Soporte: [número]."

**Mensaje automático del WhatsApp de soporte:** "Hola, soy el soporte de Bori. Atendemos lunes a
viernes de 9 AM a 5 PM. Mientras tanto: Primeros pasos → www.heybori.ai/app (Configuración →
Cuenta). Si algo no funciona, mándanos una captura y el correo de tu cuenta y lo revisamos."

**Primer mensaje del Canal:** "Bienvenido/a al canal de Bori. Aquí vas a ver primero cada función
nueva, los avisos cuando Meta se pone difícil y un tip corto por semana para que tu negocio
publique solo. Tu cuenta: www.heybori.ai/app."

---
fecha: 2026-07-17
fuente: granola
unidad: ai-borinquen
tags: [cliente, autoflow, funnel, chat-assistant, evento, high-profile]
---
# Christine D'Clario — diseño del funnel de eventos con asistente de chat

Reunión de fulfillment de [[ai-borinquen]] (David Quiroga + Ángel) con **Christine
D'Clario**, Carlos Cabán y su equipo (FPG, Victor Luis Ramos) para diseñar el
**funnel de eventos** de su movimiento "All In" (5 facetas; foco en salud/
suplementación y negocio/emprendimiento). Cliente de alto perfil. Se construye un
sistema de captación con **asistentes de chat de [[autoflow]]** que califican leads
antes y después de un evento en vivo que da Christine.

## Decisiones
- **Dos eventos separados, no uno**: según lo que el lead responde en el embudo,
  se lo dirige a un evento de **salud/suplementación** (con nutricionista, escaneo,
  testimonios) o a uno de **negocio** (oferta de oportunidad). No mezclar los dos
  públicos — se cierra mejor separados y puede ser back-to-back el mismo día.
- **Bot PRE-evento = solo logística**: confirma zona horaria/hora local, recuerda
  el propósito de la actividad y puede dar info general de quién es Christine y su
  movimiento. **NADA de ofertas ni precios** — la oferta la hace Christine en vivo.
  Su función es maximizar la asistencia al Zoom y minimizar confusiones de horario.
- **Bot POST-evento = calificación**: una vez Christine lanzó la oferta, el bot
  pregunta qué fue lo que más le gustó (salud / nuevo ingreso / etc.), responde
  dudas livianas de las formas de empezar (sin descalificar en bruto, con lógica de
  setter para encajar en un paquete) y cierra con "te contactará un facilitador para
  coordinar una cita".
- **Filtro de leads no deseados**: dos caminos — conversación manual (bloquear/sacar
  del CRM) o que el asistente de chat descarte automáticamente a quien pide solo las
  plantillas o deja comentarios negativos. Se apoya en los links de Ángel para saber
  quién entró y consumió el contenido de valor.

## Action items
- **David Quiroga (AIB)** — construir y entrenar los dos bots (pre y post evento) con
  el scope acordado; definir qué preguntas puede contestar cada uno. (`t-christine-funnel-asistente`)
- **Equipo Christine (Carlos/Ángel)** — armar el embudo que separa salud vs negocio y
  la lista de contenido de valor con tracking de quién entra.

## Notas
- Carilin estaba en la llamada pero tuvo que migrar a otra reunión (compartió link nuevo).
- Es un caso vitrina para AutoFlow: pone a prueba el asistente de chat en un evento
  real de alto tráfico → conviene que salga impecable dado el crash-loop actual del
  producto ([[entidades/estabilidad-producto]]).

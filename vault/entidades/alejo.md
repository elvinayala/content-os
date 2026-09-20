---
fecha: 2026-07-21
fuente: memoria
unidad: ai-borinquen
tags: [entidad, persona]
---
# Alejo (Alejo Muñoz) — consultor/director de IA

**Qué es:** Mentor y consultor de IA que Elvin trae para dirigir la arquitectura y la
validación del producto de [[ai-borinquen]] ([[autoflow]], voz, Borigat). Formalizado a
**$60/hora** en julio 2026. Voz técnica de confianza que valida decisiones de stack.

## Resumen acumulado
El "par técnico" de Elvin: filtro honesto para no caer en la trampa de "100 cosas a
medio construir". Su mantra — **"data primero, no IA primero"** — refuerza la tesis de
producto de Elvin (validar antes de escalar). Validó **N8N como puente principal para
WhatsApp** contra la resistencia de David y empujó la arquitectura Meta API. En el
arranque formal (14/07) acordaron: revisar **una plataforma a la vez** (Camila/voz
primero, luego Borigat), meta de **100–200 beta users** de la lista actual sin ads, y
la visión de **15–20 asistentes de voz verticales** (un agente por rol) optimizados
antes de escalar. Días martes/jueves/sábados; NDA de confidencialidad. También aparece
como el consultor que Elvin quiere sumar al producto de sector salud de [[yaritza-amaral]].
Es además una de las cuentas de competencia/referencia que el sistema sigue (alejo.munoz).

## Línea de tiempo
- 2026-07-02 — Primera sesión de consultoría: arquitectura, Meta API, "data-first"
  ([[2026-07-02-alejo-ai]]).
- 2026-06-19 — Elvin plantea traerlo como consultor director de IA para el producto de
  salud de [[yaritza-amaral]] ([[2026-06-19-yaritza-reunion]]).
- 2026-07-02 — Su criterio ancla la decisión de N8N como puente de WhatsApp
  ([[2026-07-02-carilin-estrategia]]).
- 2026-07-14 — **Arranque formal** $60/h, NDA, revisar Camila primero, beta de 100–200,
  15–20 asistentes verticales ([[2026-07-14-alejo-ia-mentor]]).
- 2026-07-18 — Segunda sesión técnica: vender agentes por rol, mantenimiento $297/$497,
  tier gratis como bono, **PostHog arranca el lunes**; guardrails al prompt cariñoso
  ([[2026-07-18-alejo-mentoria-ia]]).
- 2026-07-21 — Su diagnóstico de **observabilidad se vuelve política de empresa**: Elvin lo
  adopta en la revisión con Carilin (*"no estamos midiendo nada"*) — latencia, costo/minuto,
  errores, desvíos y guardrails por asistente, dashboard que los devs revisan a las 8 AM; el
  mantenimiento se recalibra a $197/$397 con precio por uso real
  ([[2026-07-21-carilin-revision-clientes]]).
- 2026-07-25 — **Sesión de mentoría IA / arquitectura y producto**: Elvin muestra mapa de modelos de Bori, Alejo asesora en fallbacks de proveedores, dos ambientes (prod + staging), CI/CD, PostHog obligatorio, benchmarking de modelos, arquitectura de memoria multicapa (futuro), concepto agente vs. chatbot. Decisión: **data first** — dashboard por cliente obligatorio lunes. Producto low-ticket (~$500) para retener leads. Validó que Sonnet 4.6 se depreca, hay que subir a Sonnet 5. Caso Cursor (6 personas, $100M/1.8 años, OpenAI). Sesión técnica aparte para revisar agentes de WhatsApp ([[2026-07-25-sesion-alejo-ia]]).
- 2026-07-25 — **Sesión con desarrolladores David + Juan**: diagnóstico de bloqueos Meta/WhatsApp, validó arquitectura (Cloudflare Workers + GoHighLevel), conclusión central "el problema es de proceso y comunicación, no técnico". Mayoría de errores Meta son restricciones de portafolio del cliente, no culpa del equipo. Documentación de Meta pésima. Acuerdos: catálogo de errores paso a paso, checklist pre-venta, adoptar PostHog + Evals, mejorar comunicación con clientes (explicar restricción de portafolio + plan de acción claro) ([[2026-07-25-sesion-desarrolladores-borinquen]]).
- 2026-07-25 — **Sesión de mentoría IA / arquitectura y producto** (segunda): Elvin muestra mapa de modelos de Bori; Alejo asesora en fallbacks de proveedores (multi-modelo, no dependencias únicas), dos ambientes prod+staging, CI/CD, PostHog obligatorio lunes, benchmarking de modelos (Nano, Higgsfield, Sonnet 4.6→5), arquitectura de memoria multicapa (futuro: relacional + embeddings + vectorial). Decisión central: **data first** — cada cliente necesita dashboard con métricas (llamadas, conversaciones, minutos). Producto low-ticket (~$500) para retener leads que no compran high-ticket. Validó que Sonnet 4.6 se depreca; referencia Cursor (6 personas, $100M/1.8 años, vendida a OpenAI). Próxima sesión técnica aparte para WhatsApp ([[2026-07-25-sesion-alejo-ia]]).

## Conexiones
[[autoflow]] — valida su arquitectura (N8N, un rol por agente). [[ai-borinquen]] — su
producto es lo que Alejo audita. [[yaritza-amaral]] — candidato a dirigir el producto de
salud. [[estabilidad-producto]] — su "validar antes de escalar" es la respuesta a los
crash-loops. [[perfil-ceo]] — comparten el "night hours = deep work".

---
name: bori-superplataforma
description: "La super plataforma de agentes de AI Borinquen (\"Bori\") — admin-first, dentro del repo AGENTE CONTENIDO"
metadata: 
  node_type: memory
  type: project
  originSessionId: 922377ad-0fd1-487f-a68a-0c3f620d032f
  modified: 2026-07-22T15:52:58.188Z
---

Elvin arrancó la **super plataforma de AI Borinquen** ("Bori") dentro del repo del
tablero (`AGENTE CONTENIDO`). Visión: vender un **sistema centralizado** (no un chatbot
suelto) — DFY (AutoFlow: voz+chat+CRM) + DWY (portal donde el cliente compra su agente
con un botón y lo entrena con info del negocio). Referencia visual: su app "Bori" de ads
(bori-production.up.railway.app) — **verde neón + mascota + voz PR "¡Wepa!"**.

**El producto es un PORTAL donde el cliente crea su AGENTE DE VOZ o su ASISTENTE DE CHAT**
y lo entrena solo con la info del negocio + conversaciones recientes. Vive en `app/borinquen/`
(admin-first: Elvin lo usa él primero) con tema scoped `.borinquen` (teal-esmeralda propio,
distinto del verde lima del Bori de ads) y sidebar propia. Marca = **AI Borinquen** (no "Bori
de ads"); **Bori** queda como el copiloto (reusa `/api/jarvis`).

**Feedback clave de Elvin (jul-2026):** la 1ª versión quedó muy calcada del Bori de ads
(dashboard de métricas). Lo corregí: home **product-first** (crear voz/chat → cómo funciona →
tus agentes), **wizard crear+entrenar** de 3 pasos (`/borinquen/crear`, tipo → negocio →
conversaciones), y **estética propia**. El corazón = **crear/entrenar agentes** (ambos tipos).
Modelo: `AgenteVoz` (voz, preset), `AsistenteChat` (chat, motor propio), `Entrenamiento`
(negocio+conversaciones → `armarPromptEntrenado` en `lib/borinquen/entrenar.ts`).

Decisiones (Elvin pidió "la mejor forma en tu opinión", saltó las preguntas):
- **Voz: Retell primero** por consistencia de latencia p95 (su dolor #1), detrás de un
  adapter (`lib/voz/`), mock hasta poner `RETELL_API_KEY`. Preset "muy probado" en
  `lib/voz/preset.ts`: Deepgram STT + Claude Haiku→Sonnet + ElevenLabs Flash voz PR +
  turn-taking semántico + generación preventiva + barge-in, objetivo <1s voz-a-voz.
- **Datos: JSON files** (patrón del repo) para el admin; Supabase multi-tenant + Stripe
  recién en el portal de clientes (fase posterior).
- **Móvil: PWA + Capacitor** (nunca React Native).
- **Asistente personal: Telegram primero** (WhatsApp restringido por Meta desde ene-2026).

Estado (verificado en preview): Centro de Comando, Voice Studio (crear/config/detalle
andan), CRM (Pipedrive **LIVE**, ~1500 leads reales), AutoFlow, Asistente y Conexiones
renderizan. Falta: wiring real de Retell + probar-llamada, CRM drag, AutoFlow crear,
Telegram webhook, PWA. Plan completo en `~/.claude/plans/necesito-crear-una-super-jazzy-lantern.md`.
Ver [[tablero-contenido]] y [[elvin-ceo-perfil]].

**Decisión de negocio (reunión Carilin 21-jul-2026):** Bori se lanza como **EMPRESA #3**
independiente — venta el **30 de agosto 2026**, arranque septiembre. No se amarra a Level Up
ni a AI Borinquen ("aliado tecnológico de las dos"). Venta self-serve: funnel automático sin
closer + soporte WhatsApp; plan anual ~$2,500 (2-3 meses de bono), pro ~$1,200, retención
~$500; closers 20% solo en ventas mes a mes. Encuadre de venta: 3 niveles de asistente
(reglas → chatbot IA → **agente conectado** = AutoFlow). Mantenimiento $197/$397 a notificar
el 1-ago a todos los clientes con asistente activo, con precio ajustado por uso real medido
(observabilidad estilo PostHog: latencia ~1,300-1,400 ms ideal, costo/minuto, guardrails).

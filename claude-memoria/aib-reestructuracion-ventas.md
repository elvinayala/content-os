---
name: aib-reestructuracion-ventas
description: "Reestructuración de ventas de AI Borinquen (21/sep/2026) — diagnóstico aceptado, decisiones de Elvin (Alexis Pérez, caras UGC, closer, pauta $75/día, Dragon Chat, precios, dos vías), qué se construyó (Portal AutoFlow, deck, pre-call, Conócenos) y qué queda"
metadata: 
  node_type: memory
  type: project
  originSessionId: aa372964-e132-40d0-94c5-ab3628f6ce22
  modified: 2026-09-21T15:42:17.628Z
---

**Qué pasó:** el 21/sep/2026 Elvin dijo que AIB estaba "colapsada en ventas" ($15-20K/mes al inicio →
$8-15K → **$4K al día 20 de septiembre** con $150-200/día de pauta). Pidió panorama y plan; aprobó el
plan de 30 días (`~/.claude/plans/ahora-mismo-necesito-una-breezy-gadget.md`).

**Diagnóstico que aceptó:** no es producto ni "la gente no compra IA": es demostración + confianza +
fugas ANTES del closer y cero medición. Datos duros del repo: no-show 50 %, 2,444 chats sin leer en
ManyChat AIB, pre-call escrito y sin montar, 1 solo MVP construido y nunca desplegado, campaña nueva en
borrador desde 13/sep, IG muerta por carruseles (el reel "comenta YO" hizo 43K vistas), solo 2
testimonios verificados (Teo/Mano Santa: 20 % → segundos; Milton/Caribe Paint), precios en conflicto.
Nombres que Elvin cree casos (Pam, Criso) NO existen; Dr. Alfred/Glenn/Skin Clinic son demos.

**Decisiones de Elvin (21/sep):**
- **"Alexis Pérez" = su nombre para AI Borinquen** (firma WhatsApp/emails como "fundador y CEO"; NO da
  la cara). Las caras son los **creadores UGC: Yulianna, Ed, Luisa**. Dijo que protege su identidad y
  duda si dar la cara en el futuro; le recomendé no bloquear el plan por eso y revisarlo el 12/dic.
  Contratos/facturas/Stripe siempre a nombre real o IA Market.
- Dashboard del closer en `app/borinquen` (Content OS), no en heybori.ai.
- **Mensualidades: $147 chat · $297 voz · $497 ambos**; el inicial lo dejó a mi criterio → $1,500 /
  $2,500 / $3,500 (aprobado con el plan). Capacitación: **las dos** (Academia AIB grupal $2,500 y 1:1
  $4,000/4 meses). Setter rutea la vía; el closer presenta UNA.
- Juan David (colombiano) sigue de closer; la llamada abre con video PR (creadores + casos).
- Pauta baja a ~$75/día (mitad retargeting con testimonios/portal, mitad prospección nueva) hasta CPL < $10
  y show > 60 %.
- El WhatsApp del asistente de closer sale por **Dragon Chat** (lo opera Liz; también el rescate de
  ~5,000 contactos). No hay integración en el repo: lista diaria de agendados + plantillas.

**Construido el 21/sep:** Portal AutoFlow completo (fase 1 + solicitudes + leads del chat + voz
embebida + modo producción), deck de 12 slides con apertura PR y `--via capacitacion`, plantillas con
precios y link del portal, secuencia de pre-call para Dragon Chat, página Conócenos, migración
`0004_autoflow_portal` aplicada en Supabase, secretos generados en `.env.local`. Detalle en CLAUDE.md
("El Portal AutoFlow y la reestructuración de ventas de AIB").

**Lo que le toca a Elvin / pendiente:** copiar `AUTOFLOW_PORTAL_SECRET` y `RETELL_WEBHOOK_SECRET` a
Vercel; API key de ActiveCampaign; aprobar y mandar el DM a Kasey; escribir el párrafo "quiénes somos"
de Alexis y el guion del video de 90 s (Yulianna lo graba con el celular); fecha del día de grabación;
pedir testimonios en video a Teo, Milton, Lizardo, Parada Típica, Yaritza; subir Conócenos a Netlify;
scoreboard semanal AIB (F1) y reescritura del calendario AIB de octubre (F5) quedaron sin construir.

**How to apply:** cualquier venta de AIB pasa por el portal (`demo.mjs todo` lo registra); precios solo
desde `PRECIOS` en `demo.mjs`; testimonios solo Teo y Milton hasta que haya más grabados; el
prospecto debe tocar su portal antes de la llamada (toque de las 24 h). Ver [[plan-de-guerra-q4]],
[[elvin-ceo-perfil]], [[ecosistema-lu-aib]], [[micro-influencers-pr]].

**Canal de WhatsApp para clientes AutoFlow (21/sep/2026):** Elvin preguntó si Zernio sirve para clientes; respuesta: sí, con el WABA bajo el Meta Business DEL CLIENTE (activo de ellos), $6/mes por cuenta (3–10, luego $3), inbox web incluido, sin App Review por cliente, conversaciones iniciadas por el cliente sin fee de Meta. Riesgo: empresa joven → el canal es un adaptador de 1 archivo y el número es del cliente. Resuelto ([[plomeria-pr-vision]]) es el piloto; si funciona, es el camino para el chat de $1,500+$147 / $3,500+$497 mientras la app de Meta de Hey Bori madura (Embedded Signup propio después).

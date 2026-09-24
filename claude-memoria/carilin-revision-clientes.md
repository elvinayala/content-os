---
name: carilin-revision-clientes
description: "Cómo se le reporta a Carilin sobre clientes de Level Up — breve, solo lo nuevo/cambiado/riesgo, alto ticket bajo la lupa, sin repetir; el libreto largo diario está prohibido"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c12b9463-db18-4960-808d-58c3790c8e33
  modified: 2026-09-20T19:46:27.494Z
---

Elvin (20/sep/2026): el resumen diario largo de clientes que le llegaba a Carilin era
"demasiada información y repetitiva" — el mismo caso día tras día aunque ya se hubiera
respondido o cambiado. Lo reemplazó `/revision-clientes` (tarea `revision-clientes-carilin`,
L-Sáb 6 PM) con memoria en `data/clientes-revision.json`.

**Reglas:** solo alertas nuevas o que empeoraron · clientes molestos/insatisfechos/riesgo ·
**pago ≥ $1,500 = "lupa" 30 días** · recordatorio de 1 línea máximo cada 72 h (3ª vez →
escalar a Elvin) · máximo 8 líneas · sin wins, sin actividad, sin inactivos (lunes 1 línea)
· si no hay nada, 1 línea o nada · economía de tokens (solo lo nuevo, ~12 llamadas MCP).

**Why:** Carilin ejecuta; necesita recordatorios y prioridades, no un informe.
**How to apply:** cualquier mensaje operativo a Carilin (o a cualquiera del equipo) sigue
esta vara: breve, accionable, sin repetir lo ya dicho. El "RESUMEN DIARIO DE CLIENTES" viejo
salía de Claude en Slack (claude.ai), NO de este repo: Elvin debe apagarlo allá.
Relacionado: [[alertas-clientes-criticos]], [[organigrama-equipo]].

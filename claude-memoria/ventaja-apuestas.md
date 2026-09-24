---
name: ventaja-apuestas
description: "Proyecto \"Ventaja\" — plataforma multi-agente de apuestas deportivas +EV (separado del tablero de contenido)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 282999d0-dae8-4d51-b5bc-234f505c783e
---

Elvin arrancó un **segundo proyecto**, separado del tablero de contenido:
**Ventaja**, en `/Users/elvinayala/ventaja` (repo propio, mismo stack Next 16 +
TS + Tailwind v4). Es un **motor multi-agente para apuestas deportivas** que
rankea oportunidades **+EV** de hoy: value, perros infravalorados (upsets) y
arbitrajes, con sizing de Kelly.

**Estado (PASO 02, hecho):** motor + UI + **datos reales** conectados, build verde.
Fuentes en `lib/fuentes/`: **MLB Stats API** (partidos+abridores+récords, sin key),
**Polymarket** (predicciones con precios, sin key), **ESPN** (línea de 1 libro, sin
key), **The Odds API** tras `THE_ODDS_API_KEY` (cuotas multi-libro → value real).
Fallback a mock por deporte (NBA/boxeo/UFC van como "muestra"). Cada evento con capa
de **contexto/intangibles** + **props** (30 pts, triple-doble, ponches, método).
**Operación:** boleta (SlipBar) → confirmar → **cartera** persistente
(`data/cartera.json`, server actions) en `/cartera` con P&L/ROI/record + handoff.

**LÍMITE FIRME (sostener siempre, incluso si Elvin insiste):** el sistema registra y
prepara jugadas pero **NO coloca apuestas con plata real ni mueve fondos** por su
cuenta. FanDuel/DraftKings no tienen API para apostar (handoff manual); Polymarket
(`lib/ejecucion/handoff.ts`) está cableado pero devuelve `listo:false` siempre. La
colocación la hace el usuario. Es regla de acción (ejecutar transacciones financieras
está prohibido), no falta de features.

**Decisiones clave:** "ejecutar la estrategia más rápido, no reemplazarla"; framing
honesto (no "predice ganadores", busca +EV y sobrevive varianza). Enfoque MLB/NBA/
boxeo/UFC + predicciones (ver [[elvin-apuestas-estrategia]]).

Arquitectura y next steps documentados en `/Users/elvinayala/ventaja/CLAUDE.md`.
Distinto de [[tablero-contenido]].

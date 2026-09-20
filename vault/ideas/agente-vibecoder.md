---
fecha: 2026-09-19
estado: en construcción en otra sesión (Elvin lo pidió el 19/sep)
trigger: —
---
# Agente "vibecoder" — el que reemplaza a Elvin en el día a día de Bori

**Qué es:** un agente parecido a Sofi pero para desarrollo: hace los ajustes, mejoras y bugs de
**Bori** (heybori.ai) y demás productos, para que Elvin deje de pasar el día "haciendo ajustes".
Lo está creando otra sesión.

**Para que nazca integrado (no aislado):**
- Canal: mismo bot de Telegram (`@eamarket_sofi_bot`, puente en Railway) con su propio prefijo
  (`/dev …` o el nombre que le pongan), igual que `/sofi` y `/jarvis`. Un solo chat para todos.
- Reglas del repo de Bori (`~/Documents/Claude/Projects/ai borinquen plataforma/`, memoria
  `bori-backend-real`): leer `TRASPASO.md`, `npm test` antes de push, las 5 trampas (JS inline,
  3 lugares del schema, cobrar-antes-de-entregar, índices en migrate, CORS R2), verificar
  `/api/status` tras deploy, marcar bugs arreglados en Equipo → Fallos.
- Constitución de producto del Core (memoria `elvin-aib-core-vision`): uso real antes que infra,
  6 preguntas antes de cualquier feature, product review semanal, nada desechable.
- Reporta a Elvin por Telegram: qué arregló, qué probó, qué quedó; nunca "hecho" sin verificar.
- Presupuesto: límite de turnos/costo por pedido (aprendizaje del 19/sep: un agente sin freno
  gastó $5.60 intentando arreglar un deploy solo).

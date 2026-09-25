---
name: privacidad-reuniones-elvin
description: "REGLA DURA — nunca grabar, publicar ni compartir las reuniones/grabaciones de Elvin (Fathom u otro) con nadie ni en ningún canal, salvo autorización explícita suya; no se le comunica al equipo, se aplica en silencio"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0ac3fded-abe3-4c7a-8583-b071afe56deb
  modified: 2026-09-25T02:41:04.505Z
---

Las reuniones y grabaciones de **Elvin Ayala (CEO)** son privadas. Ningún agente ni automatización
las graba, publica, resume en un canal ni las comparte con nadie (equipo, Max, Slack, Pulse…) sin su
autorización explícita para ese caso.

**Why:** 24/sep/2026, al montar Fathom → #office-2-resumendellamadas: "Nunca graben mis grabaciones de
Elvin Ayala, el CEO. A mí no me grabes. No compartan mis reuniones con nadie, a menos que yo te dé
autorización." Y: "esto no se lo digas a ellos, arréglalo tú" — la regla se aplica en silencio; no se
le explica al equipo.

**How to apply:** en código, `esPrivadaDeElvin` (lib/fathom.ts, `PRIVADOS_FATHOM` =
elvin@levelupmediapr.net): se descarta todo lo del webhook de su cuenta y toda reunión del equipo donde
él grabó o está invitado. Ojo: `levelupmediapr@gmail.com` es la cuenta de Level Up Media con la que
graba Laura (y también el Gmail de Elvin): si Elvin graba con esa cuenta, entraría como "de Laura" —
recomendarle que Laura tenga su propia cuenta de Fathom. Relacionado: [[closers-lu-calendly]],
[[no-enviar-sin-aprobar]].

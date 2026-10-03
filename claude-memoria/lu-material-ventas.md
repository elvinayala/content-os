---
name: lu-material-ventas
description: "Material de venta de Level Up (2/oct/2026) — película motion + versiones, demo para closers, charla de Elvin; dónde viven y qué clips/testimonios hay"
metadata:
  node_type: memory
  type: project
  originSessionId: c8e753a4-fd9d-48f0-bf9f-8455c1991aa0
  modified: 2026-10-03T00:19:14.067Z
---

Del Canva de Level Up (8 páginas: testimonios + 8 casos + método + Comencemos) salió todo esto (2/oct/2026):

- **Películas (Remotion)**: `LuPelicula` (2:31) y `LuVersiones` → `LuDatos`/`LuDatosVertical` ("Los números hablan", 1:02, música de suspenso que explota en el seg. 20 con el total +24,700 conversaciones = suma de 7 casos) y `LuVoces`/`LuVocesVertical` ("En sus palabras", 1:51, hip hop, Antes→Después→Consejo). Copias en `~/Downloads/Level Up - peliculas/` y en la bandeja (Storage, link firmado 1 año).
- **Clips de testimonio cortados (solo habla el cliente)** en `motion/public/lu-peli/*.mp4` (NO van a git): Dr. Bryan Vega, Robert (RK), Oliver (Tinos), Dra. Grissel, Magdalys (+80 %), Reina (Mr. iPhone, Mayagüez, +50 %; apellido sin confirmar), Lcdo. Ernest Crisson (+$5K/mes; cliente de AIB, recortado del Zoom sin etiqueta AIB), y una clienta por videollamada sin nombre (baja resolución, ya no se usa).
- **Demo para closers**: https://lu-demo-ventas.netlify.app (repo `demos/decks/level-up-demo-ventas/`), 7 testimonios + casos + método. **COMPULSORIA en cada llamada** (Elvin, 2/oct; avisado a Nahuel y Aure): closers hablan menos y se apoyan en testimonios, casos y el método.
- **Charla de Elvin** "Las conversaciones son dinero" (primera vez como speaker, 3/oct): https://elvin-charla-level-up.netlify.app + `/notas.html`; repo `demos/decks/charla-elvin/` (armar.py genera; guion con fuentes en guion-charla.md). Se quitó el 78 %/67 % por no tener fuente. **v2 (2/oct): 12 slides, AutoFlow primero → marketing (estrategia validada, no anuncios sueltos) → ecosistema; de Elvin solo una línea ("CEO de Level Up Media y otros negocios digitales, y una empresa de IA").**

**Why:** Elvin quiere "proyectarnos como lo máximo… los resultados hablan" y que los closers presenten con esto.
**How to apply:** para nuevas versiones, reusar `LuVersiones.tsx` (bloques en datos) y los clips de `motion/public/lu-peli/`; el Dr. Vega dice sus números por SEMANA en video (el vault dice por mes) — que los diga él. Ver [[remi-motion]], [[kit-ventas-aib]].

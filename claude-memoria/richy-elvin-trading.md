---
name: richy-elvin-trading
description: "Nuevo negocio de trading con Richy (Richy & Elvin Trading LLC) — comunidad $50/mes, curso ~$700, bot EA ~$15K; demo en demos/richy-elvin-trading/"
metadata: 
  node_type: memory
  type: project
  originSessionId: 35205f4b-e274-449e-acb8-2565deac6ad5
  modified: 2026-08-10T02:09:27.523Z
---

**Richy & Elvin Trading LLC** — negocio de trading que Elvin arma con Richy (su mentor de trading; mentoría del 2/ago/2026 en Granola). Simulación por ahora, con miras a ser real.

- **Estrategia** ("el recuadro", sin nombre oficial aún): marcar la vela alcista anterior al impulso contrario, esperar retesteo + vela de rechazo, entrar 1:2 (hasta 1:4), break even a 1R, no operar en acumulación. Análisis en TradingView, ejecución en MT5, backtest en FX Replay (6 meses).
- **Modelo de ingresos**: comunidad/live trading $50/mes (el ingreso fijo), curso ~$700, y **bot** (EA de MT5 que ejecuta la estrategia solo) a vender en ~$15K la licencia. Idea de viaje a Dubai para contenido.
- **Marca: 1000X** ("ghost terminal") — assets en `demos/richy-elvin-trading/brand/` (origen: ~/Downloads/brand-assets). Paleta: VOID #050807, CHARCOAL #0A0F0C, PHOSPHOR #00FF87 (acento, máx 10% del área), GHOST #E6F2EB, STATIC #5C6662. Tipografía IBM Plex Mono (bold titulares, tracking .12em en wordmark "1000X_"). Reglas de marca: verde solo acento, **nunca mostrar caras**. Taglines: "ACCESS GRANTED TO FEW", "NO FACE. ALL SIGNAL." La LLC queda como entidad legal en el footer.
- **Entregables (ago/2026)**: landing demo en `demos/richy-elvin-trading/index.html` con el branding 1000X (dark-only, fuentes embebidas como data URI, banner de MOCKUP) + prototipo del bot `demos/richy-elvin-trading/bot/RecuadroEA.mq5` (sin compilar/backtestear aún).
- **Landing LIVE**: https://1000x-trading.vercel.app (proyecto Vercel `1000x-trading` en la cuenta de Elvin, deployado con `npx vercel` desde un dir limpio solo con index.html — el .mq5 del bot NUNCA se publica, es el producto). Para redeploy: copiar index.html a un dir `1000x-trading/` y `npx vercel deploy --prod --yes`.
- Richy graba el curso con Loom. Próximos pasos de Elvin: cuenta TradingView, practicar marcado, backtest en FX Replay.
- Contenido/copy en tuteo PR ([[voz-espanol-pr-tuteo]]). Cuidado legal: nunca prometer retornos; disclaimers de riesgo ya en el footer de la landing.

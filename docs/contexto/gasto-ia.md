## Gasto de IA: el modelo lo escoge la tarea (28/sep/2026)

Elvin: "mira a ver si necesita Opus 5.5 para todo… diseño, desarrollo, planeación no lo vamos a escatimar,
pero hay cosas breves que se pueden automatizar para Sonnet". Real del 28/sep: **Nico $22.25 en un día** (26
corridas, todo Opus 5.5) vs. **Max $1.00** (ya elegía por tarea). Ahora los dos eligen:
- **Nico** → `scripts/nico-gasto.mjs` (`modeloParaNico(texto, origen)`, tests `tests/nico-gasto.test.mjs`):
  Opus 5.5 para construir/diseñar/planear/arreglar producción/briefs largos · Sonnet para diagnosticar,
  consultar y la ronda diaria y el diagnóstico de solicitudes del equipo (solo lectura) · Haiku para trámites
  y el cierre del día. Al aprobar una solicitud (`ok <id>`) la ejecución se reclasifica. `/opus …` fuerza;
  `NICO_MODELO` fija uno. Aviso a Elvin al pasar `NICO_TOPE_DIA` ($15) y al doble; no se bloquea.
- **Max** → `scripts/max-gasto.mjs` (igual, con topes que sí frenan: $10/día, $25/semana).
- **En el servidor** (corren en cada evento, no necesitan criterio): nicho de un lead → Haiku; reportes de
  encuestas, Preguntarle al CRM y el onboarding de AIB → Sonnet. **Siguen en Opus** el Director Creativo
  (`DIRECTOR_MODEL`, es criterio de Elvin sobre piezas) y Max planeando.
- El modelo usado sale en el log de cada corrida (`claude ‹ fin … opus|sonnet|haiku`) y el costo real por
  agente y día está en `/ritmo/agentes`.

**Gasto de Claude Code en la Mac (19/oct/2026)**: `node scripts/uso-claude.mjs [días]` mide el gasto real de las transcripciones
(ponderado por costo). Línea base de 7 días: 1,470M equivalentes; 66% workflows multiagente, 31% llamadas con > 300K de
contexto. Medidas: `CLAUDE.md` pasó de 73K a 3.5K tokens (índice + `docs/contexto/`), vuelve el aviso de costo antes de
lanzar un workflow y la compactación automática tiene tope de 400K (`CLAUDE_CODE_AUTO_COMPACT_WINDOW` en `~/.claude/settings.json`).

**Reporte semanal y nube (19/oct/2026)**: `scripts/reporte-gasto-ia.mjs` (launchd `com.iamarket.gasto-ia`, lunes 8 AM, sin Claude)
le manda a Elvin por el bot de Nico el gasto de la Mac vs. la línea base y el de los agentes en la nube (semana vs. anterior,
de `desempeno_agentes_reportes`). Sale por el bot de Nico. El `TELEGRAM_BOT_TOKEN` de la Mac
estaba vacío y los avisos caían solo a Slack; se copió de Railway (`puente`) el 19/oct. Nico, puente (Sofi), Max y Lola tienen `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` en Railway
(su sesión de cada día se retoma con `--resume` y crecía sin tope). Estimado con las llamadas reales: −31% en la Mac.

---
name: memoria-compuesta
description: La memoria compuesta del Content OS — vault de entidades + síntesis destilada (ángulos/objeciones/ideas/decisiones) que alimenta a Jarvis y a la fábrica de contenido
metadata: 
  node_type: memory
  type: project
  originSessionId: c12b9463-db18-4960-808d-58c3790c8e33
---

El Content OS tiene una **memoria compuesta** sobre el vault (Obsidian-style) que convierte reuniones/llamadas/chats en data accionable. Construida jul-2026 sobre los cimientos existentes (vault/, /sync-vault, Jarvis).

**Capas:**
- **Grafo de entidades** — `lib/memoria.ts` (`construirGrafo`, `leerEntidad`, `entidadesMasConectadas`). Extrae [[wikilinks]] de TODAS las notas del vault → entidades con conteo de menciones. Ya funciona con las ~55 reuniones existentes.
- **Notas de entidad** — `vault/entidades/<slug>.md` (una por cliente/persona/tema/objeción), con Resumen acumulado + Línea de tiempo + Conexiones. MERGE, nunca overwrite. Las crea/enriquece `/sync-memoria` (tarea `sync-memoria-diario` 6:54 AM local, necesita MCP Granola/Slack).
- **Síntesis destilada** (los 4 docs que hacen que el equipo produzca con DATA no intuición) en `vault/estilo/`: `angulos-ganadores.md`, `objeciones-reales.md`, `ideas-de-data.md`, `decisiones-negocio.md`. Las regenera `/destilar-memoria` (tarea `destilar-memoria-diario` 7:10 AM, NO necesita MCP, lee archivos).

**Consumo:**
- **Jarvis** (`app/api/jarvis/route.ts`): tools nuevas `leer_entidad` ("qué sabemos de X" = nota + todos los backlinks) y `sintesis` (angulos-ganadores|objeciones-reales|ideas-de-data|decisiones-negocio). `buscar_memoria` ya existía. VERIFICADO: Jarvis responde con data real (78% de Laura, Tinos, terapista).
- **Fábrica** — `/guiones-valentina`, `/fabrica-contenido`, `/atender-pedidos` ahora leen los 4 docs de síntesis como input: producen desde ángulos/objeciones reales.
- **UI** — sección "Memoria compuesta" en `/ceo/vault` (síntesis + entidades más conectadas) + página de entidad `/ceo/memoria/[entidad]`.

**Gotchas:** serverless read-only (síntesis/entidades las escriben tareas LOCALES + deploy-snapshots; Jarvis/UI solo LEEN el vault bundleado). Los comandos de la fábrica leen vault/estilo/* por NOMBRE exacto (hay que agregar la línea de lectura, ya hecho). Ver [[circuito-contenido-equipo]], [[tablero-contenido]].
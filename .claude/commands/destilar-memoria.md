---
description: Destila la memoria compuesta en los 4 documentos vivos que el equipo usa para producir con DATA — ángulos ganadores, objeciones reales, ideas de contenido y decisiones de negocio
argument-hint: [vacío]
---

Sos el **analista de memoria** (Mateo + Santi). Leés TODA la memoria acumulada y la
convertís en 4 documentos accionables que la fábrica de contenido consume como
input obligatorio. Hora America/Puerto_Rico. NO necesitás MCP: leés archivos.

## 1. Leer la memoria
- `vault/reuniones/*.md` (decisiones, action items, clientes, objeciones)
- `vault/slack/*.md` (wins, señales, cierres del día)
- `vault/entidades/*.md` (el grafo acumulado — clientes/temas/objeciones)
- `vault/ceo/*.md` (criterio de Elvin, mentores, estrategias)
- `vault/mentorias/*.md` (baúl de mentorías — frameworks de cierre de ventas y
  objeciones, ej. Mariano Segura: alimentan objeciones-reales y ángulos)
- `vault/estilo/*.md` (voz/ángulos actuales + aprendizajes de Elvin)
- Objeciones de Zoom si hay snapshot.

## 2. Regenerar los 4 documentos (REEMPLAZO total, pero conservando lo válido)
Escribí cada uno en `vault/estilo/` con frontmatter estándar
(`fecha: <hoy>`, `fuente: memoria`, `tags: [sintesis, ...]`), empezando con su H1.
Cada afirmación **aterrizada en data real del vault** (citá [[fuente]] o "(fecha)").
Nada inventado; inferencias marcadas "(hipótesis)".

1. **`vault/estilo/angulos-ganadores.md`** — "# Ángulos ganadores (de data)".
   Ángulos que funcionan (por cierres, bombazos, temas recurrentes), POR MARCA,
   con evidencia y avatar. 8-14.
2. **`vault/estilo/objeciones-reales.md`** — "# Objeciones reales (de las llamadas)".
   Objeciones de venta con cita + ángulo que las rebate.
3. **`vault/estilo/ideas-de-data.md`** — "# Ideas de contenido (de data)".
   12-18 ideas concretas (hook + señal de origen + marca + formato).
4. **`vault/estilo/decisiones-negocio.md`** — "# Decisiones de negocio (del histórico)".
   Decisiones/patrones + cuándo se tomaron + estado (vigente/en curso/pendiente).

Validá cada .md: abre con `---` frontmatter, luego `# H1`. Español claro (interno).

## 3. Deploy
`bash scripts/deploy-snapshots.sh`.

Reportá 3-5 líneas: cuántos ángulos/objeciones/ideas/decisiones y 2-3 destacados.
Estos 4 documentos son la razón por la que el equipo produce con DATA y no por
intuición — mantenelos frescos.

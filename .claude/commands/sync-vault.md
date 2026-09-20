---
description: Sincroniza el vault — baja reuniones nuevas de Granola y resume el día de Slack como notas conectadas
argument-hint: [vacío = todo | "reuniones" | "slack"]
---

Sos el bibliotecario del Content OS de Elvin. Tu trabajo es mantener el vault
(`vault/`) al día: cada reunión y cada día de Slack queda como nota markdown
conectada. Hora local: America/Puerto_Rico.

Argumentos: `$ARGUMENTS`

## 0. Estado

1. Leé `vault/.sync.json` si existe: `{ "ultimaReunion": "<ISO>", "ultimoSlack": "<YYYY-MM-DD>" }`.
   Si no existe, arrancá con los últimos 7 días.
2. Formato de nota (respetalo SIEMPRE):

```markdown
---
fecha: YYYY-MM-DD
fuente: granola | slack | manual
unidad: level-up | ai-borinquen | shadow-operator | ecosistema
tags: [tag1, tag2]
---
# Título

cuerpo con [[wikilinks]] a clientes, marcas y otras notas
```

## 1. Reuniones (Granola) — si `$ARGUMENTS` no dice "slack"

1. Con el MCP de Granola (`list_meetings` / `get_meeting_transcript`): listá las
   reuniones DESPUÉS de `ultimaReunion`.
2. Por cada reunión nueva → `vault/reuniones/YYYY-MM-DD-<slug-titulo>.md`:
   - Resumen ejecutivo (3-5 líneas).
   - **Decisiones** tomadas (bullets).
   - **Action items** con responsable si se mencionó.
   - Wikilinks: [[Cliente X]] si se habló de un cliente, [[level-up]] /
     [[ai-borinquen]] / [[shadow-operator]] según la unidad.
   - `unidad` inferida del contenido.
3. NO guardes el transcript completo (la nota es el destilado); si algo es
   textual clave, citalo corto.

## 1b. Cerebro del CEO (`vault/ceo/`) — SIEMPRE que haya reuniones nuevas

El vault tiene el **perfil de CEO de Elvin** en tres notas vivas:
`vault/ceo/perfil-ceo.md` (prioridades, dolores, a mejorar, fortalezas),
`vault/ceo/mentores.md` (playbook de mentores) y
`vault/ceo/estrategias-contenido.md` (frases/frameworks propios → ángulos). Hay
que **mantenerlas al día**, no reescribirlas de cero.

1. De las reuniones nuevas que procesaste, extraé señales de CEO: prioridades,
   cosas que le duelen, qué necesita mejorar, estrategias, **frases textuales
   propias de Elvin** y consejos de mentores con dato duro.
2. Mentores a vigilar (sesiones 1-on-1 o Inner Circle): **Ramiro, Matías, Oscar
   Moisés, Joe Lajara, Hamilton, Laura** y cualquier mentor/consultor nuevo.
   Internas de valor: **Carilin, Aure, closers, capacitaciones**.
3. **MERGE, no overwrite** (regla de señal vs ruido): agregá SOLO lo nuevo o lo
   que cambió; no dupliques lo que ya está. Si una prioridad/dolor evolucionó,
   actualizá esa línea. Si es un mentor nuevo, agregá su bloque en `mentores.md`.
   Frases nuevas y potentes → `estrategias-contenido.md`. Mantené el tono y el
   formato de cada archivo.
4. Si hay cambios de fondo (nueva prioridad, dolor resuelto, giro de estrategia),
   reflejalos también en la **memoria** `elvin-ceo-perfil.md` (ver sección 2b).

## 2. Slack — si `$ARGUMENTS` no dice "reuniones"

1. Con las tools de Slack y los canales de `data/fuentes.json` (wins + críticos
   de cada unidad conectada): resumí la actividad desde `ultimoSlack`.
2. Una nota por día → `vault/slack/YYYY-MM-DD.md`: wins del día, situaciones y
   su estado, señales sueltas. Wikilinks a clientes y marcas.
3. Si ya existe la nota del día, reescribila completa (snapshot del día).

## 2b. Slack → memoria — cosas relevantes que dice ELVIN

En el barrido de Slack, si **Elvin mismo** (no el equipo, no un bot) dice algo
que es material de identidad/estrategia — una prioridad nueva, una decisión de
negocio, un principio, un dolor, una frase potente, un giro de rumbo — guardalo
en la **memoria del proyecto** (directorio `memory/` en
`~/.claude/projects/-Users-elvinayala-AGENTE-CONTENIDO/`), NO solo en la nota de
Slack del día.

1. Actualizá el archivo de memoria `elvin-ceo-perfil.md` (tipo `user`): sumá o
   ajustá la línea que corresponda (prioridad / dolor / a mejorar / voz). Si es un
   tema aparte y grande, creá un archivo de memoria nuevo (kebab-case) con su
   frontmatter y sumá el puntero en `MEMORY.md`.
2. **Antes de escribir**, releé la memoria existente: si ya está, no dupliques;
   actualizá la línea. Solo lo que valga a futuro (no operativa del día).
3. Lo relevante de negocio también puede ir a `vault/ceo/` si aplica (misma regla
   de merge). Ignorá ruido: saludos, coordinación, quejas puntuales sin decisión.

## 3. Cierre

1. Actualizá `vault/indice.md`: links a las notas nuevas en su sección.
2. Escribí `vault/.sync.json` con los cursores nuevos.
3. **Deploy a producción** (para que el vault en la nube no quede viejo): corré
   `bash scripts/deploy-snapshots.sh`. Sube `data/` y `vault/` a Vercel (~1-2 min;
   usa `VERCEL_TOKEN` si está, si no la sesión del CLI). Si falla, reportalo pero
   NO reintentes en loop — las notas ya quedaron escritas.
4. Respondé en 3-4 líneas: cuántas notas de reuniones, cuántas de slack, **qué
   actualizaste del cerebro del CEO (`vault/ceo/`) y de la memoria**, si el deploy
   salió bien, y cualquier fallo. NUNCA dejes una nota a medias ni frontmatter inválido.

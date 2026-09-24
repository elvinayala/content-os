---
name: voz-espanol-pr-tuteo
description: Todo el contenido/copy de Elvin va en español de Puerto Rico con TUTEO — nunca voseo argentino
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c12b9463-db18-4960-808d-58c3790c8e33
---

Todo lo que se escriba para Elvin (guiones, emails, carruseles, historias, captions,
CTAs, copy de cualquier marca) va en **español de Puerto Rico con TUTEO**:
tú, tienes, quieres, puedes, sabes, dejas, respondes, tu, contigo, mira, deja, comenta.

**PROHIBIDO el voseo argentino:** vos, sos, tenés, querés, podés, sabés, dejás,
respondés, mirá, dejá, comentá, agendá, seguí. Tampoco "che" ni modismos rioplatenses.
(OK: "tuyo/tuya", "estás", "vas" — son válidos en tuteo.)

**Tampoco basta con evitar el voseo: hay VOCABULARIO rioplatense que se cuela sin
verbos.** En PR NO se dice **"chico/chica"** para algo pequeño (agosto 2026: Elvin
corrigió "¿Te sirve algo más chico?" en la oferta de retención de Bori → quedó "un
plan más económico"). Misma familia: plata (→ dinero/chavos), laburo, pibe, guita,
remera, ordenador (→ computadora), vosotros (→ ustedes).

**Why:** Elvin y su equipo/audiencia son de Puerto Rico / Latam (no Argentina). En
julio 2026 el primer lote de guiones y emails salió en voseo y hubo que corregir 26
piezas a mano.

**How to apply:** En Bori el build lo hace cumplir solo: `test/frontend.test.js`
escanea el copy visible de `public/index.html` y falla si aparece voseo o vocabulario
rioplatense (desescapa los `\uXXXX` primero — si no, las palabras con acento pasaban
limpias). La regla dura vive en el repo en `vault/estilo/estrategia.md`
(transversal a las 3 marcas) + recordatorio en cada `vault/estilo/<marca>.md` y en
los comandos `/guiones-valentina` y `/emails-listas`. Al generar contenido, validar
que NO haya voseo antes de guardar. Aplica también a otros proyectos (Ventaja, Bori).
Ver [[circuito-contenido-equipo]], [[elvin-ceo-perfil]].
---
name: ave-daren-referencia-detalles
description: Detalle por detalle de la edición profesional del MISMO video que edita Cortex (Daren ADS Sept 4) — la vara de calidad; aplicar siempre sin que Elvin lo repita
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 11dd585d-9f78-448a-bf8a-62785c9be54f
  modified: 2026-09-17T13:42:46.136Z
---

Elvin (17/sep/2026): "mira el mismo video editado 10 veces mejor... no me sigas haciendo ediciones
mediocres... guarda estos detalles y aplícalos sin esperar que te lo repita... conviértete en un editor de
calibre mundial". Referencia: `samples/references/daren-ads-sept-4.mp4` (54.5 s, mismo material que
`projects/20260916-221112-img-4590-1`). **Why:** la brecha entre mi v11 y esta edición es la brecha del
producto. **How to apply:** cada uno de estos detalles debe salir del pipeline por defecto.

**Encuadre:** punch-in cerrado: cara ≈ 25 % del alto, cabeza cerca del borde superior, pecho abajo. Mi
v11 dejaba al hablante pequeño con planta y cuerpo entero → SIEMPRE reencuadrar a cara 22–27 %.

**Captions:** frase pequeña en minúscula, fina, blanca con sombra, centrada a la altura del PECHO (y≈0.42).
Énfasis justo debajo, negrita MAYÚSCULA con sombra dura: rojo "3D" para dolor ("COMO SI FUERAN
FREELANCERS", "CONTESTAN LOS DM", "PERSIGUEN LOS LEADS", "HACEN LAS LLAMADAS"), blanco para promesa/
método ("MEJORES ÁNGULOS", "PERSONAS CORRECTAS", "UN EMBUDO SIMPLE"). Tras el énfasis vuelve a la letra
normal pequeña. Listas: **un mismo b-roll (foto del hombre con el celular) y los ítems en rojo van cambiando
uno tras otro encima** (bullets).

**Cifras (callouts, no captions):** "$5,000" y "$20,000" en VERDE grande con contorno oscuro al lado de la
cara, con pop; "$10.000 mensuales" y "$20.000" del cierre en BLANCO grande estilo metálico. Al mencionar
dinero: **lluvia de billetes** (fajos cayendo) sobre el hablante, y al final billetes cubriendo todo el
fondo. "No queremos millones de views" → **contador que sube** "27,778 → 759,259 views" (como si fuera
al infinito). "que llegue a más personas" → **lluvia de iconos de personas verdes**.

**Cambios de edición / mood:** "pero escalar se vuelve mucho más difícil" → el plano pasa a **blanco y
negro con viñeta y trama** (mood cambia) y vuelve a color. "mejores ángulos" → punch-in con **contorno
naranja brillante** del hablante (glow). Entradas/salidas de b-roll con **glitch RGB / chromatic split**
(2–3 frames), no solo blur. B-roll: fotos stock editoriales (hombre con celular), **fondos de color sólido
con objeto 3D** (fajo sobre cyan), ilustración flat morada, **robot 3D sobre verde con burbujas de chat**
(sistema), todo 2–4 s, ~20 % del video.

**CTA:** "haz clic aquí abajo" con **cursor** que entra y clic; termina en "agenda una llamada".

**Audio:** música todo el tiempo (mezcla −18 LUFS), ~59 transitorios: SFX en cada cifra (cash), en
cada entrada de b-roll/overlay (whoosh), pops en énfasis, riser antes del cambio B/N.
**Implementado (17/sep, v12–v17 del video real):** encuadre cerrado automático (cara 13 % → 25 %), callouts
verdes con pop + lluvia/pila de billetes, contador de views, personas verdes, B/N con viñeta en la frase
dramática, glitch RGB en bordes de b-roll, cursor con clic en el CTA, lista con foto sostenida e ítems rojos uno
por vez, SFX ligados (cash/pop/whoosh/riser/click), tope 20 %. Comparado lado a lado con la referencia.
Sesión 8 (17/sep, v19–v23): tipografía 3D roja/verde por extrusión, íconos 3D flotantes, papel rasgado, tarjetas
de color con objeto 3D — todo sale por defecto.

**REGLA DURA (Elvin 17/sep, viendo v19: «20 mil lo tienes mal posicionado tapándole la cara al creador, eso nunca
puede pasar… te falta bastante para estar en buen nivel»):** una cifra/callout NUNCA va sobre la cara. Va debajo de la
barbilla (y ≈ face_bottom + 0.18, ≈ 0.53), la frase pequeña justo encima SIN repetir la cifra, y los fajos nacen
debajo de la cifra y se apilan al pecho (nunca cruzan la cara). Encuadre: cara 21 % (medido en la referencia 18–25 %),
zooms capados a 27 %. Antes de entregar: extraer el frame de cada cifra y ponerlo al lado del de la referencia.
Ver [[ave-estilo-referencias]] y [[ai-video-editor]].

**18/sep — Elvin muy molesto con Valle Médica («payasería… porquería… póngase serio»):** vio la v2 (coche caricatura +
música enérgica + subtítulos desbordados). Causas reales y arregladas: prompts de b-roll generados antes de decidir el
mundo; música sin respetar el preset sobrio; y sobre todo **libass sustituía fuentes en silencio** (solo se copiaba una
.ttf) → DejaVu en Railway. Regla dura desde ahora: el render falla si libass sustituye una fuente; todo texto se ajusta
al cuadro; nada de caricaturas ni SFX en médicos/abogados/finanzas; **básico, profesional, minimalista pero completo y
elegante** es el estándar de entrega; y NO avisar "listo" hasta haber mirado frames del render final.

**Estructura (Elvin 18/sep):** «no tienes que usar todas las tomas; usa lo que va con el guion; si no hay suficiente o el
orden no es correcto, dile a la persona antes de generar; no se ponen cosas a lo loco una tras otra». Implementado como
paso de estructura (ordenar tomas con voz, excluir, metraje mudo solo donde encaja, avisos con confirmación en la web).
**Repeticiones (Elvin 18/sep «repitió lo mismo unas veces»):** el LLM avisa pero no siempre corta → ahora regla dura
`detectar_repeticiones` entre tomas (secuencia común ≥5 palabras; se corta la copia incompleta + conector previo).
Lección: cada aviso de estructura que describa un defecto evitable (repetición, falso arranque) debe ir acompañado de
una regla que lo corrija sola, no solo del aviso.

**Revisiones (Elvin 19/sep «asegúrate de que siempre que se pide una revisión se siga exactamente»):** cada revisión se
verifica contra el timeline anterior (`verificar_revision`) y se endurece si no se nota; «menos b-roll» = mitad y ≥30 %
menos segundos; «no me gustaron» = quitar. Lección: interpretar la nota y además COMPROBAR el resultado, nunca entregar
una revisión que no refleje lo pedido.

**21/sep — María del Carmen: «pedí 4 veces b-roll y no lo ejecuta».** Causa: un «quítame los b-rolls» (v4) quedó como
`disable_broll=True` acumulado en `overrides.json` y las 4 peticiones posteriores solo subían `broll.ratio`. Arreglado en
`Overrides.merge` (pedir b-roll/zooms/énfasis/música re-enciende el apagado), `verificar_revision` («más b-roll» tiene que
notarse) y `endurecer` (hacia ARRIBA si pidió más). Lección: un apagado acumulado nunca puede sobrevivir a una petición
contraria; y las revisiones que "no se notan" deben fallar ruidosamente, no rendir en silencio.

**21/sep — María del Carmen, video de los pies (7 revisiones sin lograr cambiar el b-roll):** el LLM entendía bien
(«dolor en el talón», «podólogo») pero el baúl emparejaba por palabras genéricas y ganaba sobre la generación; y
«otras imágenes» no forzaba imágenes nuevas. Arreglado (baúl semántico + `broll_frescas` + nicho podología). Lección:
cuando alguien repite lo mismo 3+ veces, el problema casi nunca es que «no se hace entender»: es el sistema. Y el
proyecto de Valle Médica que Elvin borró por error se rescató de la papelera (`intake.restaurar`).

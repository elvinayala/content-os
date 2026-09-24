---
name: verificar-antes-de-activar
description: Antes de activar cualquier secuencia/automatización que le escribe a leads reales, revisar el contenido final ya cargado (huecos [CORCHETES], nombres, links) y probar con un contacto que cruce el flujo completo
metadata:
  type: feedback
---

El 21/sep activé las 10 automatizaciones de ActiveCampaign y el 22/sep salieron ~13 emails a
leads reales con huecos sin rellenar ("[ENTREGA: link al diagnóstico…]", "[FECHA Y HORA] con
[CLOSER]", "[VIDEO DE ELVIN]"). La prueba e2e solo verificó que el email *salía*, no qué decía.
Además di por bueno el cable Calendly→AC y Elvin tuvo que corregirme: fueron ~11 agendas, no 2
(el `void` en Vercel cortaba el upsert).

**Why:** a Elvin le escriben leads reales con su nombre; un email roto le quema confianza justo
antes de la llamada de venta. Y los números que le reporto tienen que venir de la fuente
(Calendly), no del sistema que estoy probando.

**How to apply:** antes de activar, leer el texto final desde la herramienta (no el .md) y
buscar corchetes; `cargar-secuencia.mjs` ya tiene candado. Al reportar resultados, cruzar
contra la fuente primaria (Calendly API, Pipedrive) antes de dar un número. Ver
[[ecosistema-lu-aib]].

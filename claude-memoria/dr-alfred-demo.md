---
name: dr-alfred-demo
description: Dr. Alfred — oficina médica/medspa prospecto de Bori; demo chat WhatsApp en demos/oficina-medica/ + live en dr-alfred-demo-chat.netlify.app
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e193c8-fd41-4275-bf5e-0c8dd880f997
---

**Dr. Alfred J. Haber Crespo** (IG @dr.aj.habercrespo, "Medicina General y Estética") —
oficina médica/medspa en **Caguas PR**, prospecto de AutoFlow ([[bori-superplataforma]]).
Datos reales (del IG): Urb. Turabo Gardens, 5ta Sección, Calle 42 L-1, Caguas PR 00727
(frente a Farmacia Santa Ana) · ☎ 939-715-0009 / 787-456-1775 · Horario: L 10-6,
M-V 8-4, Sáb 9-3 (estética). Servicios: medicina primaria y preventiva, Botox y fillers,
control de peso ("¡Los resultados sí se logran!"), sueros IV, suplementos, estética,
**vacunas** (tétano/HPV/neumonía/hepatitis/meningitis/culebrilla/RSV/COVID/varicela).
Acepta planes médicos. Marca: logo figura tricolor; paleta navy `#2e5da8` + verde `#4ca546`.

**Demo de chat WhatsApp** (misma fórmula que [[glenn-international-demo]], motor de intents
interactivo bilingüe): `demos/oficina-medica/index.html` → **LIVE en
https://dr-alfred-demo-chat.netlify.app** (site id `d4cf2ceb-afd6-4c74-880a-d6669fa35e83`,
desplegado con el token de Netlify de Elvin). ZIP en `~/Desktop/dr-alfred-chat-demo.zip`.

Detalles: persona **"Camila"**, lockup serif navy "Dr. Alfred J. Haber Crespo · MEDICINA
GENERAL·ESTÉTICA·CAGUAS, PR", avatar corazón+pulso. Reglas médicas: **emergencias → 911**
(chequeado primero), sin precios (→ evaluación; ojo: sus promos de IG como "Botox $10/unidad"
NO van en el bot porque vencen), seguro médico → "el equipo confirma tu plan". Horario,
dirección y teléfonos REALES integrados; todos los intents informativos terminan ofreciendo
cita ({CITA} → sí → captura nombre+teléfono). Servicios se evalúan ANTES del intent genérico
de cita.

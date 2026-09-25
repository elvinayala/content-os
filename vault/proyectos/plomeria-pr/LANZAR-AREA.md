# Lanzar un área de clientes · Resuelto

**Regla de Elvin (25/sep/2026):** firma el plomero de un área y ese mismo día salen los anuncios de su zona, **nunca con un solo creativo**: varios conjuntos, varios anuncios, videos con CTA suave y flyers adaptados al área. Primer caso: Caguas (T3), campaña `120255115172270029`.

## 1. El día que firma

1. **Alta del plomero** activo en la app (`/admin/plomeros`) con su municipio. El agente agenda clientes en el territorio desde ese momento.
2. **Confirmar sus pueblos** (Yaileen). Los anuncios y los flyers salen solo en esos pueblos.
3. **Creativos del área**, con los pueblos reales (≈ 6 minutos en total):
   ```bash
   cd kit/flyers-clientes-regiones
   node generar.mjs T3 "Caguas,Gurabo,Juncos,San Lorenzo,Cayey,Aguas Buenas"   # flyer de la ciudad (feed + historia)
   node familia.mjs T3 "Caguas,Gurabo,Juncos,San Lorenzo,Cayey,Aguas Buenas"   # 6 flyers más (feed + historia)
   cd ../videos && ./armar-regionales.sh caguas                                # 4 videos de 19 s
   ```
4. **Campaña** por API (script en `data/meta-ads/campanas/resuelto-clientes-caguas-2026-09.json` como modelo). Elvin la prende.

## 2. Los creativos (por área)

| Tipo | Pieza | Qué dice |
|---|---|---|
| Video | `precio` | "¿Cuánto te va a cobrar el plomero? Te lo decimos ANTES de ir" + menú |
| Video | `destape` | "¿El fregadero no baja?" → $149 → checks → "Mándanos una foto" |
| Video | `calentador` | "¿Ducha fría otra vez?" → $279 → "¿más de 8 años? cámbialo" |
| Video | `sorpresas` | "¿Te cobraron el doble?" → "Aquí eso no pasa" → garantía |
| Flyer | ciudad | "Plomero con precio fijo en <ciudad>" + 4 precios |
| Flyer | `menu` | "Esto es lo que cobramos. Antes de ir a tu casa." (8 precios) |
| Flyer | `promesa` | "Sabes el precio y la hora antes de que toquemos tu puerta" |
| Flyer | `destape` | "¿Fregadero tapado?" $149 |
| Flyer | `calentador` | "¿Ducha fría otra vez?" $279 |
| Flyer | `problema` | "El problema no es el precio. Es no saberlo." |
| Flyer | `sorpresas` | "5 sorpresas que aquí no existen" |

Todos los videos terminan con el **cierre de la ciudad** (3 s) y el **CTA suave** (2.6 s): "¿Te pasó algo así? Escríbenos un mensaje y te damos tu precio en minutos". Ninguna pieza lleva teléfono ni la palabra WhatsApp; los precios salen de `agente/data/menu.json`.

**Fuera, hasta que se decida:** cisterna "desde $899" (no está en el menú del agente), filtración con cámara y destape de línea con máquina (dependen del equipo del plomero), emergencias de noche o feriado (dependen de su horario).

## 3. La estructura (Messenger + Instagram DM, conversaciones)

| Conjunto | Presupuesto | Anuncios | Texto |
|---|---|---|---|
| A · Precio fijo | $10/día | video `precio` · flyer ciudad · flyer `menu` | "¿Fregadero tapado, inodoro que no para o calentador dañado en <ciudad>? Te decimos el precio ANTES de llegar…" |
| B · Problemas | $10/día | videos `destape` y `calentador` · flyers `destape` y `calentador` | "¿Fregadero tapado o te quedaste sin agua caliente en <ciudad>? Destape $149 y calentador $279…" |
| C · Confianza | $10/día | video `sorpresas` · flyers `promesa`, `problema` y `sorpresas` | "¿Te ha pasado que el plomero te dice un precio y al final te cobra el doble?…" |

Mismo público en los 3: 28–65 años, solo los pueblos del plomero, sin Advantage+ de público. Meta reparte dentro de cada conjunto entre sus anuncios; a los 5–7 días se apagan los que no traen conversaciones y se renuevan (método de Max).

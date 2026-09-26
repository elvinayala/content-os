# Lanzar un área de clientes · Resuelto

**Regla de Elvin (25/sep/2026):** firma el plomero de un área y ese mismo día salen los anuncios de su zona, **nunca con un solo creativo**: varios conjuntos, varios anuncios, videos con CTA suave y flyers adaptados al área. Casos: Caguas (T3, Edgar Arroyo) campaña `120255115172270029` · Quebradillas (T5, Samuel Feliciano) campaña `120255119529030029`.

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
   Si el plomero no vive en la ciudad cabecera del territorio, se pasa el nombre del área como 3.er argumento a los
   dos generadores (`… T5 "Quebradillas,Camuy,Hatillo,Arecibo" Quebradillas`) y `armar-regionales.sh quebradillas`.
   Si su pueblo no está en ningún territorio, se agrega a `agente/data/territorios.json` y se despliega ANTES del alta.
4. **Campaña** con un comando (desde la raíz del repo; queda EN PAUSA y Elvin la prende):
   ```bash
   node vault/proyectos/plomeria-pr/kit/anuncios/lanzar-area.mjs quebradillas "Quebradillas" "Quebradillas:4242,Camuy:4214,Hatillo:4225,Arecibo:4261"
   ```
   Los códigos de pueblo salen de `/search?type=adgeolocation&country_code=PR`. Antes de tocar una campaña que ya
   existe, mira si está activa: lo que se crea debajo de una campaña activa corre al instante.

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

## 4. Llamadas (26/sep/2026) · la gente mayor llama

Una sola campaña para todas las áreas, **"Resuelto · Clientes · Llamadas (787-956-1111)"** (`120255128736340029`, EN PAUSA):
un conjunto por área ($10/día, 40–65 años, sus pueblos, objetivo llamadas de calidad) con 4 flyers que dicen
"Llama al 787-956-1111": ciudad · menú · destape · cisterna.

```bash
cd kit/flyers-clientes-regiones
LLAMADA=1 node generar.mjs T3 "Caguas,Gurabo,…"
LLAMADA=1 PIEZAS=menu,destape,cisterna node familia.mjs T3 "Caguas,Gurabo,…"
cd ../../../../.. && node vault/proyectos/plomeria-pr/kit/anuncios/lanzar-llamadas.mjs caguas "Caguas" "Caguas:4262,…"
```

**Quién contesta:** el 787-956-1111 vive en Zernio (voz + SMS). Hoy toda llamada cae en la **contestadora** (saludo en
español, transcribe); el agente (`agente/src/canales/llamadas.ts`) le manda al que llamó UN texto ("te devolvemos la
llamada" + enlace de reserva) y avisa por Telegram con el número y lo que dijo. Cuando haya setter: se pone su celular
como `forwardTo` (POST `/v1/phone-numbers/{id}/voice`, horario L–S 8 AM–7 PM ya configurado); fuera de horario o si no
contesta, sigue la contestadora. **La campaña de llamadas se prende cuando alguien esté contestando.**

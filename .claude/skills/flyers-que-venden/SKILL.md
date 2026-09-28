---
name: flyers-que-venden
description: Crea flyers y anuncios estáticos de ALTO IMPACTO que venden — minimalistas, premium y elegantes, con el título resaltado, beneficios, oferta y un call to action claro — generados SIEMPRE con Nano Banana Pro. Usar cada vez que pidan un flyer, arte, anuncio estático, post de oferta, historia promocional, portada o creativo para Meta/Instagram de Level Up Media, AI Borinquen, Bori o de un cliente, aunque no digan "flyer".
---

# Flyers que venden

La regla de Elvin, que manda sobre todo lo demás:

> **Flyers minimalistas, premium y elegantes. Siempre resaltando el título, los beneficios y un call to action
> claro. Pocas palabras. El producto es el protagonista. Siempre Nano Banana Pro.**

Un flyer que vende se entiende en **2 segundos** desde un celular: una idea, un héroe y un botón.

---

## 1. Primero, pide lo que necesitas

Antes de diseñar, junta esto. Si algo ya está en la conversación, no lo vuelvas a preguntar. Pregunta **máximo 5
cosas juntas**, cortas y en orden de importancia:

1. **Qué se anuncia**: el producto o servicio exacto y para qué negocio.
2. **A quién le vende**: el cliente ideal, en una frase.
3. **La razón para comprar**: el beneficio principal o el dolor que resuelve.
4. **La oferta**: precio, promo o bono **exacto**, solo si existe. Nunca la inventes.
5. **Qué debe hacer la persona**: escribir por WhatsApp, llamar, agendar, comprar en la web…
6. **Fotos reales**: del producto, el local, el equipo o un resultado. Son lo que más vende. Pídelas siempre.
7. **Logo en PNG** (idealmente con fondo transparente) y **colores de la marca**.
8. **Formato**: feed 4:5 (por defecto), historia o reel 9:16, o cuadrado 1:1.

Si no hay fotos, la escena se genera con Nano Banana Pro, pero dilo: con foto real vende más.

---

## 2. El copy: la fórmula (no se negocia)

| Pieza | Regla | Ejemplo |
|---|---|---|
| **Título** | ≤ 8 palabras. El beneficio o el dolor, **no** el nombre de la marca. | "Tu carro como nuevo, sin excusas" |
| **Frase clave** | 2 a 4 palabras **del mismo título**, que se pintan en el color de acento. | "como nuevo" |
| **Beneficios** | Hasta 3, ≤ 6 palabras cada uno. Beneficios, no características. | "Estimado el mismo día" (no "Equipo de última generación") |
| **Oferta** | Solo si el cliente la dio exacta. ≤ 5 palabras, en su propia etiqueta. | "Pintura desde $899" |
| **Call to action** | ≤ 4 palabras, con un verbo. Un solo botón. | "Escríbenos hoy" · "Agenda tu cita" |

**Reglas duras:**
- **Tuteo de Puerto Rico** (tú, tienes, escríbenos). Nunca voseo (vos, tenés, escribinos).
- **Nunca "gratis"**, ni en la oferta.
- **Nunca prometas ingresos** ("gana $5,000 al mes"): Meta rechaza el anuncio.
- **Nada inventado**: ni precios, garantías, plazos, premios o cifras que el cliente no haya dado.
- **Acentos y signos completos**: á é í ó ú ñ ¿ ¡.
- Cero párrafos, cero letra chiquita, cero teléfonos o webs en el arte, salvo que los pidan exactos.

---

## 3. La dirección de arte

- **El héroe manda**: el producto, el servicio en acción o el resultado, grande, bien iluminado, con mucho espacio
  negativo alrededor.
- **La foto va a sangre completa**, integrada al diseño. **Nunca** metida en un recuadro, una tarjeta o un
  rectángulo redondeado: eso se ve a plantilla barata.
- **Nunca un mockup**: el resultado ES el flyer, de borde a borde. No es una foto de un flyer puesto en una pared.
- **Tipografía premium**: una display con carácter para el título y una limpia para lo demás. Nada de fuentes
  genéricas.
- **Color**: el fondo y los tonos de la marca más **un solo color de acento**, que va en la frase clave, la oferta y
  el botón. Si el cliente no tiene colores, el acento sale del color más fuerte del producto.
- **Botón plano**: sólido, en el color de acento, con esquinas redondeadas. Sin brillo, sin degradado, sin 3D.
- **Logo real** pequeño en una esquina. Va como imagen de referencia y **nunca se redibuja ni se inventa**. Si no
  hay logo, el flyer sale sin logo.
- **Cero marcas ajenas**: carros, laptops, teléfonos y empaques genéricos, sin logos de otras marcas. Excepción: el
  producto del propio cliente tal como sale en sus fotos.
- **Zonas seguras**: todo el texto a ≥ 8 % de los bordes. En historia 9:16, el 14 % de arriba y el 20 % de abajo
  quedan libres de texto (ahí va la interfaz de Instagram).

**Tres composiciones** (haz 2 o 3 variantes probando distintas):
- **hero**: la foto a sangre, con el texto en su zona limpia. Sirve para servicios, lugares, gente y resultados.
- **split**: el texto a un lado y el héroe al otro, saliéndose del borde y fundido con el fondo. Sirve cuando el
  texto necesita aire.
- **producto**: el producto de estudio, grande y centrado, sobre fondo liso con sombra suave. Sirve para un objeto
  físico.

---

## 4. Generar: SIEMPRE Nano Banana Pro

- **Dónde**: la herramienta de imagen que tengas conectada, siempre con el modelo **Nano Banana Pro**:
  - Higgsfield: modelo *Nano Banana Pro*.
  - fal.ai: `fal-ai/nano-banana-pro`; con fotos o logo de referencia, `fal-ai/nano-banana-pro/edit`.
  - Gemini: *Nano Banana Pro*.
- **Calidad**: 2K. Sácale 2 o 3 variantes por pedido.
- **Referencias**: las fotos reales van primero y el **logo siempre al final**.
- **Si no tienes herramienta de imagen conectada**, entrega el prompt listo para pegar en Higgsfield o Gemini con
  Nano Banana Pro, más el copy aparte.

### La plantilla del prompt

Las instrucciones van en inglés, porque el modelo las sigue mejor. **El texto del flyer va en español, exacto y
entre comillas.** Llena lo que está entre `{ }` y borra lo que no aplique (si no hay oferta, se quita el elemento 2 y
se renumera):

```
The output image IS the flyer itself, filling the entire frame edge to edge — NOT a mockup, NOT a photo of a
printed flyer, poster or screen, no margins, no drop shadow, no surface or wall around it.

TEXT ON THE FLYER — render exactly these elements and nothing else:
(1) HEADLINE: "{título}" — the words "{frase clave}" in {color de acento}, the rest in {color del texto};
(2) OFFER BADGE: "{oferta}" — a bold pill/badge in {color de acento}, clearly visible;
(3) BENEFIT: "{beneficio 1}" with a small check icon;
(4) BENEFIT: "{beneficio 2}" with a small check icon;
(5) BENEFIT: "{beneficio 3}" with a small check icon;
(6) BUTTON: "{call to action}" — solid {color de acento} button.
Each element appears exactly ONCE, word for word: never repeat, reorder, translate or add words.

Premium, minimalist and elegant advertising flyer / social-media ad in the style of a top global brand. Quality
over everything: sophisticated art direction, lots of negative space, professional lighting, crisp and
photorealistic.

SCENE (visual only — NEVER write any words from this scene description on the flyer): {la escena en inglés:
qué se ve, dónde, la luz. Ej.: "a glossy freshly painted deep red generic unbranded sedan in a clean professional
auto body shop in Puerto Rico, dramatic studio lighting"}; it must stand out clearly and be the focus of the design.

Layout: {hero: the hero photograph is FULL-BLEED and fills the whole canvas edge to edge; the headline sits on a
naturally clean area of the photo | split: an asymmetric split, text on one side, the hero photo on the other side
bleeding off the canvas edges and blending softly into the text side | producto: premium studio product shot, the
product large and centered on a clean seamless background with a soft realistic shadow}. NEVER place the photo
inside a box, card, frame, border or rounded rectangle.

The call-to-action button is a SOLID flat button with clean rounded corners, no gradients, no glow, no 3D bevel.
Keep all text inside safe margins (at least 8% from every edge{; for a 9:16 story keep the top 14% and the bottom
20% free of text}).

All text is in Spanish and must be spelled EXACTLY as given, including accents (á é í ó ú ñ ¿ ¡). Do NOT add any
other words, taglines, prices, discounts, "free"/"gratis", phone numbers, websites, dates or fine print.

Typography: TOP-TIER and expensive — a striking, characterful display typeface for the headline and an elegant
pairing for the rest; never generic default fonts. Perfectly legible on a phone.

Brand palette: {fondo, color del texto y color de acento con sus códigos}. {Dark | Light} background.

{Con logo: The LAST reference image is the brand logo: include this exact logo EXACTLY as provided — do NOT
redraw, restyle, recolor or distort it — small and discreet in a top corner. | Sin logo: Do NOT include any logo,
brand mark or wordmark.}

No third-party logos, brand badges or readable brand names anywhere: design any car, device or packaging as a
generic, unbranded model{, except the client's own product exactly as it appears in the reference photos}.
Avoid clutter, busy backgrounds, stickers and emojis. Designed to stop the scroll and convert: one focal point,
instant readability in under 2 seconds.
```

---

## 5. Revisar ANTES de entregar (obligatorio)

Mira cada variante contra el copy, **palabra por palabra**. Nano Banana Pro a veces:
- cuela palabras de la descripción de la escena (en una prueba salió "Tus anuncios **small** vendiendo…");
- repite una palabra ("mientras mientras");
- se salta la oferta o no pinta la frase clave;
- dibuja el logo de otra marca en un carro o una laptop.

Revisa esto en cada variante:
- [ ] Cada palabra está exacta, aparece una sola vez y tiene sus acentos.
- [ ] La frase clave sale en el color de acento.
- [ ] La oferta aparece, si había.
- [ ] Hay un solo botón con el call to action.
- [ ] El logo es el real y no está deformado. Si no había logo, no hay ninguno.
- [ ] No hay marcas ajenas, no es un mockup y la foto no está en un recuadro.
- [ ] Se entiende en 2 segundos en un celular.
- [ ] No hay nada inventado.

Si una variante falla, **vuelve a generarla** (hasta 2 veces). Si una palabra sigue saliendo mal, usa el modo B.
**Nunca entregues un flyer con una letra mal.**

---

## 6. Modo B: el texto perfecto en Claude Design

Cuando el texto es largo, el modelo insiste en fallar o el cliente va a querer editarlo:
1. Genera con Nano Banana Pro **solo la imagen**: el héroe y el fondo, con la misma dirección de arte, "no text,
   no letters, no logos", dejando espacio limpio donde irá el texto.
2. Monta el título, la frase clave, los beneficios, la oferta, el botón y el logo en **Claude Design**, con
   tipografía real. Queda exacto y editable.

---

## 7. La entrega

- 2 o 3 variantes, en el formato pedido. Si va para anuncios, entrega también el 9:16.
- En una línea por variante, qué la hace distinta (composición, ángulo).
- Tu recomendación de cuál probar primero, y por qué.
- El copy en texto aparte, para usarlo como texto del anuncio.

---

## Kits de marca

| Marca | Fondo | Texto | Acento (frase clave, oferta, botón) | Logo |
|---|---|---|---|---|
| **Level Up Media** | negro #0B0B0B | blanco cálido #F5F1E8 | amarillo #F5CE1A | https://content-os-chi-seven.vercel.app/marcas/level-up-logo-dark.png (para fondo claro: `level-up-logo-light.png`) |
| **AI Borinquen** (marca v2) | verde-negro #050E0A | blanco #E8F3EC | verde neón #2BFF88 (detalles: verde #3C9A3F, azul #1E6FD0, rojo #E63946; letra Outfit + Inter) | https://content-os-chi-seven.vercel.app/marcas/ai-borinquen/lockup-horizontal-transparente.png |
| **Bori** | negro bosque #07160F | blanco #EAF5EE | verde #35C06F (degradado teal→verde claro) | https://content-os-chi-seven.vercel.app/marcas/bori/logo.png |
| **Resuelto** | crema #FBF7F0 (fondo claro) | azul #0F3D5E | naranja flamboyán #F2621F (solo botón y palomitas) | https://content-os-chi-seven.vercel.app/marcas/resuelto/logo-azul.png |

**Clientes**: usa sus colores y su logo real. Si no te los dieron, pídelos. Sin logo, el flyer sale sin logo; nunca
inventes uno.

En `ejemplos/` hay dos flyers hechos con esta skill: un taller de hojalatería con la frase clave, la oferta, los
beneficios y el botón, y uno de Level Up con su logo real.

---

## Para los agentes del repo (Lola, Max, Claude Code en Content OS)

El script aplica todo lo de arriba. Antes de gastar, valida el copy (largos, "gratis", voseo, promesas, que la frase
clave salga del título) y arma el prompt de Nano Banana Pro:

```
node scripts/fal.mjs flyer --marca level-up --titulo "Tus anuncios vendiendo mientras duermes" \
  --resaltar "vendiendo" --bullets "Estrategia hecha para ti|Anuncios que convierten|Reportes cada semana" \
  --cta "Agenda tu llamada" --producto "a confident Puerto Rican business owner checking sales on an unbranded laptop in her boutique at night" \
  --layout hero --ar 4:5 --n 2 --guardar out/flyer.png
```

Otras opciones:
- `--oferta "Pintura desde $899"`
- `--foto url1,url2`: fotos reales, que van primero.
- `--logo url`: el logo de un cliente, que va al final.
- `--acento "#hex"`
- `--fondo claro|oscuro`
- `--tipo producto`
- `--extra "…"`
- `--ver`: muestra el prompt sin gastar.

Código: `scripts/fal/flyer.mjs`. Tests: `tests/fal-flyer.test.mjs`. Guía de Lola: `vault/ceo/cerebro-lola.md` §3b.

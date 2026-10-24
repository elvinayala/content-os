# Programa DRG · cómo armarlo en GHL

Cliente: Dr. Ricardo Guerrero · Programa DRG · Isla Verde, PR. Base: Borrador 2 ("Transformación y comunidad") + la sección
nueva de sueroterapia. Fuente: *Instrucciones_GHL_Programa_DRG_Dr_Ricardo_Guerrero.pdf* (16/oct/2026).

**Vista previa:** abre `vista-previa/pagina-1-landing.html` y `vista-previa/pagina-2-peptidos.html` en el navegador.
Lo amarillo con borde punteado (**PENDIENTE**) y los recuadros rayados (**[FOTO…]**) se reemplazan antes de publicar.

**Para cambiar algo:** edita `fuente/` (CSS en `base.css`, textos en `p1-contenido.html`, `p2-contenido.html`, `pie.html`)
y corre `node demos/drg-landing/armar.mjs`. Así se regeneran `ghl/` y `vista-previa/`. No edites `ghl/` a mano.
Para cambiar la paleta (si el cliente escoge negro + dorado + naranja), toca solo las variables de arriba de `base.css`.

---

## 1. Funnel y páginas

1. **Sites → Funnels → New Funnel** → "Programa DRG".
2. Dos pasos:
   - **Landing**: ruta `/programa-drg`
   - **Clínica de Péptidos**: ruta `/clinica-peptidos`
   (Si usas otras rutas, cámbialas en `armar.mjs` → `rutas.ghl` y vuelve a armar; las páginas se enlazan entre sí.)
3. Crea también `/privacidad` y `/terminos` (o cambia `URL_PRIVACIDAD` y `URL_TERMINOS` en `armar.mjs` al sitio del cliente).

## 2. Estructura de cada página (3 secciones)

En el editor de cada paso, borra lo que trae la plantilla y deja **tres secciones de ancho completo** (Full Width), con
**padding 0** y fondo `#0a0a0a`:

| # | Sección | Qué lleva |
|---|---|---|
| 1 | Código | Elemento **Custom JS/HTML** → pega todo `ghl/p1-bloque-1-contenido.html` (o `p2-…` en la página 2) |
| 2 | Nativa de GHL | Fondo `#141414`. Página 1: 2 columnas → **Form** "Preevaluación DRG" a la izquierda y **Calendar** "Evaluación inicial sin costo" a la derecha (en celular quedan una debajo de la otra). Página 2: 1 columna solo con el formulario. |
| 3 | Código | Elemento **Custom JS/HTML** → pega `ghl/p1-bloque-2-pie.html` (o `p2-…`): pie, botón flotante de WhatsApp y la medición |

El ancla `#empezar` ya viene dentro del bloque 1, justo encima de la sección nativa: los botones bajan solos al
formulario. No hay que ponerle ID a nada en GHL.

**Fotos y videos:** sube cada archivo a **Media**, copia la URL y en el bloque 1 cambia el recuadro
`<div class="drg-foto" …>[FOTO: …]</div>` por:

```html
<div class="drg-foto"><img src="URL-DE-MEDIA" alt="(el mismo texto que trae aria-label)"></div>
```

Para video, mismo recuadro con `<video src="URL" autoplay muted loop playsinline></video>`. **No subas los flyers de
sueros como imagen** (las afirmaciones médicas están dentro de la imagen). Sin fotos de antes y después.

## 3. Formulario "Preevaluación DRG" (Sites → Forms)

- Tipo: **varios pasos** (Multi-step). Paso 1: nombre, apellido, WhatsApp. Paso 2: el resto.
- Campos:
  - Nombre · Apellido · **WhatsApp (obligatorio)** · Correo
  - **¿Qué buscas?** (opción única): Bajar de peso · Volver al gimnasio · Péptidos · Sueroterapia · Otro
  - **¿Cuándo quieres empezar?** (opción única): Esta semana · Este mes · Solo estoy averiguando
  - **Casilla obligatoria**: "Acepto que el Programa DRG me contacte por WhatsApp, SMS y correo."
  - **Ocultos**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` y `pagina_origen`
    (valor por defecto: `landing` en la página 1, `peptidos` en la página 2).
- **No pedir datos de salud** (peso, condiciones, medicamentos). Eso va en la evaluación.
- Botón del formulario: **COMENZAR MI PREEVALUACIÓN** · colores: fondo `#b8ff2c`, texto `#0a0a0a`, redondo.
- Al enviar: **mostrar el calendario** "Evaluación inicial sin costo" (On submit → redirect al calendario o
  mostrar el widget del calendario).

## 4. Calendario "Evaluación inicial sin costo"

- **PENDIENTE del cliente:** duración, días y horarios.
- Campos del calendario: nombre, WhatsApp, correo + la misma casilla de consentimiento.
- Botón: **QUIERO AGENDAR MI CITA**.

## 5. Workflow (Automation → Workflows)

**A. "DRG · Formulario enviado"** (disparador: Form submitted = Preevaluación DRG)
1. Etiquetas: `drg`, `drg-fuente-{{utm_source}}` (o `drg-fuente-organico` si viene vacío), `drg-interes-<¿Qué buscas?>`.
2. Pipeline "Programa DRG" → etapa **Lead nuevo**.
3. Espera 1 h → si **no** tiene cita: WhatsApp 1. Espera 24 h → si no: WhatsApp 2. Espera 3 días → si no: WhatsApp 3.
   Sale del workflow apenas agenda.

**B. "DRG · Cita agendada"** (disparador: Appointment booked = Evaluación inicial sin costo)
1. Etiqueta `drg-cita-agendada`; pipeline → **Cita agendada**.
2. Aviso interno (Slack o SMS al equipo del cliente, según quién atiende).
3. WhatsApp de confirmación al momento; recordatorios 24 h y 2 h antes.

Textos (tuteo, cortos):

- **Confirmación:** "¡Hola {{contact.first_name}}! Tu evaluación inicial sin costo con el Dr. Ricardo Guerrero quedó para
  el {{appointment.start_date}} a las {{appointment.start_time}} en Isla Verde. Si necesitas cambiarla, contéstame por aquí."
- **Recordatorio 24 h:** "{{contact.first_name}}, mañana es tu evaluación en DRG a las {{appointment.start_time}}. ¿Te esperamos?"
- **Recordatorio 2 h:** "En 2 horas te vemos en DRG, Isla Verde. ¡Hoy es un buen día para empezar!"
- **Sin cita 1 (1 h):** "Hola {{contact.first_name}}, vi que empezaste tu preevaluación del Programa DRG. ¿Te ayudo a escoger día y hora para tu evaluación sin costo?"
- **Sin cita 2 (24 h):** "¿Todavía te interesa empezar? Tu evaluación inicial con el Dr. Guerrero no tiene costo. Aquí escoges el horario: [enlace del calendario]"
- **Sin cita 3 (3 días):** "Último recordatorio de mi parte 🙂 Cuando estés listo o lista, aquí está tu evaluación sin costo: [enlace del calendario]"

## 6. Medición

- **Funnel → Settings → Tracking code (Head):** pega el **Meta Pixel** y la etiqueta de **Google Analytics 4**.
- **Integrations → Meta (Conversions API)** con el mismo Pixel, para que GHL mande Lead y Schedule desde el servidor.
- Eventos:
  - **ViewContent**: al cargar (lo manda el bloque 2).
  - **Contact**: clic en cualquier botón de WhatsApp (lo manda el bloque 2; también a GA4 como `contact`).
  - **Lead**: envío del formulario (activar en el formulario → Facebook Pixel event = Lead).
  - **Schedule**: cita agendada (activar en el calendario → Facebook Pixel event = Schedule).
- UTM: los anuncios deben llevar `utm_source`, `utm_medium` y `utm_campaign`; los campos ocultos los recogen solos.

## 7. SEO (Settings de cada paso)

- **Página 1 – título:** Programa DRG | Bajar de peso en Puerto Rico con supervisión médica | Dr. Ricardo Guerrero
- **Página 1 – descripción:** Programa médico para bajar de peso en Isla Verde, PR: evaluación inicial sin costo, dieta y
  entrenamiento personalizados y sueroterapia según tu evaluación.
- **Página 2 – título:** Clínica de Péptidos DRG | Programa DRG | Dr. Ricardo Guerrero
- **Página 2 – descripción:** Péptidos con supervisión médica, integrados a tu evaluación, nutrición, entrenamiento y seguimiento. Isla Verde, PR.
- Un solo H1 por página (ya viene así: no agregues otro título H1 en la sección nativa). `alt` en todas las imágenes.
- Imagen para compartir (OG): una foto del hero, 1200×630.

## 8. Qué cambió respecto al borrador (y por qué)

- **Menos botones:** un solo botón principal (QUIERO EMPEZAR HOY / QUIERO SABER SI ES PARA MÍ) que baja al formulario y
  al calendario. Se quitaron el botón de "¿Te suena…?" y los 6 botones de las tarjetas de sueros. Las 8 tarjetas del
  programa enlazan con texto, no con botones. La doble ruta va directo con el formulario y el calendario nativos.
- **Sueroterapia con lenguaje seguro:** solo los textos "apoya / ayuda a" del documento. Títulos ajustados:
  "Tonificar la piel" → *Cuidado de la piel*; "Quemar y tonificar" → *Metabolismo y tonificación*; "El dolor" →
  *Bienestar general*; "Sistema inmune" → *Defensas*; "Resaca y desintoxicación" → *Recuperación e hidratación*.
- **Fórmulas que no se muestran** (sus nombres prometen o nombran condiciones): Macho Man / Wonder Woman,
  Cellulite/Flacidity, Fibromyalgia, Anti-Inflammatory, Anti Anxiety / Depression, General Detox. Se ven en la
  evaluación.
- **Productos de péptidos:** solo el nombre + "Pregunta en tu evaluación", sin beneficios.
- No se incluyen los recuadros "PROPUESTA DE LEVEL UP MEDIA COMO EXPERTOS".

## 9. Antes de publicar (checklist)

Busca **PENDIENTE** y **[FOTO** en los bloques: no puede quedar ninguno.

- [ ] Información de péptidos del cliente (las imágenes recibidas eran de sueroterapia) → página 2.
- [ ] Producto destacado de péptidos + si se puede vender en línea → botón de pago nativo de GHL en la página 2
      (reemplaza el recuadro "Aquí va el botón de pago").
- [ ] Paleta confirmada (hoy: negro + verde neón + amarillo, la del logo y los flyers).
- [ ] **Autorización escrita** del Alcalde Ángel Bory y de la pareja para nombre, foto y video.
- [ ] Duración, días y horarios de la evaluación sin costo → calendario.
- [ ] Vigencia y restricciones exactas del 20% – 30% OFF → banda amarilla de sueroterapia.
- [ ] Fotos y videos reales (acción y comunidad), logo DRG.
- [ ] Páginas de privacidad y términos.
- [ ] Prueba: enviar el formulario con un número propio → llega la etiqueta, el lead al pipeline y el WhatsApp.

## 10. Riesgos para anunciar (Meta y Google)

- Usar "apoya" o "ayuda a". No nombrar enfermedades (fibromialgia, ansiedad, depresión, colesterol). No usar
  "rápidamente", "elimina", "evita", "combatir" ni "toxinas".
- **COLESTEROL AWAY, FAT DECAY, HORMONAL EQUITY y BRAIN IN MOTION** sugieren resultados: confirmar con el cliente si
  pueden venderse y anunciarse. Mientras tanto, **no mandes anuncios a la página 2**; los anuncios van a la página 1.
- Imágenes con catéter, bolsa de suero o jeringa: María del Carmen está verificando si se pueden usar en anuncios.
- Testimonios: autorización escrita + la nota "los resultados pueden variar" (ya está en la página). Sin antes/después.
- Las frases de "¿Te suena alguna de estas frases?" están bien en la página; en anuncios, no dirigirse a la condición
  personal de la persona ("¿Tienes sobrepeso?" ✗).
- El descuento siempre con sus restricciones al lado.

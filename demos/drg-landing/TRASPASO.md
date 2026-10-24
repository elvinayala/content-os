# Traspaso · Landing Programa DRG (Dr. Ricardo Guerrero) en GHL

**Fecha:** 21 de octubre de 2026 · **De:** Elvin / Level Up Media · **Para:** desarrollador que sigue el proyecto
**Cliente:** Dr. Ricardo Guerrero · Programa DRG · Isla Verde, PR · WhatsApp +1 (787) 368-9592

---

## 1. Qué es

Dos páginas en GoHighLevel para captar pacientes desde anuncios y buscador:

1. **Landing principal** (`/programa-drg`): Borrador 2 "Transformación y comunidad", que eligió el cliente, más la
   sección nueva de **sueroterapia** que pidió.
2. **Clínica de Péptidos DRG** (`/clinica-peptidos`): péptidos + 5 productos, uno destacado con pago.

Objetivo de las dos: que la persona llene la **preevaluación** o **agende** la evaluación inicial sin costo, y que
le confirmen por WhatsApp. Pedido de Elvin: **página simple, pocos botones, una llamada a la acción clara.**

## 2. Qué ya está hecho

- Diseño y código de las dos páginas, listos para pegar en GHL (celular primero, probado a 375 px y en computadora).
- Paleta negro + verde neón + amarillo (la del logo y los flyers), en variables para cambiarla en un solo lugar.
- Textos de sueroterapia ya en lenguaje seguro para Meta/Google ("apoya / ayuda a"), sin nombrar condiciones.
- Botón flotante de WhatsApp con mensaje precargado, y eventos **ViewContent** y **Contact** (clic a WhatsApp) para
  Pixel y GA4.
- Guía paso a paso de GHL: formulario, calendario, workflows con los textos de WhatsApp, medición y SEO.
- **Demo para el cliente** (sin notas internas): https://claude.ai/artifact/B42mPjs1v4i8EDZtNx4ePD

**Nada está montado en GHL todavía.** Eso es lo que sigue.

## 3. Archivos

| Archivo | Para qué |
|---|---|
| `GUIA-GHL.md` | **Léelo primero.** Paso a paso para armarlo en GHL. |
| `ghl/p1-bloque-1-contenido.html` | Página 1, sección 1 → elemento **Custom JS/HTML** |
| `ghl/p1-bloque-2-pie.html` | Página 1, sección 3 → **Custom JS/HTML** (pie, WhatsApp, medición) |
| `ghl/p2-bloque-1-contenido.html` | Página 2, sección 1 |
| `ghl/p2-bloque-2-pie.html` | Página 2, sección 3 |
| `vista-previa/*.html` | Cómo se ve, con notas internas (ábrelas en el navegador) |
| `demo/*.html` | Versión para el cliente (la del enlace de arriba) |
| `fuente/` | **Aquí se hacen los cambios**: `base.css` (estilos), `p1-contenido.html`, `p2-contenido.html`, `pie.html` |
| `armar.mjs` | Regenera `ghl/`, `vista-previa/` y `demo/` desde `fuente/` |

En el repo de Elvin viven en `demos/drg-landing/`. Si te llegaron por Drive, es la misma carpeta.

## 4. Cómo hacer cambios

1. Edita lo que toque en `fuente/` (nunca `ghl/` a mano: se sobrescribe).
2. Corre `node armar.mjs` dentro de la carpeta (Node 18 o más nuevo, sin instalar nada).
3. Vuelve a pegar en GHL el bloque que cambió.

Cosas que conviene saber:
- Todo el CSS va con el prefijo `.drg` para que el tema de GHL no lo pise. Respeta el prefijo en lo que agregues.
- Las rutas entre páginas (`/programa-drg`, `/clinica-peptidos`, `/privacidad`, `/terminos`) están en `armar.mjs`,
  en `rutas.ghl`. Si en GHL usas otras, cámbialas ahí.
- El ancla `#empezar` ya viene en el bloque 1, justo encima de la sección del formulario. Los botones bajan ahí solos.
- **Fotos:** cada `<div class="drg-foto" …>[FOTO…]</div>` se reemplaza por `<div class="drg-foto"><img src="URL de
  Media de GHL" alt="…"></div>` (el `alt` = el `aria-label` que ya trae).
- **Paleta:** si el cliente escoge negro + dorado + naranja, cambia solo las variables `--drg-*` de arriba de `base.css`.

## 5. Cómo se arma cada página en GHL (resumen; el detalle está en la guía)

Tres secciones a todo lo ancho, padding 0, fondo `#0a0a0a`:

1. **Custom JS/HTML** con el bloque 1.
2. **Nativa de GHL:** formulario "Preevaluación DRG" (varios pasos) + calendario "Evaluación inicial sin costo"
   (en la página 2, solo el formulario). Van nativos para que GHL dispare workflows y guarde los UTM.
3. **Custom JS/HTML** con el bloque 2.

Después: Pixel + GA4 en el Tracking code del funnel, Conversions API de Meta, eventos **Lead** (formulario) y
**Schedule** (calendario), los dos workflows (formulario enviado y cita agendada) y el SEO de cada paso.

## 6. Decisiones que ya se tomaron (no cambiar sin hablar con Elvin)

- **Pocos botones:** un solo botón principal por página que baja al formulario y al calendario. Se quitaron los
  botones de cada tarjeta de sueros y el de "¿Te suena…?".
- **Sueroterapia:** solo los textos "apoya / ayuda a". No se muestran las fórmulas cuyos nombres prometen o nombran
  condiciones (Fibromyalgia, Anti Anxiety/Depression, Cellulite/Flacidity, Macho Man/Wonder Woman,
  Anti-Inflammatory, General Detox). **No subir los flyers como imagen** (el texto médico está dentro).
- **Péptidos:** solo el nombre del producto + "Pregunta en tu evaluación", sin beneficios.
- El formulario **no pide datos de salud**. Las preguntas médicas van en la evaluación.
- Testimonios con la nota "los resultados pueden variar". **Sin fotos de antes y después.**

## 7. Lo que queda pendiente (orden sugerido)

1. Montar las dos páginas en GHL (secciones 2 y 5 de la guía).
2. Crear el formulario de preevaluación y el calendario.
3. Workflows: etiquetas, pipeline "Programa DRG", aviso interno, WhatsApp de confirmación, recordatorios y
   seguimiento si no agenda.
4. Pixel, CAPI, GA4 y UTM. Probar cada evento.
5. Cuando llegue lo del cliente (sección 8): fotos, horarios, oferta, péptidos y producto con pago.
6. Páginas de privacidad y términos.
7. Prueba completa con un número propio: formulario → etiqueta → pipeline → WhatsApp → cita → recordatorio.
8. Pasarle a Elvin el enlace final para aprobación **antes de publicar o mandar tráfico**.

## 8. Lo que necesitamos del cliente

- [ ] **Información de péptidos.** Lo que mandaron eran imágenes de sueroterapia; sin esto, la página 2 queda incompleta.
- [ ] **Producto destacado** de péptidos, su precio, y si se puede vender en línea (para el botón de pago de GHL).
- [ ] **Paleta:** confirmar negro + verde neón + amarillo (la de la demo) o negro + dorado + naranja.
- [ ] **Autorización escrita** del Alcalde Ángel Bory y de la pareja para usar nombre, foto y video.
- [ ] **Calendario de la evaluación sin costo:** duración, días y horarios.
- [ ] **Oferta 20% – 30% OFF en sueros:** vigencia y restricciones exactas.
- [ ] **Fotos y videos reales** de acción y comunidad (hero, testimonios, productos) y el **logo DRG** en buena calidad.
- [ ] Quién recibe el aviso interno cuando alguien agenda (nombre y número o correo).
- [ ] Política de privacidad y términos, si ya los tienen.

## 9. Riesgos para anunciar (Meta y Google)

- Lenguaje "apoya / ayuda a". No nombrar enfermedades (fibromialgia, ansiedad, depresión, colesterol). No usar
  "rápidamente", "elimina", "evita", "combatir" ni "toxinas".
- **COLESTEROL AWAY, FAT DECAY, HORMONAL EQUITY y BRAIN IN MOTION** sugieren resultados. Hasta que el cliente confirme
  que se pueden vender y anunciar, **los anuncios van solo a la página 1**.
- Imágenes con catéter, bolsa de suero o jeringa: María del Carmen está verificando si se pueden usar en anuncios.
- El descuento siempre con sus restricciones al lado.

## 10. Contactos

- **Elvin:** aprueba el diseño final y la publicación.
- **Carilin (Operaciones):** coordina con el cliente lo pendiente de la sección 8 y recibe los cambios que pida.
- **María del Carmen:** verificación de imágenes para anuncios.

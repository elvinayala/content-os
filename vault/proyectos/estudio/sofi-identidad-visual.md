---
fecha: 2026-09-19
fuente: manual
unidad: ecosistema
tags: [sofi, branding, identidad, avatar]
estado: v1 · 3 estilos generados · Elvin elige el principal
---

# Sofi — identidad visual v1

Elvin (19/sep): "quiero verla todos los días, dale identidad". Personaje fijo para todos los
estilos, generado con gpt_image_2_5 (Higgsfield). Archivos en `public/marcas/sofi/`.

## Quién es (para que siempre se dibuje igual)
- Puertorriqueña, 30 y pocos. Piel morena cálida. **Rizos oscuros en un bun alto** con
  mecha suelta. Ojos marrones expresivos, ceja definida, **media sonrisa con criterio**.
- **Aros dorados**, **cuello tortuga negro**, **headset delgado** (coordinadora de producción).
  Acento **terracota** (`#C8643A`) — el mismo del tablero — en lanyard, fondo o pantalla.
- Fondo **carbón cálido** (`#14202A`) con brillo terracota. Nunca fondo blanco ni colores de Bori.
- Actitud: líder cálida y directa. No es "asistente sonriente": está a cargo.

## Los 3 estilos y dónde va cada uno
| Archivo | Estilo | Uso |
|---|---|---|
| `sofi-3d.png` | 3D estilizado (Pixar adulto) | **Avatar del bot de Telegram** (ya puesto), Slack, HUD, Command Center |
| `sofi-vector.png` | Vector plano | Ícono chico, favicon, stickers, firma en documentos |
| `sofi-editorial.png` | Pintura editorial | Portadas, el /ceo, presentaciones, "Sofi te presenta…" |

## Prompt base (para regenerar poses/escenas manteniendo el personaje)
> SOFI, Puerto Rican woman early 30s, warm brown skin, dark curly hair in a loose high bun
> with a few curls out, expressive brown eyes, confident half-smile, small gold hoop earrings,
> fitted black turtleneck, slim over-ear headset microphone, terracotta (#C8643A) accent,
> warm charcoal (#14202A) background with soft terracotta rim light. No text.
> + [estilo: "modern stylized 3D character illustration, Pixar-like but adult and professional"
> | "flat vector illustration avatar, bold minimal shapes" | "semi-realistic editorial digital
> painting"] + [escena/pose].

Para consistencia fuerte entre muchas imágenes: entrenar un **Soul** en Higgsfield con las 3
(y 5–10 variantes más) → `soul_2` + `soul_id`.

## Bot de Telegram (@eamarket_sofi_bot)
Nombre "Sofi · Command Center", descripción y descripción corta ya puestas por API. La foto de
perfil la pone Elvin en BotFather (`/setuserpic` → elegir el bot → subir `sofi-avatar-640.png`),
porque la API no permite cambiarla.

# Contigo PR · Brand Kit v1 (resumen numerado)

Archivo fuente de la landing: `kit/landing/index.html` · vista publicada: https://claude.ai/code/artifact/fa348e96-2b34-419f-998c-c011707be10a. Cómo referirse a las piezas en briefs, prompts y código: **L** logo · **A/B/C** alternativas de ícono · **C** colores · **F** fuentes · **T** estilos de texto · **V** frases · **A1–A5** aplicaciones físicas · **D1–D4** digitales.

## Marca
- Nombre: **Contigo PR** (wordmark en minúsculas: "contigo", con "PR" pequeño al lado). Entidad: pendiente (D2, recomendado Contigo PR LLC + fundación aparte).
- Slogan **V1**: "Nadie se queda solo."
- Promesa **V2**: "Tu mamá atendida todos los días. Y tú lo ves en tu WhatsApp."
- Frases **V3** "La llamamos todos los días." · **V4** "Un toque y está resuelto." · **V5** "Se llama Luz. Tu mamá la espera." · **V6** "Menos que un café al día." · **V7** (fundación) "Apadrina un abuelo."
- Personalidad: la sobrina que vive cerca y se ocupa. Cálida sin ser cursi, seria sin ser fría. Tuteo puertorriqueño ("tu mamá", "mi amor" solo en la voz del agente), frases cortas. **Nunca**: "robot", "IA" en el hook, "gratis" en un CTA, coquíes, banderas, fotos de stock de abuelos, superlativos.
- Nombre de la voz que llama: pendiente (D6). Recomendado: Carmen.

## Logo
- **L1** principal horizontal (ícono + "contigo" + "PR") · **L2** apilado · **L3** negativo sobre C1 · **L4** sobre amarillo (ícono verde, corazón blanco) · **L5** ícono solo / avatar sobre C1 (WhatsApp, redes, favicon).
- Ícono **A** (el que usa el kit): burbuja de conversación con un corazón adentro. La llamada es el producto; el corazón es lo que el hijo compra. Alternativas: **B** casa con corazón (se parece a mil marcas de cuido), **C** dos "c" abrazadas (más abstracto, para fase 2).
- Espacio libre = altura del corazón. Mínimo digital 20 px; impreso 8 mm; ícono solo desde 24 px. No rotar, no estirar, no cambiar el coral del corazón.

SVG del ícono A (64×64):
```svg
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 6C17.6 6 6 16.3 6 29c0 7.3 3.9 13.8 10 18v11l10.6-6.4c1.8.3 3.6.4 5.4.4 14.4 0 26-10.3 26-23S46.4 6 32 6z" fill="#17463A"/>
  <path d="M32 40.5l-9.2-9.1c-2.6-2.6-2.6-6.8 0-9.3 2.5-2.5 6.6-2.5 9.2 0 2.6-2.5 6.7-2.5 9.2 0 2.6 2.5 2.6 6.7 0 9.3L32 40.5z" fill="#DE5F4D"/>
</svg>
```

## Paleta
| # | Nombre | HEX | Uso |
|---|---|---|---|
| C1 | Verde Yagrumo | #17463A | Primario: logo, títulos, fondos oscuros, uniforme de la cuidadora |
| C2 | Amarillo Maíz | #F2B33D | Acción: botones, precios, imán de nevera. **Siempre con texto C5 encima**, nunca blanco |
| C3 | Blanco Arroz | #F7F5EC | Fondo principal (web, documentos, redes) |
| C4 | Gris Guayacán | #5F6B66 | Texto secundario, bordes, íconos inactivos |
| C5 | Verde Noche | #0E2B23 | Texto principal sobre claro, texto sobre C2 |
| C6 | Coral | #DE5F4D | Solo el corazón del ícono y alertas. Nunca botones |
| C7 | Blanco | #FFFFFF | Tarjetas sobre C3, texto sobre C1 |

Proporción: 55% C3/C7 · 25% C1 · 12% C2 · 5% C4 · 3% C6. Combinaciones: (1) C1+C2+C7 imán/portada · (2) C3+C1+C4 web/reporte · (3) C2+C5 botón/precio.

## Tipografía (Google Fonts)
- **F1 Bricolage Grotesque** 700/800: display, títulos, precios. Tracking −2% en grande.
- **F2 Figtree** 400/500/600: cuerpo e interfaz. Line-height 1.55. Tamaño base 18 px (público de 35–60 y abuelos que leen el imán).

| # | Estilo | Fuente | Tamaño/línea | Uso |
|---|---|---|---|---|
| T1 | Display | Bricolage 800 | 56/60 | hero, imán, portada |
| T2 | Título 1 | Bricolage 800 | 40/44 | secciones |
| T3 | Título 2 | Bricolage 700 | 28/34 | tarjetas de plan |
| T4 | Título 3 | Bricolage 700 | 21/27 | nombres (Luz, Carmen) |
| T5 | Cuerpo | Figtree 400 | 18/28 | párrafos |
| T6 | Cuerpo chico | Figtree 400 | 15/22 | notas, reporte |
| T7 | Etiqueta | Figtree 600 | 13, mayúsculas, tracking 14% | "plan", "territorio" |
| T8 | Precio | Bricolage 800 | 40, color C5 sobre C2 o C1 sobre C3 | siempre junto a "/mes" |

CSS base:
```css
:root{--c1:#17463A;--c2:#F2B33D;--c3:#F7F5EC;--c4:#5F6B66;--c5:#0E2B23;--c6:#DE5F4D;--c7:#FFFFFF}
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=Figtree:wght@400;500;600&display=swap');
body{font-family:Figtree,Arial,sans-serif;font-size:18px;color:var(--c5);background:var(--c3)}
h1,h2,h3,.precio{font-family:'Bricolage Grotesque',Arial,sans-serif;color:var(--c1)}
.btn{background:var(--c2);color:var(--c5);border-radius:14px;font-weight:600}
```

## Aplicaciones
- **A1 Imán de nevera** 4"×3", fondo C2: ícono L4 + "Llama a Contigo" + número en T1 (tiene que leerse a 2 metros) + "Dile a tu hijo que te lo active". Es la pieza más importante de la marca: vive en la nevera del abuelo.
- **A2 Calcomanía del teléfono** 1.5"×1": número grande sobre C2.
- **A3 Tarjeta de la cuidadora** (física, con foto, nombre, número de verificación y QR) fondo C1: la enseña al llegar.
- **A4 Polo de la cuidadora** C1 con ícono blanco al pecho y "Contigo PR" en la espalda. Sin gorra: la cuidadora entra a la casa, no al techo.
- **A5 Afiche para farmacias e iglesias** 11"×17": V2 + número + "Para hijos que no pueden estar".
- **D1 Reporte diario** (WhatsApp): ícono L5, nombre del abuelo en T4, tres líneas en T6, botón amarillo "¿Le mandamos algo hoy?".
- **D2 WhatsApp Business**: perfil L5 sobre C1; el asistente se presenta como "Contigo".
- **D3 Tarjeta digital de la cuidadora** 1080×540 fondo C1: foto, "Se llama Luz", "Verificada", hora de la visita en C2.
- **D4 Redes**: perfil L5; post de historia real fondo C3, cita en T3 en C1, nombre del abuelo en C2.

## Prompt para Claude Design (canvas)
> Brand canvas de Contigo PR (la plataforma que llama a tu mamá todos los días y le resuelve lo que pida, en Puerto Rico). Fondo C3 (#F7F5EC), títulos Bricolage Grotesque 800 en C1 (#17463A), cuerpo Figtree en C5 (#0E2B23), botones y precios en C2 (#F2B33D) con texto oscuro, coral C6 (#DE5F4D) solo en el corazón del ícono. Artboards: logo L1–L5 con ícono A (burbuja + corazón), paleta C1–C7, tipografía T1–T8, imán de nevera A1, tarjeta de la cuidadora A3, reporte diario D1. Voz: tuteo PR, cálida, frases cortas. Sin emojis, sin gradientes, sin fotos de stock, sin banderas.

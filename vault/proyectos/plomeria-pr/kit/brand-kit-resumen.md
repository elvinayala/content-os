# Resuelto · Brand Kit v1 (resumen numerado)

Canvas editable: https://claude.ai/code/artifact/98ae2976-ef03-468a-b75c-e5d86d605a73
Archivos fuente: `kit/brand-canvas/*.dc.html`

Cómo referirse a las piezas en briefs, prompts y código: **L** logo · **A/B/C** alternativas de ícono · **C** colores · **F** fuentes · **T** estilos de texto · **V** frases · **A1–A4** aplicaciones físicas · **D1–D4** digitales.

## Marca
- Nombre: **Resuelto** (wordmark en minúsculas: "resuelto"). Entidad: Resuelto PR Home Services LLC.
- Slogan **V1**: "Tu casa, resuelta." · Promesa **V2**: "Llega cuando dice. Cobra lo que dijo. Lo garantiza por escrito."
- Frases **V3** "Precio fijo. Punto." · **V4** "Sin sorpresas en la factura." · **V5** "Ya vamos." · **V6** "Te lo resolvemos."
- Personalidad: buen vecino que sabe de todo y no cobra de más. Tuteo puertorriqueño, directo, sin jerga, sin voseo, sin coquíes ni banderas, sin superlativos vacíos. Un emoji máximo, solo en WhatsApp.

## Logo
- **L1** principal horizontal (ícono + wordmark) · **L2** apilado · **L3** negativo sobre C1 · **L4** sobre naranja (ícono azul, check blanco) · **L5** ícono solo / monocromo / avatar sobre C2.
- Ícono **A** (recomendado, el que usa el kit): casa con check. Alternativas: **B** la R con check (más app), **C** gota con check (limita a plomería).
- Espacio libre = altura del ícono. Mínimo digital 20 px de alto; impreso 8 mm; ícono solo desde 24 px. No estirar, no rotar, no cambiar el naranja del check.

SVG del ícono A (64×64):
```svg
<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="#0F3D5E"/>
  <path d="M20 35 L29 44 L46 26" stroke="#F2621F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

## Paleta
| # | Nombre | HEX | RGB | Uso |
|---|---|---|---|---|
| C1 | Azul Caribe | #0F3D5E | 15 61 94 | Primario: logo, títulos, uniforme, camión, fondos oscuros |
| C2 | Naranja Flamboyán | #F2621F | 242 98 31 | Acción: check, botones, precios, gorra. Nunca texto largo |
| C3 | Crema | #FBF7F0 | 251 247 240 | Fondo principal (web, documentos, redes) |
| C4 | Gris Pizarra | #5C6670 | 92 102 112 | Texto secundario, bordes, íconos inactivos |
| C5 | Azul Noche | #08243A | 8 36 58 | Texto principal sobre claro, sombras |
| C6 | Verde Resuelto | #1F9D6B | 31 157 107 | Solo estados: completado, confirmado, sello de garantía |
| C7 | Blanco | #FFFFFF | 255 255 255 | Tarjetas sobre C3, texto sobre C1/C2 |

Proporción: 55% C3/C7 · 25% C1 · 12% C2 · 5% C4 · 3% C6. Combinaciones: (1) C1+C2+C7 camión/portada · (2) C3+C1+C4 web/factura · (3) C2+C1+C7 gorra/CTA. Texto blanco sobre C2 solo ≥ 18 px y negrita.

## Tipografía (Google Fonts)
- **F1 Sora** 700/800: display, títulos, precios. Tracking −2% a −4% en grande.
- **F2 DM Sans** 400/500/600: cuerpo e interfaz. Line-height 1.5.

| # | Estilo | Fuente | Tamaño/línea | Uso |
|---|---|---|---|---|
| T1 | Display | Sora 800 | 56/60 | hero, camión, portada |
| T2 | Título 1 | Sora 800 | 40/44 | secciones |
| T3 | Título 2 | Sora 700 | 28/34 | tarjetas, factura |
| T4 | Título 3 | Sora 700 | 20/26 | nombres de servicio |
| T5 | Cuerpo | DM Sans 400 | 17/26 | párrafos |
| T6 | Cuerpo chico | DM Sans 400 | 15/22 | notas, factura |
| T7 | Etiqueta | DM Sans 600 | 13, mayúsculas, tracking 15% | licencias, categorías |
| T8 | Precio | Sora 800 | 36, color C2 | siempre junto a "fijo" |

CSS base:
```css
:root{--c1:#0F3D5E;--c2:#F2621F;--c3:#FBF7F0;--c4:#5C6670;--c5:#08243A;--c6:#1F9D6B;--c7:#FFFFFF}
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
body{font-family:'DM Sans',Arial,sans-serif;color:var(--c5);background:var(--c3)}
h1,h2,h3,.precio{font-family:Sora,Arial,sans-serif;color:var(--c1)}
.btn{background:var(--c2);color:#fff;border-radius:12px;font-weight:600}
```

## Aplicaciones
- **A1** Polo C1: ícono blanco al pecho izquierdo (7 cm); espalda wordmark negativo + slogan + WhatsApp. **A2** Gorra C2 con ícono L4; identificación con foto, nombre, licencia y QR. **A3** Imán de puerta 12"×18" fondo C1 (L3 + "Plomería con precio fijo" + WhatsApp en C2). **A4** Rotulación parcial fase 2: tercio inferior C1 con franja C2.
- **D1** Tarjeta del técnico 1080×540 (fondo C1, nombre Sora, hora en C2). **D2** WhatsApp: perfil L5 sobre C2, precio en negrita. **D3** Cotización/factura: cabecera C1, total en C2, sello de garantía en C6. **D4** Redes: perfil L5 sobre C2; post de precio fondo C1, servicio T4, precio T8.

## Prompt para Claude Design (landing)
> Landing de Resuelto (servicios para el hogar en Puerto Rico, empieza por plomería). Usa el brand kit: fondo C3 (#FBF7F0), títulos Sora 800 en C1 (#0F3D5E), cuerpo DM Sans en C5, botones y precios en C2 (#F2621F), verde C6 solo para el sello de garantía. Logo L1 en el header, L5 como favicon. Hero T1: "Plomero licenciado con precio fijo antes de llegar." + CTA "Escríbenos y te agendamos en 2 minutos" (WhatsApp). Secciones: cómo funciona (4 pasos), menú de precios en 3 niveles (pequeño/mediano/grande), promesa V2 en tres tarjetas, lista de espera por municipio, "¿Eres plomero licenciado?". Voz: tuteo PR, frases cortas, precio primero. Sin emojis, sin gradientes, sin fotos de stock.

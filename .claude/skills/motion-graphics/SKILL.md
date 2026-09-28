---
name: motion-graphics
description: Produce anuncios y videos de MOTION GRAPHICS por código (Remotion → MP4) con la marca real — logo animado, tipografía cinética, pantallas reales de la app, música y efectos al beat — con el método de la fábrica de Remi. Usar cuando pidan "video motion", "motion graphics", "anuncio animado", "logo animado", "video de lanzamiento", "showreel", "recorrido de la app" o videos de motion para una marca de Elvin o para un CLIENTE (contenido premium).
ejecucion: live
marcas: [level-up, ai-borinquen, bori, shadow-operator, ritmo, 1000x, clientes]
---

Eres el motion designer del equipo (Remi, y Max cuando lo aplica para un cliente). Motion por CÓDIGO, no IA
generativa: la IA deforma logos y textos; el código respeta marca, tipografía y timing al frame.
Este método produjo el 27/sep/2026 más de 80 videos (Level Up, Bori, AI Borinquen, Ritmo, 1000X) que Elvin aprobó.

## 0. Antes de nada
1. Marca, producto, ángulo, duración (15 · 20 · 30 · 60 s), formato (16:9 y/o 9:16), anuncio u orgánico, CTA.
   Si falta la marca o el producto: UNA pregunta y parar.
2. Lee `vault/estilo/<marca>.md` (ángulos, enemigos, registro, casos verificados) y `vault/ceo/cerebro-remi.md`.
3. Si es para un CLIENTE: su logo real (SVG/PNG), colores, tipografía, oferta y casos con OK del cliente.
   Sin logo real = sin logo (jamás inventarlo). Nada de testimonios o números que no dé el cliente.

## 1. El taller (`motion/`, proyecto Remotion aparte de la app)
- `src/fabrica/anuncios.ts` — **cada anuncio es un guion EN DATOS** (no se programa un video a mano):
  `{ id, marca, formato: "9:16"|"16:9", titulo, angulo, musica?, tomas?, escenas: [{ tipo, dur, … }] }`.
  30 fps: 15 s = 450 frames, 20 s = 600, 30 s = 900, 60 s = 1800. **La suma de `dur` tiene que dar exacto.**
  `ambos(g)` genera las dos versiones (AI Borinquen: solo 16:9, regla de Elvin).
- `src/fabrica/temas.tsx` — una marca = un tema: paleta, fuente, **logo animado** (`Logo`), firma de cierre
  (`Firma`), música. Existentes: level-up, bori, ai-borinquen (coquí "Hollywood": salta, aterriza, brinca),
  ritmo, 1000x. **Cliente nuevo = un tema nuevo** (copiar uno y cambiar colores, fuente, logo).
- `src/fabrica/escenas.tsx` — la librería de escenas (se acomodan solas a 9:16 / 16:9 y a la zona segura):
  | tipo | para qué |
  |---|---|
  | gancho | titular grande palabra por palabra; `*palabra*` o `*frase*` = resaltado; `logo: true`; `alarma` |
  | numero | contador + curva que sube (casos "de $X a $Y") con nota legal |
  | casos | tarjetas de varios casos con su número |
  | comparativa | barras (agencia vs tú, 4 horas vs 10 segundos) |
  | pasos / roles | método en pasos · roles que rotan ("Recepcionista, Cobros…") |
  | lista | ítems que se tachan (dolores), se marcan o suman ($/mes) |
  | embudo | leads que se escapan en una etapa |
  | notificaciones | teléfono vibrando con avisos (llamadas, WhatsApp, IG…) |
  | chat / llamada / voz / agenda | demo de agentes (WhatsApp, llamada con onda de voz, orden hablada → calendario) |
  | flyers / aprobacion | generador de piezas y tarjeta "Aprobar / No" con cursor |
  | rompecabezas / semanas / dato / cita | piezas que se juntan · semanas perdidas · stat en anillo · testimonio |
  | pantalla | **captura REAL de una app** en laptop o teléfono, con zoom (`foco`) y viñetas |
  | grafico / terminal | trading: velas + radar (marcado SIMULACIÓN) · log que se escribe |
  | cierre | firma de la marca + CTA con brillo + url + nota legal |
  Escena nueva que haga falta → se agrega a la fábrica (tipo en `tipos.ts` + componente), no a un video suelto.
- Audio: `node motion/scripts/audio.mjs musica "<estilo, BPM, beat desde el primer segundo, sin voz>" --seg 64`
  (fal stable-audio) y `… sfx "<efecto>" --seg ≥0.5` (ElevenLabs). Normalizar con
  `ffmpeg -af loudnorm=I=-15:TP=-1.5:LRA=11`. **Cada video/campaña puede llevar su propia música** (`musica:`).
- Tomas cinematográficas (opcional): Higgsfield **Cinema Studio Video 3.0** (`cinematic_studio_3_0`, 5 s,
  1080p, sin audio) por su MCP → `motion/public/tomas/` → campo `tomas` del anuncio. Sin caras, sin texto,
  sin logos, nunca presentadas como un cliente real. Revisar 3 cuadros antes de usar.

## 2. Pantallas reales de una app (recorridos, demos de producto)
- **NUNCA grabar producción** (datos de clientes, salarios, tokens). Levantar una **copia aislada con datos
  ficticios** (worktree + base local + red externa bloqueada) — así se hicieron `/Users/elvinayala/ritmo-demo`
  (puerto 3140) y `/Users/elvinayala/bori-demo` (puerto 3150; launch configs `ritmo-demo` / `bori-demo`).
- Capturar con puppeteer-core + Chrome del Mac a 1440×900 @2x (y 390×844 @3x para celular), cerrar pop-ups/
  chat, quitar el botón de desarrollo de Next, y guardar en `motion/public/<app>/`.

## 3. Copy que vende (reglas de Elvin)
- Gancho en el **frame 0**, sin intro. Dolor concreto o resultado con número — **nunca abstracto**.
- Solo casos y números **verificados**, con "Resultados de clientes reales; cada negocio es distinto."
- Registro: Level Up, Bori, 1000X y Ritmo en **tuteo PR**; **AI Borinquen en anuncios de USTED**. Nunca voseo.
- Nunca "gratis" en un CTA, nunca prometer ingresos. Trading (1000X): SIMULACIÓN + aviso de riesgo, jamás
  prometer ganancias ni "te pasamos la cuenta".
- AutoFlow (AIB): "listo en 7 días · 45 días de acompañamiento · soporte para siempre si quiere" (NO "21 días").
- Level Up: "+100 negocios en PR"; casos Tinos, RK Automatic, La Garita, Yadiel, Dr. Bryan Vega (25–50 pacientes/mes).

## 4. Render, revisión y entrega
```bash
cd motion && npx tsc -p .                                  # limpio antes de renderizar
scripts/render-fabrica.sh <id> [<id>…]                     # → motion/out/fabrica/<id>.mp4 (~40–130 s c/u)
node scripts/hoja.mjs <id>                                 # hoja de contacto: 1 cuadro por escena
```
- **Mirar SIEMPRE la hoja** (y un zoom de las escenas críticas) antes de entregar: logo fiel, texto grande y
  legible, nada cortado, sin palabras sueltas en la última línea, registro correcto, datos verificados.
- Entregar: `node motion/scripts/entregar.mjs motion/out/fabrica/<id>.mp4 --marca <m> --titulo "…" --formato "motion 16:9 · 30 s"`
  (Storage + bandeja de Entregas) y mandarle el MP4 a Elvin. Publicar/pautar lo decide Elvin.
- Subir a Slack con el bot: `node --env-file=.env.local scripts/slack-subir-video.mjs <mp4> --canal <id> --texto "…" [--dry]`.

## 5. Para clientes (contenido premium)
Este motion es un **producto premium** que se le puede dar o vender a los clientes de Level Up / AIB:
lanzamiento de su producto, logo animado, recorrido de su app o servicio, anuncios de 15–30 s por ángulo.
Flujo: onboarding del cliente (marca + oferta + casos aprobados) → tema nuevo → 3–5 guiones → render →
hoja de contacto → aprobación interna (#max-aprobaciones) → entrega. Nunca publicar sin aprobación.

## 6. Dónde se renderiza: Remi en la nube (27/sep/2026)
Servicio **`remi`** en Railway (proyecto puente-telegram; `Dockerfile.remi`, `scripts/remi-nube.sh`,
`motion/servicio/servidor.mjs`): Chrome headless + Remotion; baja lo último de GitHub en cada trabajo, renderiza y
sube el MP4 a Storage (link firmado de 1 año). ~2–4 min por video de 30 s. **Ya no hace falta la Mac.**
```bash
node scripts/remi.mjs salud
node scripts/remi.mjs render <id>… [--entregar --marca <m> --titulo "…"]          # guiones ya escritos en anuncios.ts
node scripts/remi.mjs render --guion <archivo.json|'JSON'> [--entregar --marca <m>] # guion en JSON, SIN tocar código
```
**Guion en JSON** (lo que usa Max, que no edita código): `{ id, marca, formato: "16:9"|"9:16"|"1:1", titulo, angulo,
escenas: [...], musica?, cliente?: { nombre, logoUrl (https, logo REAL), fondo, acento, texto?, acento2?, fuente? } }`.
Con `cliente`, la marca sale del JSON (composición universal **`Motion`** + `src/fabrica/cliente.tsx`). Fuentes
permitidas: Inter, Montserrat, Poppins, Plus Jakarta Sans, DM Sans, Manrope, Bebas Neue, Sora, Outfit. Copia del
guion en `data/motion/guiones/<id>.json`. Env: `REMI_URL` + `REMI_SECRETO`.

## 7. Paquete para clientes (Elvin, 27/sep/2026)
Elvin, 28/sep: **2 videos de MOTION GRAPHICS** a los clientes de Level Up cuyo acuerdo es de **$3,500 o más** y que lo **pagaron completo de una** (28/sep: antes eran 3). Si paga en plazos, aunque el acuerdo sea mayor, **no se le hacen hasta que complete los pagos** (se revisa en Pulse: Pago Inicial = Acuerdo de Pago / "Pago Único"). Siempre motion por código con
esta fábrica — nunca UGC, caras con IA ni video generativo en su lugar). Flujo de Max, de punta a punta:
1. **Marca del cliente en su expediente** (una vez, con SU logo real):
   `node scripts/max.mjs ficha <slug> '{"marca":{"nombre":"…","logoUrl":"https://…","fondo":"#…","acento":"#…","fuente":"Inter"}}'`
2. **2 guiones** (ángulos de su oferta, casos que el cliente aprobó) en JSON → render + propuesta en un paso:
   `node scripts/remi.mjs render --guion '<[g1,g2]>' --cliente <slug> --proponer --titulo "2 motion · <negocio>"`
   (`--cliente` pone su marca sola; `--proponer` los sube a #max-aprobaciones como "creativos").
3. **Aprobado** (ok de Elvin o Carilin) → el servidor los guarda en su Drive (`videos/`) y los manda a su canal.
4. **Si se pautan:** `node scripts/meta-ads/subir-videos.mjs cliente:<slug> <url-del-video>…` → IDs de Meta → campaña
   EN PAUSA con `meta-ads.mjs cliente:<slug> …` (verificar con `arbol` antes de avisar).
Licencia: Remotion para empresas de 4+ personas = Company License (ver cerebro de Remi).

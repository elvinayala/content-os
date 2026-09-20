# Flyers de reclutamiento · Contigo PR

Cinco piezas a **1080 × 1350** (formato de post vertical de Instagram y Facebook). Los `.png` son los finales; los `.html` de `src/` son la fuente editable.

| Archivo | Ángulo | Fondo | Para qué |
|---|---|---|---|
| `01-cuanto-ganas.png` | El ingreso | Verde Yagrumo | Post principal de reclutamiento. Es la primera pregunta de toda cuidadora. |
| `02-el-trato.png` | El trato sin letra chiquita | Blanco Arroz | Segundo post y respuesta a "¿cuál es la trampa?". |
| `03-buscamos-20.png` | La escasez y los requisitos | Amarillo Maíz | Post que frena el scroll. Filtra: dice requisitos y territorios. |
| `04-no-es-cuido.png` | No es cuido médico | Verde profundo | El diferenciador más fuerte contra cualquier trabajo de cuidadora. |
| `05-ad-meta.png` | Anuncio pagado | Blanco Arroz | Creativo para Meta Ads, con la pregunta que califica. |

## Cómo editarlos y volver a exportarlos

Los cinco comparten `src/flyer.css` (paleta C1–C7, Bricolage Grotesque + Figtree). Edita el `.html`, guarda y exporta con Chrome sin abrir nada:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd vault/proyectos/adultos-mayores/kit/flyers
for f in 01-cuanto-ganas 02-el-trato 03-buscamos-20 04-no-es-cuido 05-ad-meta; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1350 --virtual-time-budget=8000 \
    --screenshot="$PWD/$f.png" "file://$PWD/src/$f.html"
done
```

Para historias de Instagram, cambia `--window-size=1080,1920` y ajusta el `padding` del `.canvas` a 100px.

## Antes de publicarlos

Los cinco dicen `contigopr.com/cuidadoras`. **No publiques ninguno hasta que ese link cargue.** Si alguien lo toca y no existe, quemas al candidato y no vuelve. Orden correcto: dominio → WhatsApp → landing en vivo → flyers.

Los números ($390 a $700 semanales, $23 por visita, $29 por transporte) salen del reparto 65/35 de `flujo-pedidos.md`. Si cambia el menú de precios, hay que actualizarlos aquí también.

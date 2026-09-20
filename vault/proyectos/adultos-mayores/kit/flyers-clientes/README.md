# Flyers para los hijos · Contigo PR

Cinco piezas a **1080 × 1350** con los ángulos más duros de `estrategia-marketing.md`. Los `.png` son los finales; los `.html` de `src/` son la fuente editable (mismo `flyer.css` que los de reclutamiento).

| Archivo | Ángulo | Pilar | Fondo | Para qué |
|---|---|---|---|---|
| `c1-la-culpa.png` | A1 · La culpa que no se quita | Problema | Verde Yagrumo | El post #1 para la diáspora. Cambia "Orlando" y "Ponce" por pueblo según el segmento. |
| `c2-lo-que-no-te-cuenta.png` | A2 · Lo que no te cuenta | Problema | Blanco Arroz | Agita el miedo real: enterarse tarde. |
| `c3-se-llama-luz.png` | A3 · La misma cuidadora siempre | Producto | Amarillo Maíz | Responde "¿es seguro?" con nombre, zona y verificación. |
| `c4-un-toque.png` | A4 · Un toque y está resuelto | Solución / Producto | Verde profundo | Muestra el mandado desde lejos como una conversación real de WhatsApp. |
| `c5-menos-que-un-cafe.png` | A5 · Menos que un café | Mentalidad / Producto | Blanco Arroz | Rompe la objeción de precio antes de que aparezca. Lleva el precio y la garantía. |

Mezcla recomendada para la primera tanda: c1 y c2 con el 60% del presupuesto, c3 y c4 con el 30%, c5 con el 10%.

## Variantes fáciles
- **Diáspora por ciudad:** en `c1`, cambia "Orlando" por Tampa, Filadelfia, Nueva York o Texas, y "Ponce" por el pueblo del segmento. Un flyer por ciudad cuesta un minuto.
- **Papá / mamá:** c2 y c5 hablan de "tu papá"; c1, c3 y c4 de "tu mamá". Se pueden cruzar.
- **Historias 1080×1920:** `--window-size=1080,1920` y `padding` del `.canvas` a 100px.

## Exportar

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd vault/proyectos/adultos-mayores/kit/flyers-clientes
for f in c1-la-culpa c2-lo-que-no-te-cuenta c3-se-llama-luz c4-un-toque c5-menos-que-un-cafe; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1350 --virtual-time-budget=8000 \
    --screenshot="$PWD/$f.png" "file://$PWD/src/$f.html"
done
```

## Antes de publicarlos
Todos dicen `contigopr.com`. No se publica ninguno hasta que el dominio cargue y el WhatsApp conteste. Y antes del piloto no se prende pauta: sin historias reales, c1 y c2 suenan a manipulación (ver "Qué NO hacer" en `estrategia-marketing.md`).

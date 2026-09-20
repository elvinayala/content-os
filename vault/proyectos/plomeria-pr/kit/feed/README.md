# kit/feed · piezas del feed de Instagram (1080×1350)

Fuentes en `src/*.html` (+ `_base.css`, marca Resuelto). Render con Chrome headless:

```bash
cd kit/feed && CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for f in src/*.html; do n=$(basename "$f" .html); "$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=1080,1350 --force-device-scale-factor=1 --virtual-time-budget=6000 --screenshot="$PWD/$n.png" "file://$PWD/$f"; done
```

- `f01-hola` presentación · `f02-garantia` · `f03-como-1..5` carrusel "cómo funciona" · `r-*` portadas de reels.
- `grid-preview.jpg` = los 12 posts en el orden del plan (`plan-feed-instagram.md`). Regenerar con el snippet de sharp en ese doc si cambia el orden.
- Copiar a `kit/landing/feed/` y redeploy para URL pública (`resueltopr.com/feed/<archivo>.png`).

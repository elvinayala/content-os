# Kit de ventas de AI Borinquen (29/sep/2026)

**https://aib-kit-ventas.netlify.app** (Netlify, sitio `e51598b4-4d89-4d5f-b82d-4a4c6d6617b8`, `noindex` + robots Disallow; uso interno).
Elvin: "déjalo listo para los closers… es compulsorio utilizarla". Se le envió a Aure por Slack (DM, 28/sep noche) con la
tarea de reunir mañana temprano a los closers de AIB y presentarles la demo paso a paso.

- `/` = esta página (`index.html`): instrucciones de uso, uso obligatorio, links y descargas.
- `/demo-ai-borinquen/` = `../ai-borinquen-demo/index.html` envuelto en un documento completo + `testimonios/` (3 MP4 + posters).
- `/marketing-ia/` = `../marketing-ia-demo/index.html` envuelto.
- `/videos/` = los 2 videos para antes de la llamada + testimonios (Ernest vertical y horizontal, Mano Santa, Sleekbrowspr).
  Los MP4 no están en git: salen de `motion/out/fabrica/` y de la bandeja de Entregas (Storage `pulse/motion/2026-09-29/`).
- Redeploy: armar la carpeta igual y subir el zip con `curl -X POST -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN"
  -H "Content-Type: application/zip" --data-binary @kit.zip https://api.netlify.com/api/v1/sites/<id>/deploys`
  (con curl: el fetch de Node corta subidas grandes desde la Mac).
- Testimonio vertical de Ernest: composición `TestimonioVertical` de motion, props en `data/motion/testimonios/ernest-crisson-vertical.json`.

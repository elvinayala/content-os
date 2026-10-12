# Demo de Level Up Media para las llamadas de venta (2/oct/2026)

La presentación de Canva de Level Up (8 páginas) llevada a web animada, con la marca de LU (negro + #F5CE1A, Sora).
- Enlace para closers: https://lu-demo-ventas.netlify.app (Netlify, sitio b15c0075-3607-44cf-a420-c9452c16ef68, noindex).
- Artifact (privado): https://claude.ai/artifact/DAwpyhGmKiYVRvojFzCCaD
- Slides: portada · 7 testimonios en video (solo habla el cliente: Dr. Bryan Vega, Robert/RK, Magdalys, Reina/Mr. iPhone,
  Lcdo. Ernest Crisson, Dra. Grissel Villanueva, Oliver/Tinos) · 4 slides de casos (8 casos con su captura de Meta y
  contadores) · el motor de crecimiento animado · "Comencemos.".
- Videos y capturas NO van al repo (pesan): están en el sitio de Netlify y salen de motion/public/lu-peli/.
- Clic en un testimonio = se abre en grande (Esc cierra). Flechas/espacio avanzan, F pantalla completa, R repite.

**Black Friday 2026 (11/oct):** portada con la cinta "Black Friday adelantado" + slide 8 "Todo esto por $3,500" (manejo de
anuncios, estrategia, artes, edición, motion, visita de contenido, soporte 24/7; valor de referencia $6,150) + slide 9 "Bonos
Black Friday" (1:1 con el CEO hasta el Cyber Monday · 6 meses de Bori Pro · agente de IA de AIB con 3 meses · plan de 30
piezas solo hasta el 31/oct) con reloj que cambia solo por fecha (hora PR). Plan: `vault/proyectos/black-friday-2026/`.
Publicar SOLO index.html (los videos viven en Netlify): API de Netlify con digest de archivos — copiar la lista de
`/sites/<id>/files`, cambiar el sha de /index.html y subir solo ese (si se sube un zip con solo el index, se borran los videos).

**11/oct (Elvin): testimonios "al grano" + solo 2 bonos.** Los clips `testimonios/<n>-v2.mp4` (Bryan, Robert, Magdalys, Reina,
Ernest) dejan solo el antes y el resultado del cliente; se quitó la voz del entrevistador que repetía en Magdalys ("un 80 %").
Cortes por palabra (ElevenLabs Scribe vía fal con diarización) en `motion/public/lu-peli/al-grano/cortes.py`; copias de los
clips en esa carpeta. Bonos: 1:1 con el CEO $1,500 (hasta el Cyber Monday) + Bori Pro 6 meses $594 → valor total $8,244.

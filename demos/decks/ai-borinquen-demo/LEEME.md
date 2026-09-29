# Presentación animada · Demo AI Borinquen (28/sep/2026)

La presentación de venta de AI Borinquen (PDF "2026 sept Demo AI Borinquen") llevada a web animada: 8 slides en
un escenario de 1920×1080 que se escala a la pantalla; cada slide se arma al entrar (contadores, flujo de AutoFlow,
agentes que nacen del Agente Personal, barra de implementación).

- Publicada (privada, compartir desde el menú Share): https://claude.ai/artifact/E6StExJHMKNPBGMLVk7Xyk
- `fuente.html` = el HTML sin logos (`/*LOGOS*/[]`), `logos.json` = logos de clientes recortados en base64,
  `index.html` = la versión final (fuente + logos). Para rearmar:
  `python3 -c "import json;open('index.html','w').write(open('fuente.html').read().replace('/*LOGOS*/[]', json.dumps(json.load(open('logos.json')))))"`
- Controles: flechas / espacio / clic (izquierda = atrás), `F` pantalla completa, `R` repetir la animación, `#s3` abre la slide 3.
- Reglas de contenido (Elvin, 28/sep): **sistema en marcha en 15 días**, optimización del día 16 al 45; respuesta en
  **menos de 10 segundos**. Testimonio 1 = Ernest Crisson Cancel (Zoom con Valentina, recortado a solo él, subtitulado: `motion` composición `Testimonio`, props en `data/motion/testimonios/ernest-crisson.json`). Pendiente: testimonios 2 y 3 (AI Borinquen) y cifra de software suelto (slide 3).

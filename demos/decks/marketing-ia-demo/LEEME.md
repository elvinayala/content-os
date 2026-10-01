# Presentación animada · Marketing + IA (AI Borinquen, 28/sep/2026)

El PDF "2026 demo Marketing Digital + IA" llevado a web animada, con el mismo sistema que `../ai-borinquen-demo/`
(escenario 1920×1080 escalado, cada slide se arma al entrar, controles que se esconden solos).

- Publicada (privada, compartir desde Share): https://claude.ai/artifact/AyCJh4KV9QNSphZES9MvC1
- 7 slides: portada · **testimonios** (slide 2, 29/sep: Ernest Crisson, la parte de marketing, 52 s con subtítulos, props en `data/motion/testimonios/ernest-marketing.json`; Sleekbrowspr, gancho + "todas las semanas están llegando clientes nuevos", 24 s; y desde el 30/sep Yazan · Sola Boutique, 50 s horizontal, gancho "15,000 clientes" + corte seco, props en `data/motion/testimonios/yazan-sola-horizontal.json`; clic = se abren en grande, Esc cierra) · dos sistemas · motor de crecimiento (5 fases alrededor de la IA, con pulso que recorre el ciclo) ·
  AutoFlow (canales + reloj que se detiene en **<10 s**) · sistema completo (el lead viaja y la línea regresa al anuncio) ·
  siguiente paso con **"Empezamos por" + fecha de arranque editables en la llamada** (reemplaza el
  "[Definir por qué fase empezamos y la fecha de arranque]" del PDF).
- Controles: flechas / espacio / clic, `F` pantalla completa, `R` repetir, `#s3` abre la slide 3.
- **Video para el cliente**: la misma presentación con el cierre de WhatsApp en vez de los campos editables, grabada cuadro
  por cuadro con `motion/scripts/grabar-deck.mjs` + el testimonio de Ernest Crisson sobre resultados del marketing (19 s).
  En la bandeja: `motion-aib-marketing-ia-cliente`.
- Los MP4 de los testimonios no van al repo: viven en el artifact y en https://aib-kit-ventas.netlify.app/marketing-ia/testimonios/.

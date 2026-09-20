---
fecha: 2026-07-25
fuente: granola
unidad: ai-borinquen
tags: [reunión, mentoría, IA, arquitectura, producto]
---

# Sesión de Mentoría IA — Elvin + Alejo

**Resumen:** Mentoría entre Elvin y su mentor Alejo (AI engineer senior). Se revisó el mapa de modelos de Bori/AutoFlow; Alejo asesoró en arquitectura (fallbacks, dos ambientes, CI/CD), estrategia de data (PostHog obligatorio), y producto. Decisión central: **data first** — cada cliente necesita dashboard con métricas. Se discutieron agentes vs. chatbots (autonomía/ejecución), la importancia de la voz como futuro, y la necesidad de un producto low-ticket (~$500) para retener leads que hoy no compran. En medio, Valentina cerró la primera suscripción de $99.

## Decisiones

- **Data first / PostHog obligatorio:** es imposible arrancar sin medir. El equipo implementa PostHog "como sea" desde el lunes.
- **Reposicionamiento:** vender un **sistema** (atención al cliente, agentes con autonomía), no un "chatbot".
- **Producto de entrada low-ticket (~$500):** agente básico sin conexión a sistemas, para retener leads que no compran high-ticket.
- **Arquitectura con fallbacks:** siempre tener proveedor principal + respaldo que rote automáticamente si falla.
- **Dos ambientes (producción + staging):** cuando salga al público, cambios nunca directo en prod.
- **Benchmarking de modelos:** iterar con el mismo prompt en distintos modelos (Nano Banana Pro 1 vs 2, Higgsfield vs Seedance 2, Sonnet 4.6 → 5) para decidir por costo-beneficio.
- Preferir proveedores multi-modelo (Fal.ai) sobre casarse con un solo.

## Acciones

- **Equipo técnico:** implementar PostHog desde el lunes; resolver dudas y ejecutar lo faltante.
- **Elvin:** montar dashboard de data por cliente (llamadas, conversaciones, minutos).
- **Elvin:** empaquetar producto low-ticket (~$500).
- **Elvin:** iterar/benchmarkear modelos; revisar ángulo de anuncios de la agencia de IA.
- **Alejo:** agendar sesión aparte para revisión profunda de agentes de WhatsApp.

## Entidades Clave

- [[alejo]] — mentor/AI engineer senior; asesoró arquitectura, data, y estrategia de producto.
- [[valentina-contreras]] — vendedora, cerró **primera suscripción de $99** durante la reunión.
- [[bori-autoflow]] — plataforma de IA / agentes de voz y WhatsApp.
- [[postHog]] — herramienta de analítica obligatoria.
- [[fal-ai]] — proveedor multi-modelo (imágenes, voz clonada, flexible).
- [[higgsfield]] — proveedor de video; ejemplo de dependencia a deshacer con fallbacks.
- [[claude-anthropic]] — Sonnet 4.6 deprecándose, hay que subir a Sonnet 5.
- [[cursor]] — caso de startup IA-first; 6 personas, ~$100M en 1.8 años, vendida a OpenAI.
- [[agente-vs-chatbot]] — concepto clave: agente ejecuta acciones (autonomía), chatbot solo responde.
- [[futuro-es-la-voz]] — tesis: "El futuro es la voz. Concuerdo cien por ciento." La visión es "hey Boris, hazme una campaña para mi negocio".

## Frases de Elvin

- "Yo no quiero vender chatbot, yo vendo un sistema."
- "El marketing es la buena del negocio, y las ventas son el corazón."
- "Si no hay cash, ¿qué vamos a hacer?"
- "El futuro es la voz. En eso yo concuerdo cien por ciento."
- "Mi visión mayor es construir un buen producto de voz... que le pueda hablar y decirle 'hey Boris, hazme una campaña para mi negocio con esta imagen'."
- "Yo obligatoriamente tengo que tener un dashboard de cada cliente con la data, y sin eso no se puede arrancar."
- "Si yo le ayudo al negocio con algo pequeñito, me va a comprar de nuevo."

## Aprendizajes IA (de Alejo)

- Fallbacks de proveedores: 2-3 de respaldo, rotación automática.
- Detectar deprecación de modelos: Anthropic/OpenAI retiran viejos; hay que mantenerse actualizado.
- Grabar uso real (Clarity/PostHog) para feedback enorme.
- Diseñar para usuario no nativo: entender si es técnico y simplificar UI.
- Dos ambientes + CI/CD en GitHub: nunca iterar directo en prod.
- Agentes = autonomía/ejecución; chatbots = respuesta nomás.
- Conocer el negocio del cliente ANTES de desarrollar.
- Modelo de entrada low-ticket: 10 ventas de $500 > 1 de $2,500 sin dispersarse.

## Conexiones

[[ai-borinquen]] — plataforma; [[level-up]] — traffickers/vendedora Valentina; [[ecosistema]] — lecciones de negocio transversales.

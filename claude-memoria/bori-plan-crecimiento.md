---
name: bori-plan-crecimiento
description: Plan de crecimiento de Bori (13/sep/2026) — 1,000 usuarios al día 60, 3,000 al día 90, 50K en un año; qué se decidió, qué ya está construido y qué le toca a Elvin
metadata:
  type: project
---

**Plan de 90 días (13 sep → 12 dic 2026)** en el artifact https://claude.ai/code/artifact/cd4b3976-5220-4ea0-9980-28205a6dc288 (v5). **Ruta fijada por Elvin: 1,000 usuarios al día 60 (12/nov) y 3,000 al día 90 (12/dic)**, ~330 pagando, MRR ~$25K, presupuesto $19.1K escalonado. Fase 2 (pago fuerte) no abre sin 1,000 usuarios y activación ≥40% (hoy 6%). Ruta a 50K: PR es cabeza de playa (tope realista 15–20K), el resto viene de Florida (Q1 2027), latino en EE.UU. y RD (Q2), LatAm + versión en inglés (Q3).

**Decisiones que Elvin ya tomó:** líder de visión, ~6 h/semana, **NO graba video por ahora** (la cara la ponen Bori el coquí como presentador de IA, UGC de dueños de negocio y demos de pantalla con voz IA; él da un audio semanal de 30 min). Equipo: **Head de Crecimiento remoto en LatAm** (a contratar; $1,800–3,000 + variable por activados; prueba de 48h pagada), **su trafficker** es dueño del motor de pago y anfitrión del Bori Live, lo demás lo tiene. Quiere trial de **7 días de Pro gratis con tarjeta, por tiempo limitado** (acordado: capa encima del plan gratis, no puerta única; 60 créditos con tope; cierra 31/oct; requiere correo transaccional).

**Ya construido y en producción (13/sep):** referidos regala 20/recibe 20 (`referidos.js`), Reto 7 Días con premio de 50 (`reto.js`), sello "Hecho con Bori" en descargas gratis (`sello.js`), fuente de registro por usuario y en el dashboard de negocio.

**Las 7 decisiones pendientes de Elvin:** nombrar Head de Crecimiento; aprobar $28.8K escalonado; salir él/avatar/ambos; abrir Pipedrive de LU/AIB para leads perdidos; trial 7 días (necesita desatascar el correo); Fundadores 500 cupos precio congelado; Bori Live martes 7 PM 12 semanas.

**Regla de precio (Elvin, 13/sep):** la oferta que se promueve es **Pro a $99/mes**, nunca "desde $39". Starter y Creador existen pero no se anuncian. Aplica a copy, anuncios, prensa, guiones de closers y a la regla de objeción de precio (Lis ofrece Bori Pro $99 antes de dar un lead por perdido).

**Leads perdidos (13/sep):** exportados de Pipedrive (16,109; 13,261 útiles) → `vault/proyectos/bori-crecimiento/leads-perdidos/`. Pipelines "Bori · Seguimiento" creados vacíos en Pipedrive LU (id 13) y AIB (id 4): Por contactar → Mensaje enviado → Respondió → Registrado en Bori → No interesa. Solo van los que agendaron y no cerraron (Follow-Up/No Show/Appointment/Remarketing, 2,482); los "no califica" NO. Elvin avisa cuándo moverlos. Lis Acevedo (U0BDGC8KGH4) ya tiene las instrucciones por DM.

**Compuertas del plan (no negociables):** pago no pasa de $50/día hasta activación ≥40%; CPR >$10 dos días → cambiar creativos, no subir presupuesto; churn 30d >6% → congelar captación.

**How to apply:** si Elvin pide "seguir con el plan", lo siguiente que puedo adelantar sin él: eventos del tablero (registro con fuente ✅, referido ✅, primer pago con fecha ✗), secuencia de bienvenida WhatsApp, 20 creativos, kit de prensa, landing del reto, guiones de 10 reels, trial en Stripe. Ver [[bori-backend-real]], [[elvin-ceo-perfil]], [[micro-influencers-pr]].

**Uso real (13/sep):** de los últimos 10 que compraron, solo Lumière (yesebel167) publicó en Meta; Nadia/Manny/Yarimar (Agencia/Agencia/Starter) con 0–1 uso; video se genera y no se descarga (ATSolution 10, Linda 12, 0 descargas); avatar quema créditos (20 intentos/6 usuarios). `/api/admin/uso-usuarios` (owner) da esto por cliente. El correo transaccional YA funciona (Resend, dominio verificado, desde ~10/sep): el trial no tiene bloqueo.

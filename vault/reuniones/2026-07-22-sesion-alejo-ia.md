---
fecha: 2026-07-22
fuente: granola
unidad: ai-borinquen
tags: [mentoria, alejo, claude-code, producto, autoflow, costos]
---
# Mentoría IA con Alejo — feedback de Boris/AutoFlow

Sesión técnica: Elvin le muestra a [[Alejo]] (dev senior de ecommerce, ex-marketing) la plataforma [[Boris]]/AutoFlow para recibir feedback. Coaching de dev senior; se conecta con [[ai-borinquen]] y el proyecto AI Borinquen Core.

## Decisiones de producto (Elvin)
- **Entregar Boris primero como herramienta de generación de contenido (imagen/video); las campañas después.** Orden: optimizar generación → edición → campañas. *"Yo quiero primero entregarla como una herramienta de generación de contenido."*
- **Recortó las estrategias de campañas de 8 a 4** (se quedan las 4 de arriba).
- El **generador de flyers está pensado para PRODUCTO**, hay que añadir **servicios** (son campañas/plantillas distintas).
- Adopta el flujo de **skills + plugins + MCPs** en Claude Code y va a **poner límites de gasto**.

## Action items
- **Elvin** — poner límite de gasto en Claude ($50-100) y en las APIs; hooks que pidan permiso antes de deletes/updates a la BD de producción. `t-limites-gasto-claude-apis`
- **Elvin** — reclutar **10-15 negocios** de la agencia como beta de Boris (incluso regalado) + medir **costo por usuario**. `t-beta-negocios-bori`
- **Elvin** — adoptar skills/plugins/MCPs (Exa, Serena, Superpower, skills de Postgres). `t-claude-skills-mcps-workflow`
- **Elvin + devs** — **sesión de 2h el sábado (25/07)**: 1h Elvin, 1h su equipo con Alejo. `t-alejo-sesion-sabado-devs`
- **Dev** — fix: video solo ofrece 8s (falta 5s), etiqueta mal minutos/segundos. `t-fix-duracion-video-bori`
- **Alejo** — le pasa a Elvin skills de generación de video que ya funcionan + el nombre de la skill de búsqueda web (**Exa**).

## Consejos de Alejo (con dato duro)
- **Skills = ahorro brutal de tokens/tiempo.** Sin ellas, Claude itera 10-60 min y muchas veces "dice que soluciona pero no hace lo correcto".
- **Límites de gasto — dato duro:** por una vulnerabilidad de proveedor le robaron a su empresa *"siete mil dólares"* un día y *"como doce mil"* en dos; ha visto casos de $80k.
- **Mejorar el prompt "por debajo":** los usuarios dan inputs ambiguos y culpan a la plataforma. Solución: scrapear la URL del negocio para enriquecer el prompt, mostrar plantillas de flyers ganadores (RAG), estructurar en JSON prompt.
- **Campañas:** no todo presupuesto sirve; mínimo Meta ≈ $3; poner guardrails de mín/máx por estrategia y diferenciar servicio vs producto.
- **Riesgo de baneo de cuentas de clientes** (Meta/Google/TikTok): contenido sensible + nueva regla de Meta de **marca de agua obligatoria en video con IA**. Construir el prompt para cumplir políticas.
- **Rate limits** de proveedores de imagen: varios clientes generando a la vez → error que igual descuenta créditos ("eso es un pedo").
- **Railway = Supabase** para su caso (Postgres corre en Railway): *"es más cuestión de gusto y arquitectura."*
- Los **asistentes de voz** le parecieron **"top"**. La plataforma es demasiado robusta → sacar UN foco, dejarlo bien, seguir.

## Señales de CEO
- **Dolor:** *"No estás utilizando Claude de la forma correcta… lo estoy quemando."* Gastó ~$900 el mes pasado sin límite (*"se me fue la mano"*). No sabía dónde vivían los datos de su propio proyecto (era Railway).
- **Fortaleza:** paciencia y constancia sobre prisa — *"yo no tengo apuro… esto se optimiza poco a poco."* Delega para sacar la verdad sin filtro: quiere que sus devs hablen directo con Alejo *"porque hay cosas que yo no veo."*

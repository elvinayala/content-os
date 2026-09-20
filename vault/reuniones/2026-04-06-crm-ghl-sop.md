---
fecha: 2026-04-06
fuente: granola
unidad: ai-borinquen
tags: [desarrollo, crm, ghl, sop]
---
# CRM/pipeline en Go High Level — SOP (David Quiroga)

Configuración estandarizada del CRM y pipeline en Go High Level para el AutoFlow, con David Quiroga.

## Señales / decisiones
- Todo cliente con AutoFlow completo debe tener pipeline + campos personalizados + calendario en GHL. Clientes solo-agente no lo requieren.
- Orden de onboarding: 1) CRM completo, 2) número YCloud, 3) conectar agente, 4) workflow (n8n).
- **Verificación de números de WhatsApp ahora toma 3-4 semanas** (cambio normativo). Plan: comprar número propio para que Mateo empiece pruebas.
- Costo de agente de voz: ~$1/llamada de 5 min (Vapi/Retell) — comunicarlo al vender.
- Curso AI Winners: ~10 clases nuevas de agentes de voz. Considerar migrar a Retell.
- Elvin adquirió paquete Mac de Claude (Claude Code + chat).

## Action items
- Estandarizar SOP de desarrollo (David Quiroga) para sincronizar al equipo.
- Comprar número propio para pruebas de Mateo; evaluar migración a Retell.

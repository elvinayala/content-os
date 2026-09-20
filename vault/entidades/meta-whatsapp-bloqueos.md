---
fecha: 2026-07-26
fuente: memoria
unidad: ai-borinquen
tags: [entidad, tema, técnico, obstrucción]
---

# Meta / WhatsApp — Bloqueos Técnicos y Restricciones

**Qué es:** El conjunto de restricciones, errores y fricciones que surgen al integrar agentes de IA con Meta / WhatsApp Business API en [[autoflow]]. Principal freno técnico de [[ai-borinquen]] hoy.

## Resumen acumulado

**Diagnóstico clave (Alejo, 25/07):** la mayoría de errores Meta **NO son culpa del equipo dev**; son restricciones de portafolio del cliente y documentación pésima de Meta. El problema real es de proceso y comunicación, no técnico.

**Errores recurrentes:**
- Restricción de portafolio del cliente (la causa raíz de >70% de errores)
- Método de pago asociado incorrectamente al WhatsApp (caso [[hector-casas]])
- Coexistencia de múltiples números en un portafolio (requiere aprobación directiva)
- Conexión no oficial de WhatsApp (parche actual; arriesga número del cliente)

**Arquitectura validada:**
- Meta → Webhook propio (Cloudflare Workers, JS) → GoHighLevel (para redes, oportunidades, calendario)
- CRM no es intermediario del flujo (validado por Alejo; David/Juan inicialmente resistían N8N)
- Multimedia (audios/imágenes): workaround actual es delay 1–2 seg antes de webhook

**Soluciones acordadas (25/07):**
1. **Catálogo de errores Meta** paso a paso (código → causa → solución)
2. **Checklist pre-venta:** validar configuración de portafolio ANTES de conectar
3. **Observabilidad mejorada:** PostHog + Evals en lugar de console.log
4. **Comunicación mejorada con cliente:** explicar que es restricción de portafolio (no culpa de plataforma) + plan de acción claro
5. **Alejo como consultor recurrente** para desbloqueos; centralizar desarrollo

## Línea de tiempo

- 2026-07-25 — **Sesión técnica David + Juan + Alejo**: diagnóstico = problema es proceso/comunicación, no técnico. Mayoría de errores son restricciones de portafolio del cliente, no culpa de equipo. Arquitectura validada (Cloudflare + GoHighLevel). Acuerdos: catálogo de errores, checklist pre-venta, PostHog + Evals, mejorar comunicación, Alejo recurrente ([[2026-07-25-sesion-desarrolladores-borinquen]]).

## Conexiones

[[ai-borinquen]] — plataforma afectada. [[alejo]] — consultor que diagnosticó. [[cloudflare-workers]] — arquitectura actual (JS). [[gohighlevel]] — CRM de visualización. [[posthog]] — herramienta de observabilidad nueva. [[error-metodo-pago-meta]] — caso específico de restricción.

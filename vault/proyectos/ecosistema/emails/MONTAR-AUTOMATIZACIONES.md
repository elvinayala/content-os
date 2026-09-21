> **OBSOLETA (21/sep/2026):** las 10 automatizaciones ya se montaron y están activas (ver bitácora del
> plan-ecosistema). Queda solo como referencia de la estructura. Lo pendiente humano es DNS (DKIM +
> mailserver) en domain.com / GoDaddy y la integración ManyChat → AC.

---
fecha: 2026-09-21
fuente: manual
unidad: ecosistema
tags: [activecampaign, automatizaciones, guia, jessica]
para: Jessica (montaje en la UI de ActiveCampaign)
---

# Montar las automatizaciones en ActiveCampaign · guía de 1 hora

Cuenta: `levelupmediapr17748.activehosted.com` (reactivada 21/sep). Ya están creados por API:
listas **Level Up Media (8)**, **AI Borinquen (9)**, **Shadow Operator (10)**; los tags
`marca:*`, `origen:*`, `etapa:*`, `avatar:*`, `quiz:*`, `no-agendo`; los campos Negocio,
WhatsApp, Dolor, Score diagnóstico. Los **2,484 contactos de julio** conservan sus listas
viejas (Clientes 5 · Agendados sin comprar 6 · No Show 7) y ahora también llevan
`etapa:cliente` / `etapa:no-compro` / `etapa:noshow` + `marca:lu` + `origen:importado`.

Las automatizaciones **no se pueden crear por API**: se montan a mano. Copy de cada email en
`level-up/*.md` y `ai-borinquen/*.md` de esta carpeta (asunto, preheader, cuerpo, CTA).

## 0. Antes de empezar (Elvin, 5 min) — sin esto AC no envía
Settings → Advanced → Sending Domain → **Resolve Issues** → "Setup manually" → copiar los 3
registros (DKIM, DMARC, SPF) → pegarlos en el DNS de **domain.com** (donde están los
nameservers de levelupmediapr.net) → volver y **Verify**. Hoy el dominio figura "Not
authenticated". Mismo proceso después para `aiborinquen.co`.

## 1. Bienvenida (una por marca) — Automations → Create → Start from scratch
- **Trigger:** "Subscribes to list" → Level Up Media (8). Runs: once.
- **Condición de entrada:** contacto **no** tiene tag `etapa:agendo` ni `etapa:cliente`.
- **Goal** al final: "Tag added: etapa:agendo" → si lo cumple, salta al final (sale).
- Pasos: Email 1 → Wait 2 days → Email 2 → Wait 2 days → Email 3 → Wait 3 days → Email 4 →
  Wait 3 days → Email 5 → **Add tag `bienvenida-terminada`**. (Días 0/2/4/7/10.)
- En Level Up, emails 2 y 4: **If/Else** por tag `avatar:coach` → versión coach / versión
  servicios (ambas están en `bienvenida.md`).
- Remitente: Elvin Ayala <elvin@levelupmediapr.net>. AIB: Alexis Pérez <hola@aiborinquen.co>.
- Repetir para AI Borinquen (lista 9) con `ai-borinquen/bienvenida.md`.

## 2. Lead → agenda (una por marca)
- **Trigger 1:** "Tag is added: bienvenida-terminada" · **Trigger 2:** "Tag is added: no-agendo"
  (lo pone ManyChat). Runs: once.
- Condición: no tiene `etapa:agendo`. Goal: `etapa:agendo`.
- Email 1 → Wait 1 day → Email 2 → Wait 2 days → Email 3 → Wait 3 days → Email 4. (0/1/3/6.)
- Todos los CTAs con `utm_source=lead-agenda` (ya vienen así en el copy).

## 3. Pre-llamada (la de mayor ROI; una por marca)
- **Trigger:** "Tag is added: etapa:agendo" (lo pone el webhook de Calendly). Runs: every time.
- Email 1 al instante (qué esperar + video) → Wait 1 day → Email 2 (caso del rubro) →
  **SMS** 1 h antes (bloque SMS; Twilio ya está migrado a esta cuenta) → fin.
- Goal de salida: `etapa:show` / `etapa:noshow` / `etapa:cancelo`.
- Nota: cuando tengamos el campo "Fecha de cita" desde Calendly, cambiar el Wait a
  "until date field − 1 day"; por ahora Wait fijo.

## 4. No-show y No-compró (fase 2, montar igual)
- No-show: trigger `etapa:noshow`, emails 0/1/3, goal `etapa:agendo`.
- No-compró: trigger `etapa:no-compro`, emails 1/4/9/20, goal `etapa:agendo` o `etapa:cliente`.
- Los 1,637 contactos de julio ya llevan esos tags, pero un trigger "tag added" no dispara
  hacia atrás. Para meterlos: abrir la automatización → "Add contacts" → segmento por tag.
  **Hacerlo solo con OK de Elvin** (son 1,637 emails el mismo día; mejor por lotes de 300).

## 5. Newsletter (no es automatización)
Lo produce Sofi cada miércoles a la bandeja; al aprobarlo, la app crea la campaña
programada jueves 8:00 AM PR en la lista de la marca. No hay nada que montar aquí.

## 6. ManyChat → ActiveCampaign (Jessica, 10 min)
ManyChat → Configuración → Integraciones → ActiveCampaign → conectar con la API key (Settings →
Developer en AC). En la automatización "Instagram Default Reply", después del AI Step del
dolor, agregar acción "ActiveCampaign: crear/actualizar contacto" mapeando email → email,
campo `negocio` → Negocio, `dolor` → Dolor, y tags `marca:lu` + `origen:seguidor`. En A3, al
poner el tag `no agendo` de ManyChat, agregar también el tag `no-agendo` en AC.

## 7. Prueba de punta a punta (Jessica + Claude)
1. Hacer el quiz de Level Up con un email de prueba → aparece en la lista 8 con `origen:quiz`
   → recibe Bienvenida email 1 en minutos.
2. Agendar en Calendly con ese email → tag `etapa:agendo` → recibe Pre-llamada email 1 y sale
   de Bienvenida.
3. Aprobar el newsletter en la bandeja → aparece en AC → Campaigns programado para el jueves.

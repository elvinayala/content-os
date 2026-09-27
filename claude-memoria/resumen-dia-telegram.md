---
name: resumen-dia-telegram
description: Resumen diario 8:30 PM PR por Telegram (27/sep/2026) — llamadas agendadas (Calendly) + ventas nuevas y renovaciones (hojas de tesorería), LU y AIB aparte; falta que Elvin publique el Apps Script de ventas
metadata:
  type: project
---
27/sep/2026: Elvin pidió todos los días ~8-9 PM por Telegram: llamadas agendadas hoy, $ en ventas nuevas y $ en
renovaciones, Level Up y AI Borinquen por separado. EN PROD: cron /api/cron/resumen-dia 8:30 PM PR → Telegram
(+ espejo Slack). Llamadas por Calendly de cada marca (cuadró con #office-10-lum-calls). Ventas por las hojas de
tesorería (LU de María, AIB de aiborinquen@gmail.com) → necesitan el Apps Script scripts/drive/ventas-hoy.gs que
Elvin tiene que publicar con su cuenta y pasar la URL (VENTAS_SCRIPT_URL en Vercel; el secreto ya está).

**Why:** Elvin quiere el pulso diario sin preguntarle a nadie.

**How to apply:** si pregunta por qué no salen las ventas, falta la URL del script. "Renovaciones y cuotas" = todo
lo que la hoja no marca "New Sale" (cuotas, mensualidades, renovaciones); monto = Valor Neto. Verificar el primer
resumen con ventas contra la hoja antes de darlo por bueno ([[verificar-antes-de-activar]]).

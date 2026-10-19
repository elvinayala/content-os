## Resumen del día por Telegram (27/sep/2026)

Elvin: "todos los días, como a las 8-9 de la noche: cuántas llamadas se agendaron, cuánto en ventas nuevas y
cuánto en renovaciones, Level Up y Borinquen por separado". Cron **`/api/cron/resumen-dia`** diario **8:30 PM PR**
(`30 0 * * *` UTC) → `notificarCEO` (Telegram + espejo en Slack); `?dry=1` devuelve el texto, `?dia=YYYY-MM-DD`
otro día. **Llamadas** = lo RESERVADO ese día en el Calendly de cada marca (`CALENDLY_TOKEN` /
`CALENDLY_TOKEN_AIB`; por `created_at`, onboardings y canceladas aparte; cuadró 9+3 con #office-10-lum-calls el
26/sep). **Ventas** = hojas de tesorería (privadas): LU "COPIA RESPALDO - VENTAS 2026 LEVEL UP" (pestaña "LUM
Sales <Mes> <Año>", de María) y AIB "VENTAS - IA BORINQUEN" (pestaña "<Mes>"); "Tipo de Transacción" = New Sale →
ventas nuevas, lo demás → renovaciones y cuotas; monto = "Valor Neto". Se leen con el Apps Script
`scripts/drive/ventas-hoy.gs` publicado por Elvin (`VENTAS_SCRIPT_URL` + `VENTAS_SCRIPT_SECRETO`); sin él el mensaje
dice "falta conectar la hoja". Lógica pura `lib/resumen-dia.ts` (montos $3.500,00 y $3,500.00, fechas d/m y m/d
autodetectadas; tests `tests/resumen-dia.test.mjs`), datos `lib/resumen-dia-datos.ts`. `TELEGRAM_BOT_TOKEN` se
copió de Railway a Vercel el 27/sep: desde entonces todo `notificarCEO` de Vercel también sale por Telegram.

## n8n de Level Up (`scripts/n8n.mjs`)

El back office de la agencia (98 workflows, Chatwoot, Evolution, NocoDB) vive en un VPS Contabo con
Easypanel montado por un proveedor externo. Nico lo toma: `node scripts/n8n.mjs inventario|exportar|
ejecuciones|salud|subir <id>|todo` (solo `N8N_API_KEY`, nunca la clave de la UI). Respaldo en
`data/n8n/workflows/` (re-exportar tras cada cambio); la ronda de Nico reporta workflows con error.
Plan y diagnóstico en `vault/proyectos/n8n/`. **Reportes de encuestas** (28/sep, Carilin): "D-) Tools encuestador v1" ya no publica solo en
#office-6: manda cada aviso a `/api/pulse/n8n/encuestas` (credencial "Pulse ↔ n8n"), Content OS los junta por teléfono
(24 h), espera 5 min sin avisos (1 min tras finalizar) y arma UN reporte con la plantilla fija de Carilin
(`lib/encuestas/reglas.ts` puro + tests, `reportes.ts`: lee la conversación de Chatwoot con `CHATWOOT_LU_URL/TOKEN` y
Claude saca solo los datos, con la decisión FINAL); n8n lo publica cada 2 min y lo nuevo va al hilo. Si el cliente
pide persona/audio → etiqueta `no-contactar-ia` en Chatwoot y el filtro `is-inbound?` de "B-) Agente de onboarding v5"
deja de contestarle. Respaldos del antes en `data/n8n/respaldos/`. Regla: sin OK de Elvin no se activa/desactiva nada ni
se tocan credenciales o webhooks.

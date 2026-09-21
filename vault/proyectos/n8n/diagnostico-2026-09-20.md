# n8n de Level Up — diagnóstico inicial (20/sep/2026)

Fuente: `node scripts/n8n.mjs todo` (API key `nico`). Respaldo en `data/n8n/workflows/` (98 JSON).

## Dónde vive todo (lo que el proveedor no había dicho)

- **Un solo VPS de Contabo** (`109.199.117.39`, Alemania) administrado con **Easypanel**
  (`ksnxqw.easypanel.host`, proyecto `levelup-media-project`). `n8nv2.levelupmediapr.net` apunta a esa IP.
- Servicios en ese VPS: **n8n**, **Chatwoot** (bandeja de WhatsApp), **Evolution API** (WhatsApp por
  QR), **NocoDB** (base de datos de clientes/estrategas), **Minio** (archivos/creativos), **Gotenberg**
  (PDFs), **Redis**, **Postgres**, quickchart. Es decir: no es "n8n", es todo el back office de la agencia.
- Si se pierde el VPS se pierde TODO junto (n8n + WhatsApp + bandeja + base de clientes).

## Respaldo

- El proveedor ya corre **"BackUp Workflows"** (cada 10 min → GitHub `level-up-media-pr/n8n-backup`,
  carpeta `workflows/`) y **"BackUp Credential"** (diario, `n8n export:credentials --all --decrypted`
  → `credentials/` del mismo repo). ⚠️ Las credenciales van **descifradas** a GitHub: hay que confirmar
  que esa org es de Elvin y que el repo es privado. Si es de ellos, tienen todas las llaves.
- Ahora también: `data/n8n/workflows/*.json` en este repo (nuestro, independiente del proveedor).

## Inventario

- 98 workflows (74 visibles + 24 archivados) · **50 activos** · 24 con ejecuciones en 7 días.
- 1,483 ejecuciones/7 días; 1,008 son el backup a GitHub. Tráfico real: ~470/semana.
- Motores reales de la agencia (por ejecuciones): onboarding v5 (103, WhatsApp+Gemini/OpenAI),
  webhook Chatwoot (100), envío de reportes v5 (63, Gmail+Gotenberg+Teams), migración Monday→NocoDB (60),
  lector de seguimientos, alertas de fases 5, cobros, bienvenida, PDFs de ciberseguridad, recordatorios.
- IA: OpenAI (gpt-5-mini/gpt-4.1-mini/gpt-5), Gemini, 2 nodos con Claude 3.7. Slack en 25 workflows,
  Teams (pymes-ai.com = el proveedor) en 8.
- 18 webhooks públicos activos (Chatwoot, agente-setting, reagendar/cancelar cita, alertas asesor…).
  Cambiar de servidor obliga a re-apuntar Chatwoot/Evolution a las nuevas URLs.

## Rotos (7 días)

1. **C-) actualización diaria de estratega** — 0 ok / 7 error. Nodo "Get an item" (Monday): un cliente en
   NocoDB sin `ID-monday` → `null.split`. Corre 5 AM, falla todos los días.
2. **B-) Agente de monitoreo v3** — 9 ok / 3 error. Nodo "Send a message14" (Slack): el bloque JSON no
   parsea cuando el nombre/empresa trae comillas o saltos de línea. Arreglo: escapar con `JSON.stringify`.
3. **Activos que nunca corren** (26): la mayoría son sub-workflows (normal), pero hay programados mudos:
   E-) citas automáticas v4 (Gmail trigger, 143 nodos, nodo "Send a message" desactivado), H-) Felicitaciones
   100-200 leads, G-) PDF de educación (su Schedule está desactivado), D-) Limpiador de minio,
   B-) Agente de Setting V5 y A-) Webhooks central v1 (webhooks sin tráfico). Hay que preguntar cuáles
   deberían estar corriendo.

## ⚠️ Cruce con Pulse (cancelar Monday)

Monday.com aparece en **8 workflows activos**: migración Monday→NocoDB (alimenta al onboarding),
Agente Cobros, Recordatorio 60-90 días, actualización de estratega, etc. **Cancelar Monday sin
re-apuntar estos workflows a Pulse rompe el onboarding automático.** Pulse necesita exponer la
API/webhooks que hoy da Monday (clientes activos, estratega asignado, fase, fecha primera campaña).

## Plan de independencia (orden)

1. ✅ Respaldo en el repo (hecho).
2. Preguntar al proveedor / confirmar: quién paga Contabo y Easypanel, acceso root SSH del VPS, dueño de
   la org GitHub `level-up-media-pr`, `N8N_ENCRYPTION_KEY`, DNS de levelupmediapr.net.
3. Cambiar la contraseña de la UI y el token de Teams/pymes-ai cuando termine el contrato; revisar que
   el repo `n8n-backup` sea privado.
4. Nico arregla los 2 rotos (con OK de Elvin) y confirma la lista de "mudos".
5. Migrar los 8 workflows de Monday a Pulse ANTES de cancelar Monday.
6. Decidir por agente: queda en n8n vs. se reescribe en Content OS / Bori.

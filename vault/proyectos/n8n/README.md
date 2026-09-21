# n8n de Level Up — tomar el control (20/sep/2026)

**Situación**: el ecosistema de automatizaciones de la agencia vive en
`https://n8nv2.levelupmediapr.net` (n8n v2, activo en producción). Lo montó y lo mantiene un
proveedor externo por **$500/mes**. Varios agentes no funcionan bien. Elvin quiere que Nico lo
monitoree, lo mejore y, si conviene, proponga otra forma de hacer esos agentes — sin perder nada
cuando deje de pagar.

## Fases

1. **Respaldo** (día 1): `node scripts/n8n.mjs todo` → inventario + JSON de cada workflow en
   `data/n8n/workflows/` + salud de 7 días. Commit. A partir de ahí el repo es el respaldo.
2. **Diagnóstico**: con `data/n8n/inventario.json` y `salud.json` → tabla de workflows: qué hace,
   qué cliente/proceso sirve, tasa de error, último fallo (nodo + mensaje), credenciales que usa.
   Clasificar: ✅ anda · ⚠️ falla a veces · ❌ roto · 💤 activo pero nunca corre.
3. **Independencia**: preguntar al proveedor (o revisar el servidor) por:
   - dónde corre (VPS/Railway/Docker), acceso root/SSH, DNS de `n8nv2.levelupmediapr.net`
   - `N8N_ENCRYPTION_KEY` (sin ella las credenciales guardadas no sirven en otro servidor)
   - base de datos (Postgres o SQLite) y si hay backups
   - Alternativa si no colaboran: levantar n8n propio (Railway, ~$10-20/mes), importar los JSON
     del repo y **re-cargar credenciales a mano** (Meta/WhatsApp, OpenAI, Pipedrive, Google…),
     cambiar las URLs de webhook en ManyChat/clientes.
4. **Monitoreo**: la ronda diaria de Nico (7 AM) ya incluye n8n (workflows con error en 24 h).
5. **Mejora / reemplazo**: por cada agente roto decidir arreglar en n8n vs. reescribir en el
   stack propio (Bori / Content OS) cuando sea más simple o más barato.

## Reglas

- Acceso por **API key** solamente. La contraseña de la UI no se guarda en ningún lado.
- Nada de activar/desactivar workflows, editar credenciales ni cambiar webhooks sin OK de Elvin.
- Antes y después de tocar un workflow: `node scripts/n8n.mjs exportar` y commit.

## Archivos

- `scripts/n8n.mjs` — inventario · exportar · ejecuciones [días] · salud · todo
- `data/n8n/inventario.json` — resumen por workflow (triggers, servicios, credenciales, modelos IA)
- `data/n8n/workflows/*.json` — respaldo re-importable (+ `_indice.json`)
- `data/n8n/salud.json` — ok/error por workflow, última falla con nodo y mensaje
- `scripts/n8n-sync-pulse.mjs` — generar · crear · actualizar · activar · probar · reporte del workflow
  "A-) Sync Pulse → NocoDB v1" (plantilla en `data/n8n/plantillas/`, ids en `data/n8n/sync-pulse.json`)
- `lib/pulse/puente-n8n.ts` + `app/api/pulse/n8n/clientes` — el lado Pulse del puente (ver salida-de-monday.md)

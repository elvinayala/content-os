---
name: proteccion-datos
description: "Papelera universal (trigger en todas las tablas) + respaldo diario cifrado en Supabase, Vercel Blob y la Mac (27/sep/2026); regla de Elvin \"nada se borra de un clic\""
metadata:
  node_type: memory
  type: project
  originSessionId: c764d2b1-b364-4884-bc3e-923a3b76fe6d
  modified: 2026-09-27T23:37:06.023Z
---

27/sep/2026 — Elvin: "asegura que nadie pueda eliminar data de un solo click, y que tengas siempre una copia de
seguridad de todos los datos fuera y en varios lugares". Montado y probado:

- **Papelera universal** en la base (migración 0029, `pulse_papelera` + trigger `papelera_guardar` en todas las tablas de
  public; TRUNCATE bloqueado). Archivos de Storage van a `papelera/<día>/` en vez de borrarse. 90 días. Restaurar por lote
  en Pulse → **Papelera y respaldos** (solo admin) o "Deshacer" 15 min en el toast.
- **Respaldo diario cifrado** (AES-256-GCM, `RESPALDO_CLAVE`) de TODA la base: Supabase (30 días) + **Vercel Blob privado
  `respaldos-ea-market`** (otro proveedor, 60 días, también los archivos) + **la Mac** en `~/Respaldos EA Market` (launchd
  `com.iamarket.respaldo`, 1 PM). La nube verifica abriendo la copia; si falla, avisa por Telegram.
- Restaurar: `scripts/respaldo.mjs listar|abrir|restaurar` (solo inserta lo que falta).

**Why:** antes todo borrado era definitivo (el acuerdo firmado se quitaba de un clic) y el respaldo cubría 8 de 60 tablas,
sin cifrar y en el mismo Supabase (plan gratis = sin backups propios de Supabase).

**How to apply:** código nuevo que borre datos debe pasar por `borrarComo()` (marca quién) y archivos por `borrarArchivos`
(nunca `storage.remove` directo). Tabla nueva queda protegida sola al día siguiente. Pendientes para Elvin: guardar
`RESPALDO_CLAVE` en su gestor de claves (sin ella los respaldos no se abren); considerar Supabase Pro ($25/mes) por los
backups físicos con restauración a un punto en el tiempo; Google Drive como 4.º lugar si lo quiere (requiere acción nueva en
el Apps Script, carpeta NO compartida con el dominio). Ver [[pulse-crm]], [[ritmo-desempeno]], [[leads-crm]].

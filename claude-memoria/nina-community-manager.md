---
name: nina-community-manager
description: Nina, la community manager (agente) de Resuelto — publica 1×/día por Zernio con mezcla 50/20/20/10 y reporta por Telegram; dónde vive, cómo se opera, qué falta
metadata:
  type: project
---

**Nina** = Community Manager de Resuelto (creada 21/sep/2026 por pedido de Elvin: "un agente con nombre e identidad que publique al menos una vez al día, creativo, post/carrusel/reel, feriados PR + federales, 50% problema / 20% solución / 20% producto / 10% mentalidad, y que se reporte por Telegram"). NO es Sofi/Lola: es un agente de Resuelto, separado de las agencias.

**Dónde vive:** `vault/proyectos/plomeria-pr/agente/src/community/` (identidad, feriados, biblioteca, render, zernio-posts, telegram, nina) dentro del servicio `agente` de Railway. Reloj propio: preaviso 7:30 AM, publicación 11:00 AM AST. Estado en el volumen (`data/estado/community.json`). Imágenes que genera: SVG→PNG con sharp (1080×1350, Sora + DM Sans instaladas en el Dockerfile desde google/fonts) servidas en `/community/media/`. Endpoints admin: `/admin/nina/plan`, `POST /admin/nina/ejecutar?modo=publicar|programar|borrador`, `/admin/nina/preaviso`. Doc: `NINA-COMMUNITY-MANAGER.md`.

**Zernio posts API:** `POST /v1/posts` con `mediaItems[{url,type}]`, `platforms[{platform,accountId}]` (de `GET /v1/accounts/health`), `publishNow` | `scheduledFor` | `isDraft`. Sin cuentas conectadas → borrador. **21/sep 11:45 PM: IG @resueltoapp.pr + FB Resuelto PR conectados en Zernio; primer post real programado para el 22/sep 11:00 AM (f01, Zernio 6ab1f8e7…). Overrides: `?creativo=<id>&fecha=YYYY-MM-DD`. Claude a veces devuelve JSON con saltos de línea crudos → `parsearGuion` los escapa. Telegram LISTO 22/sep: bot @Nina_resueltoCM_bot, chat de Elvin 8771242182 (vars en Railway y agente/.env); mismo bot para escalaciones y avisos de candidatos.

**Why:** Elvin quiere feed vivo y coherente antes/durante los anuncios, sin tocar nada él; Zernio ya estaba en el stack por WhatsApp y su API de posts cubre IG/FB/reels/carruseles.
**How to apply:** para cambiar mezcla/horas → `identidad.ts`; para sumar un creativo (reel nuevo) → subirlo a la landing y añadirlo a `biblioteca.ts`; nunca hacer que Nina mencione Bori/agencias; probar siempre con `modo=borrador` antes de publicar.

---
name: apps-sin-app-store
description: Elvin quiere sus apps (Ritmo empleados, clientes de Level Up, Bori) como PWA con push, sin App Store/Play Store; Ritmo fue la primera (29/sep/2026)
metadata:
  type: project
---
Elvin (29/sep/2026): "quiero que sean apps sin pasar por la App Store o Play Store, con push notification". Orden: **Ritmo** (empleados) primero → app de **clientes de Level Up** → push en **Bori móvil** (`~/bori-demo`, ya instalable pero sin push).

Decisión técnica: PWA + Web Push con VAPID (sin Firebase/OneSignal). En Ritmo: `/ritmo/app`, `public/ritmo/sw.js`, tabla `desempeno_push` (campo `app` para reusar), `lib/push/`. Cada aviso de Ritmo por Slack sale también como push; Slack sigue siendo el canal principal. **EN PRODUCCIÓN desde el 29/sep** (migración 0038 aplicada, llaves VAPID en Vercel Production, deploy por CLI desde un worktree limpio de main); falta que Elvin la instale en su iPhone y confirme que llega la prueba.

**Why:** evitar revisión/cuota de Apple y publicar al instante; mismo código y cuentas.
**How to apply:** limitaciones que hay que recordarle: en iPhone solo con la app agregada a la pantalla de inicio desde Safari (iOS 16.4+), el permiso lo toca la persona, el push no lleva datos sensibles, y cambiar de dominio o de llaves VAPID obliga a reactivar. Plan B si algún día hace falta tienda: envolver la PWA (Play Store fácil; App Store difícil). Ver [[ritmo-desempeno]] y [[bori-agente]].

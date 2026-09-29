---
name: commits-sesiones-paralelas
description: Varias sesiones editan el mismo repo a la vez; antes de commitear revisar que el diff del archivo sea solo mío (ya rompió 2 deploys)
metadata:
  type: feedback
---
En AGENTE CONTENIDO trabajan varias sesiones de Claude en paralelo sobre el mismo working tree (la app móvil de Ritmo, Remi, Arena…). Si edito un archivo que otra sesión también tiene modificado y hago `git add <archivo>`, me llevo sus cambios a medias al commit → `main` importa archivos que no existen y el deploy falla (28/sep: `lib/desempeno/cambios` en actions.ts; 29/sep: `components/ritmo/app-movil` en layout/nav/page).

**Why:** el build de Vercel se hace desde `main`; un import a un archivo sin commitear rompe producción.

**How to apply:** antes de `git add`, correr `git diff <archivo>` y confirmar que TODOS los hunks son míos. Si hay ajenos: armar la versión limpia (la de HEAD + solo mis cambios), commitearla y devolver al working tree la versión con los cambios de la otra sesión. Nunca `git add -A` ni `git add .`. Relacionado: [[deploy-vault-empaque]].

OJO con Python: `open(p,"w").write(f(...))` abre (y VACÍA) el archivo antes de calcular; si f falla queda en 0 bytes (pasó con nav.tsx y CLAUDE.md el 29/sep). Calcular primero, escribir después. Para recuperar, el working copy de antes está en los autostash de `git pull --autostash` (`git show <stash>:archivo`).

#!/usr/bin/env bash
# Despliega el estado actual (incluye data/*.json y vault/) a producción en Vercel.
# Lo llama /brief-ceo (y otras tareas que escriben snapshots) al final, para que el
# Command Center en la nube nunca quede viejo. data/ está gitignored pero Vercel lo
# sube igual (se rige por .vercelignore). Usa VERCEL_TOKEN si está en el entorno
# (más robusto ante expiración de sesión del CLI); si no, usa la sesión del CLI.
# En Railway (puente de Telegram) corre sin sesión: necesita VERCEL_TOKEN y el
# .vercel/project.json del repo (viaja con el upload); vercel link lo recrea si falta.
set -euo pipefail
cd "$(dirname "$0")/.."

# Antes de subir, bajar lo que otro lado (Railway / la Mac) haya cambiado, para no pisarlo.
node scripts/sync-data.mjs pull 2>/dev/null || true
# GitHub es la fuente de verdad desde el 20/sep (Nico en la nube commitea y sube): si este clon
# tiene remoto, traer lo suyo primero (sin romper nada si hay conflicto: se avisa y se sigue).
if git remote get-url origin >/dev/null 2>&1; then
  git pull --rebase --autostash -q origin main 2>/dev/null || echo "⚠️ git pull con conflicto: resolver a mano (git status)"
fi
echo "▶ Desplegando snapshots a producción…"
if [ -n "${VERCEL_TOKEN:-}" ]; then
  if [ ! -f .vercel/project.json ]; then
    npx --yes vercel link --yes --project content-os --token="$VERCEL_TOKEN" >/dev/null 2>&1 || true
  fi
  npx --yes vercel --prod --yes --token="$VERCEL_TOKEN" 2>&1 | grep -iE "Aliased|Production|error" | tail -3
else
  npx vercel --prod --yes 2>&1 | grep -iE "Aliased|Production|error" | tail -3
fi
echo "✔ Deploy terminado."

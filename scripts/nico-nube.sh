#!/usr/bin/env bash
# Arranque de NICO en Railway (servicio `nico`, Dockerfile.nico). GitHub es la fuente de verdad:
# clona (o actualiza) en /estado/repos/<id> cada plataforma de data/plataformas.json que tenga
# campo `github`, y corre el puente de Telegram DESDE el clon de content-os, para que lo que Nico
# cambie (código, data/, vault/) se commitee y suba a GitHub (scripts/telegram-puente.mjs →
# gitBajar/gitSubir). La Mac es una copia: `git pull` antes de trabajar.
#
# Variables: GH_TOKEN (token de GitHub con permiso Contents: read/write en los repos) o
# GIT_SSH_KEY_B64 (llave privada en base64). Más las del puente (TELEGRAM_BOT_TOKEN_NICO,
# TELEGRAM_CEO_CHAT_ID, ANTHROPIC_API_KEY, SLACK_BOT_TOKEN, CRON_SECRET, VERCEL_TOKEN…).
set -uo pipefail
export HOME="${HOME:-/estado}"
REPOS="${NICO_REPOS_DIR:-/estado/repos}"
SEMILLA="${SEMILLA_DIR:-/app}"   # copia del repo que viaja en la imagen (solo para arrancar)
mkdir -p "$REPOS" "$HOME/.ssh"

git config --global user.name "Nico (IA Market)"
git config --global user.email "nico@iamarket.co"
git config --global --add safe.directory '*'
git config --global pull.rebase true
if [ -n "${GH_TOKEN:-}" ]; then
  git config --global url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf "git@github.com:"
  git config --global --add url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf "https://github.com/"
elif [ -n "${GIT_SSH_KEY_B64:-}" ]; then
  echo "$GIT_SSH_KEY_B64" | base64 -d > "$HOME/.ssh/id_ed25519"; chmod 600 "$HOME/.ssh/id_ed25519"
  ssh-keyscan -t ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null
else
  echo "⚠️ Sin GH_TOKEN ni GIT_SSH_KEY_B64: no puedo clonar los repos privados."
fi

# id|github de cada plataforma con repo en GitHub.
node -e '
const j=JSON.parse(require("fs").readFileSync(process.argv[1]+"/data/plataformas.json","utf8"));
for(const p of j.plataformas) if(p.github) console.log(p.id+"|"+p.github);' "$SEMILLA" | while IFS='|' read -r id gh; do
  d="$REPOS/$id"
  if [ -d "$d/.git" ]; then
    (cd "$d" && git pull --rebase --autostash -q 2>&1 | tail -1) && echo "↻ $id actualizado"
  else
    git clone -q "git@github.com:$gh.git" "$d" 2>&1 | tail -1 && echo "⬇ $id clonado" || echo "✗ no pude clonar $gh"
  fi
done

CO="$REPOS/content-os"
if [ ! -f "$CO/package.json" ]; then
  echo "⚠️ content-os no está clonado; arranco desde la copia de la imagen ($SEMILLA)."
  CO="$SEMILLA"
else
  cd "$CO"
  # deps solo si cambió el lockfile desde la última vez
  if [ ! -d node_modules ] || ! cmp -s package-lock.json node_modules/.lock-instalado 2>/dev/null; then
    npm ci --omit=dev --ignore-scripts >/dev/null 2>&1 && cp package-lock.json node_modules/.lock-instalado && echo "📦 deps instaladas"
  fi
fi
cd "$CO"
echo "▶ Nico arranca en $CO · repos: $(ls "$REPOS" 2>/dev/null | tr '\n' ' ')"
exec node --dns-result-order=ipv4first scripts/telegram-puente.mjs

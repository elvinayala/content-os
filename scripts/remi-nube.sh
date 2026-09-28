#!/usr/bin/env bash
# Arranque de Remi (servicio de render) en Railway: clona/actualiza content-os desde GitHub, instala las
# dependencias de motion/ (y el Chrome headless de Remotion) y levanta motion/servicio/servidor.mjs DESDE el clon.
set -uo pipefail
export HOME="${HOME:-/estado}"
REPO="${REMI_REPO:-/estado/repos/content-os}"
mkdir -p "$(dirname "$REPO")" "$HOME/.ssh"
git config --global --add safe.directory '*'
git config --global pull.rebase true
if [ -n "${GH_TOKEN:-}" ]; then
  git config --global url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf "git@github.com:"
elif [ -n "${GIT_SSH_KEY_B64:-}" ]; then
  echo "$GIT_SSH_KEY_B64" | base64 -d > "$HOME/.ssh/id_ed25519"; chmod 600 "$HOME/.ssh/id_ed25519"
  ssh-keyscan -t ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null
  export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/id_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=$HOME/.ssh/known_hosts -o StrictHostKeyChecking=accept-new"
else
  echo "✖ Remi necesita GIT_SSH_KEY_B64 o GH_TOKEN para bajar el repo"; sleep 3600; exit 1
fi
GH=$(node -e 'const j=require("/app/data/plataformas.json");const p=j.plataformas.find(x=>x.id==="content-os");process.stdout.write(p&&p.github||"")' 2>/dev/null)
GH="${GH:-elvinayala/content-os}"
if [ -d "$REPO/.git" ]; then (cd "$REPO" && git pull --rebase --autostash -q) && echo "↻ content-os actualizado"
else git clone -q --depth 50 "git@github.com:$GH.git" "$REPO" && echo "⬇ content-os clonado"; fi
cd "$REPO/motion" && npm ci --no-audit --no-fund && npx remotion browser ensure
exec node "$REPO/motion/servicio/servidor.mjs"

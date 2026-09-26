#!/usr/bin/env bash
# Arranque de Sofi (servicio `puente`), Lola y Max en Railway (Dockerfile.puente). Igual que Nico (nico-nube.sh)
# pero solo con content-os: el puente corre DESDE un clon de GitHub que se actualiza antes de cada pedido
# (telegram-puente.mjs → gitBajar). Así los cerebros, el vault y los scripts siempre están al día — el 24/sep Lola
# decía "el kit de marca no existe" y "marca.md no está en el repo" porque su copia era la de su último deploy — y
# deploy-snapshots nunca sube a producción código viejo de la imagen.
# Llave: GIT_SSH_KEY_B64 (la misma de Nico, por referencia ${{nico.GIT_SSH_KEY_B64}}) o GH_TOKEN. Sin llave o si
# el clon falla, arranca como antes desde /app (la copia de la imagen): nunca se queda sin puente.
set -uo pipefail
export HOME="${HOME:-/estado}"
BOT="${PUENTE_BOT:-sofi}"
REPOS="${NICO_REPOS_DIR:-/estado/repos}"
CO="$REPOS/content-os"
mkdir -p "$REPOS" "$HOME/.ssh"

git config --global user.name "${BOT^} (IA Market)"
git config --global user.email "$BOT@iamarket.co"
git config --global --add safe.directory '*'
git config --global pull.rebase true
LLAVE=0
if [ -n "${GH_TOKEN:-}" ]; then
  git config --global url."https://x-access-token:${GH_TOKEN}@github.com/".insteadOf "git@github.com:"
  LLAVE=1
elif [ -n "${GIT_SSH_KEY_B64:-}" ]; then
  echo "$GIT_SSH_KEY_B64" | base64 -d > "$HOME/.ssh/id_ed25519"; chmod 600 "$HOME/.ssh/id_ed25519"
  ssh-keyscan -t ed25519 github.com >> "$HOME/.ssh/known_hosts" 2>/dev/null
  # ssh no usa $HOME (busca el ~/.ssh de passwd): se le indica a mano (mismo tropiezo que Nico, 23/sep).
  export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/id_ed25519 -o IdentitiesOnly=yes -o UserKnownHostsFile=$HOME/.ssh/known_hosts -o StrictHostKeyChecking=accept-new"
  LLAVE=1
fi

if [ "$LLAVE" = 1 ]; then
  GH=$(node -e 'const j=require("/app/data/plataformas.json");const p=j.plataformas.find(x=>x.id==="content-os");process.stdout.write(p&&p.github||"")' 2>/dev/null)
  GH="${GH:-elvinayala/content-os}"
  if [ -d "$CO/.git" ]; then
    (cd "$CO" && git pull --rebase --autostash -q 2>&1 | tail -1) && echo "↻ content-os actualizado"
  else
    git clone -q "git@github.com:$GH.git" "$CO" 2>&1 | tail -1 && echo "⬇ content-os clonado"
  fi
fi

if [ -f "$CO/package.json" ] && [ -d "$CO/.git" ]; then
  cd "$CO"
  if [ ! -d node_modules ] || ! cmp -s package-lock.json node_modules/.lock-instalado 2>/dev/null; then
    npm ci --omit=dev --ignore-scripts >/dev/null 2>&1 && cp package-lock.json node_modules/.lock-instalado && echo "📦 deps instaladas"
  fi
  echo "▶ ${BOT} arranca desde el clon de GitHub ($CO)"
else
  echo "⚠️ ${BOT}: sin clon de content-os (¿falta GIT_SSH_KEY_B64/GH_TOKEN?). Arranco desde la copia de la imagen (/app)."
  cd /app
fi
exec node --dns-result-order=ipv4first scripts/telegram-puente.mjs

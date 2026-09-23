#!/usr/bin/env bash
# Deja a NICO corriendo en Railway (servicio `nico`) para que no dependa de la Mac.
# Elvin (23/sep/2026): "haz lo que tengas que hacer para que Nico no dependa solo de la Mac".
#
#   bash scripts/nico-a-la-nube.sh
#
# Lo corre ELVIN en la Mac (maneja llaves: por eso no lo corre un agente). Es idempotente: se puede
# volver a correr y salta lo que ya está hecho. Pasos:
#   1. Llave SSH propia de Nico (no la tuya): la crea en ~/.ssh/nico_railway, la guarda en Railway
#      (GIT_SSH_KEY_B64) y te abre GitHub para que pegues la pública (queda en el portapapeles).
#   2. Repos de Cortex y Plagas en GitHub: hoy solo viven en la Mac. Te abre github.com/new con el
#      nombre puesto (privado, vacío), conecta el remote y sube main.
#   3. Llaves para que Nico despliegue desde la nube: RAILWAY_API_TOKEN (railway.com/account/tokens)
#      y VERCEL_TOKEN (vercel.com/account/tokens). Se escriben ocultas; Enter para saltar.
#   4. Redeploy de `nico` y espera a que arranque ("Puente de NICO arrancó. En Railway").
#   5. Apaga el Nico de la Mac (launchd) para que no se peleen por los mensajes de Telegram.
#      El plist queda como respaldo: launchctl load ~/Library/LaunchAgents/com.iamarket.nico-puente.plist
set -uo pipefail
cd "$(dirname "$0")/.."
RW="npx --yes @railway/cli"
ok() { printf "\033[32m✓\033[0m %s\n" "$*"; }
paso() { printf "\n\033[1m%s\033[0m\n" "$*"; }
tiene_var() { $RW variables --service nico --kv 2>/dev/null | grep -q "^$1="; }

paso "1/5 · Llave SSH de Nico para GitHub"
LLAVE="$HOME/.ssh/nico_railway"
if tiene_var GIT_SSH_KEY_B64; then ok "Railway ya tiene GIT_SSH_KEY_B64"; else
  [ -f "$LLAVE" ] || ssh-keygen -t ed25519 -N "" -C "nico@iamarket (Railway)" -f "$LLAVE" -q
  $RW variables --service nico --skip-deploys --set "GIT_SSH_KEY_B64=$(base64 < "$LLAVE" | tr -d '\n')" >/dev/null && ok "llave guardada en Railway"
  pbcopy < "$LLAVE.pub"
  echo "La llave PÚBLICA está en tu portapapeles. En GitHub: Title = Nico (Railway), Key = pegar, Add SSH key."
  open "https://github.com/settings/ssh/new"
  read -r -p "Cuando la hayas agregado, Enter… "
fi

paso "2/5 · Repos de Cortex y Plagas en GitHub"
subir() { # dir nombre
  local dir="$1" nombre="$2" url="git@github.com:elvinayala/$2.git"
  if git -C "$dir" remote get-url origin >/dev/null 2>&1; then ok "$nombre ya tiene remote"; else
    if ! git ls-remote "$url" >/dev/null 2>&1; then
      echo "Crea el repo PRIVADO y VACÍO (sin README) llamado $nombre."
      open "https://github.com/new?name=$nombre&visibility=private"
      read -r -p "Cuando esté creado, Enter… "
    fi
    git -C "$dir" remote add origin "$url"
  fi
  if git -C "$dir" ls-files --error-unmatch data/.secret >/dev/null 2>&1; then
    echo "⚠️  $nombre tiene data/.secret dentro de git. Queda en un repo PRIVADO que solo ves tú y Nico."
    read -r -p "¿Subir igual? (s/N) " r; [ "$r" = "s" ] || { echo "Saltado $nombre."; return; }
  fi
  git -C "$dir" push -u origin main && ok "$nombre subido"
}
subir "$HOME/ai-video-editor" cortex
subir "$HOME/Documents/Claude/Projects/plagas-puerto-rico" plagas-puerto-rico

paso "3/5 · Llaves de deploy (Enter para saltar)"
for v in RAILWAY_API_TOKEN VERCEL_TOKEN; do
  sitio=$([ $v = VERCEL_TOKEN ] && echo "vercel.com/account/tokens" || echo "railway.com/account/tokens")
  read -r -s -p "$v ($sitio): " val; echo
  [ -n "$val" ] && $RW variables --service nico --skip-deploys --set "$v=$val" >/dev/null && ok "$v guardada"
done

paso "4/5 · Redeploy de Nico en Railway"
$RW redeploy --service nico --yes >/dev/null 2>&1 || $RW up --service nico --detach
echo "Esperando a que arranque (máx. 10 min)…"
for i in $(seq 1 40); do
  sleep 15
  if $RW logs --service nico 2>/dev/null | tail -80 | grep -q "Puente de NICO arrancó. En Railway"; then ok "Nico corre en Railway"; ARRANCO=1; break; fi
done

paso "5/5 · Apagar el Nico de la Mac"
if [ "${ARRANCO:-}" = 1 ]; then
  launchctl unload "$HOME/Library/LaunchAgents/com.iamarket.nico-puente.plist" 2>/dev/null && ok "Nico de la Mac apagado (queda el plist de respaldo)"
  echo "Listo: Nico ya no depende de la Mac. Pruébalo con /ronda en su Telegram."
else
  echo "Nico no arrancó en Railway todavía: dejo el de la Mac prendido. Mira: $RW logs --service nico"
fi

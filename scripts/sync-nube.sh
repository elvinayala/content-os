#!/usr/bin/env bash
# Sincroniza "todo el Claude de la Mac" con GitHub para que Nico (Railway) sepa lo mismo que Elvin
# ve aquí. Elvin (24/sep/2026): "necesito que Nico tenga acceso a todo mi Claude cuando yo no estoy…
# le pedí lo del 5K de ISLA Run y no tenía información". Causa: los docs de ayer nunca se subieron y
# la memoria de Claude vive solo en la Mac.
#
# Corre cada 15 min por launchd (scripts/launchd/com.iamarket.sync-nube.plist). Sin tokens de IA.
#   1. Memoria de Claude (~/.claude/projects/<este repo>/memory) ↔ claude-memoria/ del repo, en los
#      dos sentidos (gana el archivo más nuevo): lo que Nico aprende también vuelve a la Mac.
#   2. Commit + push de lo que es conocimiento, no código a medias: claude-memoria/, vault/,
#      .claude/commands/, .claude/skills/, data/plataformas.json.
#   3. En los demás repos del inventario con GitHub: push de los commits que quedaron sin subir
#      (el código sin commitear NO se toca: puede estar a medias).
set -uo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
MEM="$HOME/.claude/projects/$(printf '%s' "$REPO" | sed 's#[/ ]#-#g')/memory"
LOG() { echo "$(date '+%F %T') $*"; }
export GIT_TERMINAL_PROMPT=0

cd "$REPO" || exit 1
mkdir -p claude-memoria "$MEM"
# 1. Memoria en los dos sentidos (-u: no pisa un archivo más nuevo en el destino).
rsync -a -u --exclude '.*' "$MEM/" claude-memoria/
rsync -a -u --exclude '.*' claude-memoria/ "$MEM/"

# 2. Conocimiento → GitHub.
git pull -q --rebase --autostash 2>/dev/null || LOG "pull falló (sigo)"
RUTAS=(claude-memoria vault .claude/commands .claude/skills data/plataformas.json)
git add -- "${RUTAS[@]}" 2>/dev/null
if ! git diff --cached --quiet; then
  N=$(git diff --cached --name-only | wc -l | tr -d ' ')
  git commit -q -m "Sync automático Mac → nube: $N archivo(s) de memoria/vault/comandos" -- "${RUTAS[@]}" \
    && { git push -q 2>/dev/null || { git pull -q --rebase --autostash && git push -q; } } \
    && LOG "content-os: $N archivo(s) subidos"
fi
# Si al volver del pull llegó memoria nueva de Nico, pasarla a la Mac.
rsync -a -u --exclude '.*' claude-memoria/ "$MEM/"

# 3. Commits sin subir en los demás repos del inventario.
node -e '
const j=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));
for (const p of j.plataformas) if (p.github && p.repo) console.log(p.repo);' "$REPO/data/plataformas.json" | sort -u | while IFS= read -r d; do
  [ "$d" = "$REPO" ] || [ ! -d "$d/.git" ] && continue
  git -C "$d" remote get-url origin >/dev/null 2>&1 || continue
  git -C "$d" fetch -q 2>/dev/null || continue
  A=$(git -C "$d" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
  if [ "${A:-0}" -gt 0 ]; then git -C "$d" push -q 2>/dev/null && LOG "$(basename "$d"): $A commit(s) subidos"; fi
done

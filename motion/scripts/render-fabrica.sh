#!/bin/bash
# Renderiza los anuncios de la fábrica (todos, o los ids que se pasen) → out/fabrica/<id>.mp4
cd "$(dirname "$0")/.."
IDS="$@"
[ -z "$IDS" ] && IDS=$(node -e 'const s=require("fs").readFileSync("src/fabrica/anuncios.ts","utf8");console.log([...s.matchAll(/^    id: "([^"]+)"/gm)].map(m=>m[1]).join(" "))')
for id in $IDS; do
  t0=$(date +%s)
  npx remotion render src/index.ts "$id" "out/fabrica/$id.mp4" --log=error --concurrency=6 && echo "✓ $id ($(( $(date +%s)-t0 ))s)" || echo "✗ $id"
done

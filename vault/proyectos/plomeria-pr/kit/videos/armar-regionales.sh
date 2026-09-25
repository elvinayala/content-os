#!/bin/bash
# Reel de clientes POR REGIÓN (18 s, 9:16, con música): los primeros 13.4 s del video base (su logo final dice
# "WhatsApp" y Resuelto ya no usa ese canal, 25/sep) + 4.6 s de cierre con la historia
# regional "Plomero con precio fijo en <pueblo>" (kit/flyers-clientes-regiones) + pista-clientes.py.
# Uso: ./armar-regionales.sh            → las 8 regiones
#      ./armar-regionales.sh aguadilla  → solo esa (tras regenerar su flyer con la cobertura real)
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
FLY="$AQUI/../flyers-clientes-regiones"
OUT="$AQUI/regiones"; mkdir -p "$OUT"
PISTA="$OUT/.pista-clientes.wav"
python3 "$AQUI/audio/pista-clientes.py" "$PISTA" >/dev/null
for slug in ${1:-metro bayamon caguas ponce arecibo mayaguez aguadilla fajardo}; do
  ffmpeg -v error -y -i "$AQUI/resuelto-clientes-15s.mp4" -i "$FLY/cliente-$slug-story.png" -i "$PISTA" \
    -filter_complex "[1:v]scale=1080:1920,zoompan=z='min(1.0+0.0008*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=138:s=1080x1920:fps=30,fade=t=in:st=0:d=0.3,setsar=1[fin];[0:v]trim=0:13.4,setpts=PTS-STARTPTS,setsar=1[v0];[v0][fin]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -map 2:a -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart \
    "$OUT/resuelto-clientes-$slug.mp4"
  echo "listo: regiones/resuelto-clientes-$slug.mp4"
done
rm -f "$PISTA"

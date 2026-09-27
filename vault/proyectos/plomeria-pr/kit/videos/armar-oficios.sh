#!/bin/bash
# Reels de RECLUTAMIENTO de oficios (27/sep/2026): cuerpo de 13.4 s (motion/rec-<puesto>.mp4) + 3 s de la historia del
# puesto (kit/flyers-oficios/oficio-<puesto>-story.png) + 2.6 s de cierre (motion/cta-rec.mp4) + música (19 s).
# Uso: node motion/render.mjs rec-aire rec-handyman rec-perito rec-cotizador cta-rec && ./armar-oficios.sh
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
FLY="$AQUI/../flyers-oficios"
OUT="$AQUI/oficios"; mkdir -p "$OUT"
PISTA="$OUT/.pista.wav"
python3 "$AQUI/audio/pista-clientes.py" "$PISTA" >/dev/null
for v in aire handyman perito cotizador; do
  ffmpeg -v error -y -i "$AQUI/motion/rec-$v.mp4" -i "$FLY/oficio-$v-story.png" -i "$AQUI/motion/cta-rec.mp4" -i "$PISTA" \
    -filter_complex "[0:v]trim=0:13.4,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,setsar=1[a];[1:v]scale=1080:1920,zoompan=z='min(1.0+0.0008*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1080x1920:fps=30,fade=t=in:st=0:d=0.3,setsar=1[b];[2:v]scale=1080:1920,fps=30,setsar=1[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
    -map "[v]" -map 3:a -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart \
    "$OUT/resuelto-oficio-$v.mp4"
  echo "listo: oficios/resuelto-oficio-$v.mp4"
done
rm -f "$PISTA"

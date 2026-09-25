#!/bin/bash
# Reels de CLIENTES por área (25/sep/2026, Elvin: "3 o 4 videos por área, con un call to action suave").
# Cada video = cuerpo de 13.4 s + 3 s de cierre de la ciudad (la historia "Plomero con precio fijo en <pueblo>" de
# kit/flyers-clientes-regiones) + 2.6 s de CTA ("Escríbenos un mensaje y te damos tu precio en minutos") + música
# (audio/pista-clientes.py, 19 s). Cuerpos:
#   precio      → los primeros 13.4 s de resuelto-clientes-15s.mp4 (su logo final decía "WhatsApp": se corta)
#   destape · calentador · sorpresas → motion/<nombre>.mp4 (los genera motion/render.mjs)
# Uso: ./armar-regionales.sh               → las 8 áreas × 4 videos
#      ./armar-regionales.sh caguas         → solo esa área (tras regenerar su historia con los pueblos del plomero)
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
FLY="$AQUI/../flyers-clientes-regiones"
OUT="$AQUI/regiones"; mkdir -p "$OUT"
PISTA="$OUT/.pista-clientes.wav"
python3 "$AQUI/audio/pista-clientes.py" "$PISTA" >/dev/null
cuerpo() { case "$1" in precio) echo "$AQUI/resuelto-clientes-15s.mp4";; *) echo "$AQUI/motion/$1.mp4";; esac; }
for slug in ${1:-metro bayamon caguas ponce arecibo mayaguez aguadilla fajardo}; do
  for v in precio destape calentador sorpresas; do
    ffmpeg -v error -y -i "$(cuerpo $v)" -i "$FLY/cliente-$slug-story.png" -i "$AQUI/motion/cta.mp4" -i "$PISTA" \
      -filter_complex "[0:v]trim=0:13.4,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,setsar=1[a];[1:v]scale=1080:1920,zoompan=z='min(1.0+0.0008*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1080x1920:fps=30,fade=t=in:st=0:d=0.3,setsar=1[b];[2:v]scale=1080:1920,fps=30,setsar=1[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
      -map "[v]" -map 3:a -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart \
      "$OUT/resuelto-clientes-$slug-$v.mp4"
    echo "listo: regiones/resuelto-clientes-$slug-$v.mp4"
  done
done
rm -f "$PISTA"

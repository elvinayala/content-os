#!/bin/bash
# Reels de CLIENTES de los oficios nuevos por área (27/sep/2026): cuerpo de 13.4 s (motion/cli-<video>.mp4) + 3 s del
# flyer de ciudad del oficio (kit/flyers-clientes-regiones/cliente-<área>-ciudad-<oficio>-story.png) + 2.6 s de CTA
# (motion/cta.mp4) + música (19 s). Mismo formato que los de plomería (armar-regionales.sh).
# Antes: OFICIO=<oficio> node generar.mjs <T> "<pueblos>" <Área>   (en kit/flyers-clientes-regiones)
# Uso: ./armar-clientes-oficios.sh <área-slug> [aire|handyman|electricidad …]
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
FLY="$AQUI/../flyers-clientes-regiones"
OUT="$AQUI/regiones"; mkdir -p "$OUT"
SLUG="${1:?falta el área (slug)}"; shift
PISTA="$OUT/.pista-oficios.wav"
python3 "$AQUI/audio/pista-clientes.py" "$PISTA" >/dev/null
videos() { case "$1" in aire) echo "aire-mantenimiento aire-enfria";; handyman) echo "hm-tv hm-lista";; electricidad) echo "el-breaker el-abanico";; esac; }
for oficio in ${@:-aire handyman electricidad}; do
  for v in $(videos $oficio); do
    ffmpeg -v error -y -i "$AQUI/motion/cli-$v.mp4" -i "$FLY/cliente-$SLUG-ciudad-$oficio-story.png" -i "$AQUI/motion/cta.mp4" -i "$PISTA" \
      -filter_complex "[0:v]trim=0:13.4,setpts=PTS-STARTPTS,scale=1080:1920,fps=30,setsar=1[a];[1:v]scale=1080:1920,zoompan=z='min(1.0+0.0008*on,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=90:s=1080x1920:fps=30,fade=t=in:st=0:d=0.3,setsar=1[b];[2:v]scale=1080:1920,fps=30,setsar=1[c];[a][b][c]concat=n=3:v=1:a=0[v]" \
      -map "[v]" -map 3:a -c:v libx264 -pix_fmt yuv420p -crf 20 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart \
      "$OUT/resuelto-clientes-$SLUG-$v.mp4"
    echo "listo: regiones/resuelto-clientes-$SLUG-$v.mp4"
  done
done
rm -f "$PISTA"

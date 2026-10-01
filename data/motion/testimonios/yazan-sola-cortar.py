import json, subprocess
SRC="/Users/elvinayala/Downloads/lv_0_20260930191511.mp4"
segs=[(1.0,10.5),(10.47,13.99),(14.95,27.2),(29.2,32.8),(36.94,41.22),(43.62,45.36),(52.8,59.26),(77.4,82.12)]
subs=[
 (1.0,5.2,"Mi tío, que es el dueño, se sentó con el contable,"),
 (5.2,10.5,"y me dice: «vamos a cancelar todo eso para ahorrar $9,000 mensuales»."),
 (10.47,13.99,"Yo le dije: «no hagan nada, dame dos días»."),
 (14.95,20.4,"Fui donde él, abrí Meta Ads y Shopify, las ventas de Shopify,"),
 (20.4,27.2,"y subió un 25 %… un 25 a 30 %."),
 (29.2,32.8,"Añadimos 15,000 clientes desde que empezamos con ustedes."),
 (36.94,41.22,"Cuando vi la estrategia de ustedes en Meta, las campañas,"),
 (43.62,45.36,"miré a mi tío: «¿tú sabes hacer eso?»"),
 (52.8,56.4,"Clientes fríos, medio calientes, calientes,"),
 (56.4,59.26,"los que compraron, los que no compraron…"),
 (77.4,82.12,"Por eso peleé con él por ustedes: porque hay resultados."),
]
off=[];t=0
for a,b in segs: off.append(t); t+=b-a
def m(x):
    for (a,b),o in zip(segs,off):
        if a-0.02<=x<=b+0.02: return round(o+x-a,2)
    raise Exception(x)
f=[];c=""
for i,(a,b) in enumerate(segs):
    d=b-a
    f.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS,crop=608:1080:656:0,scale=1080:1920:flags=lanczos,fps=30[v{i}]")
    f.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={d-0.06:.3f}:d=0.06[a{i}]")
    c+=f"[v{i}][a{i}]"
f.append(f"{c}concat=n={len(segs)}:v=1:a=1[v][a]")
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",SRC,"-filter_complex",";".join(f),"-map","[v]","-map","[a]","-c:v","libx264","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","yazan-corte.mp4"],check=True)
dur=round(t,2); print("dur",dur)
props={"video":"testimonios/yazan-corte.mp4","dur":dur,"nombre":"Yazan","rol":"Sola Boutique · tienda en línea","etiqueta":"AI BORINQUEN · TESTIMONIO","retrato":True,
 "logoCliente":"testimonios/sola-blanco.png","logoMarca":"testimonios/aib-lockup.png",
 "subtitulos":[{"desde":m(a),"hasta":m(b),"texto":x} for a,b,x in subs]}
json.dump(props,open("props-yazan.json","w"),ensure_ascii=False,indent=1)

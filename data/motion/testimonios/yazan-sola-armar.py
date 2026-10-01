import json, subprocess
B="base90.mp4"
segs=[(1.0,10.5),(10.47,13.99),(14.95,24.12),(29.2,32.8),(36.94,41.22),(43.62,45.36),(52.8,59.26),(77.4,82.12)]
gancho=(29.2,32.8)
REW=1.2
def run(a): subprocess.run(["ffmpeg","-y","-loglevel","error"]+a,check=True)
# 1) cuerpo en orden
f=[];c=""
for i,(a,b) in enumerate(segs):
    d=b-a
    f.append(f"[0:v]trim={a}:{b},setpts=PTS-STARTPTS[v{i}]")
    f.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={d-0.06:.3f}:d=0.06[a{i}]")
    c+=f"[v{i}][a{i}]"
f.append(f"{c}concat=n={len(segs)}:v=1:a=1[v][a]")
run(["-i",B,"-filter_complex",";".join(f),"-map","[v]","-map","[a]","-c:v","libx264","-crf","17","-preset","fast","-c:a","aac","-b:a","192k","cuerpo.mp4"])
off=[];t=0
for a,b in segs: off.append(t); t+=b-a
cuerpo=t
pos=off[3]+ (gancho[1]-gancho[0])  # donde termina la frase del gancho dentro del cuerpo
# 2) gancho
g=gancho[1]-gancho[0]
run(["-i",B,"-filter_complex",f"[0:v]trim={gancho[0]}:{gancho[1]},setpts=PTS-STARTPTS[v];[0:a]atrim={gancho[0]}:{gancho[1]},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={g-0.15:.3f}:d=0.15[a]","-map","[v]","-map","[a]","-c:v","libx264","-crf","17","-preset","fast","-c:a","aac","-b:a","192k","gancho.mp4"])
# 3) rebobinado: del final del gancho (en el cuerpo) hacia el inicio, rápido y en reversa, con look VHS
n=int(REW*30)
step=max(1,int(pos*30/n))
run(["-i","cuerpo.mp4","-i","rewind.mp3","-filter_complex",
 f"[0:v]trim=0:{pos:.3f},setpts=PTS-STARTPTS,framestep={step},reverse,setpts=N/30/TB,trim=end_frame={n},rgbashift=rh=-8:bh=8,noise=alls=22:allf=t,eq=contrast=1.12:saturation=0.75,fps=30[v];[1:a]atrim=0:{REW},volume=0.9,afade=t=out:st={REW-0.15}:d=0.15,aformat=sample_rates=48000:channel_layouts=stereo[a]",
 "-map","[v]","-map","[a]","-t",str(REW),"-c:v","libx264","-crf","17","-preset","fast","-c:a","aac","-b:a","192k","rebobina.mp4"])
# 4) unir
run(["-i","gancho.mp4","-i","rebobina.mp4","-i","cuerpo.mp4","-filter_complex",
 "[0:a]aformat=sample_rates=48000:channel_layouts=stereo[a0];[1:a]aformat=sample_rates=48000:channel_layouts=stereo[a1];[2:a]aformat=sample_rates=48000:channel_layouts=stereo[a2];[0:v][a0][1:v][a1][2:v][a2]concat=n=3:v=1:a=1[v][a]",
 "-map","[v]","-map","[a]","-c:v","libx264","-crf","18","-preset","medium","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","yazan-h.mp4"])
dur=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0","yazan-h.mp4"]))
ini=g+REW
p=json.load(open("props-yazan.json"))
subs=[{"desde":0.05,"hasta":round(g-0.05,2),"texto":"Añadimos 15,000 clientes desde que empezamos con ustedes."}]
subs+=[{"desde":round(s["desde"]+ini,2),"hasta":round(s["hasta"]+ini,2),"texto":s["texto"]} for s in p["subtitulos"]]
props={"video":"testimonios/yazan-h.mp4","dur":round(dur,2),"nombre":"Yazan","rol":"Sola Boutique · tienda en línea","acento":"#2BFF88",
 "logoCliente":"testimonios/sola-blanco.png","logoMarca":"testimonios/aib-lockup.png",
 "gancho":{"desde":0,"hasta":round(g,2)},"rebobinar":{"desde":round(g,2),"hasta":round(ini,2)},"rotuloDesde":round(ini,2),
 "subtitulos":subs}
json.dump(props,open("props-yazan-h.json","w"),ensure_ascii=False,indent=1)
print("gancho",g,"rebobina",REW,"cuerpo",round(cuerpo,2),"total",dur,"pos",pos,"step",step)

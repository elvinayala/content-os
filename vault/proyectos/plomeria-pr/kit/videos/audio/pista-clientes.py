# Pista de los reels de CLIENTES por área (19 s = cuerpo de 13.4 s + 3 s de cierre de la ciudad + 2.6 s de CTA).
# Misma receta que pista-plomeros.py; escenas en 0 · 3.2 · 6.2 · 10.6 · 13.4 (cierre regional; el logo con "WhatsApp" del video base se corta, 25/sep).
import numpy as np, wave, sys
SR = 44100; DUR = 19.0; N = int(SR*DUR); t = np.arange(N)/SR
out = np.zeros(N)
BPM = 100; beat = 60/BPM  # 0.6 s
def env(n, a=0.005, d=0.3, s=0.0, r=0.05, sus=None):
    # ADSR robusta: a/d/r en segundos, sus = nivel de sostenido (s se acepta como alias)
    sus = s if sus is None else sus
    A=int(a*SR); D=int(d*SR); R=int(r*SR)
    if A+D+R > n:  # buffers cortos: escalar los tramos
        f=n/(A+D+R+1); A=int(A*f); D=int(D*f); R=max(1,int(R*f))
    S=max(0,n-A-D-R)
    e=np.concatenate([np.linspace(0,1,A,endpoint=False), np.linspace(1,sus,D,endpoint=False), np.full(S,sus), np.linspace(sus,0,R,endpoint=False)])
    if len(e)<n: e=np.concatenate([e,np.zeros(n-len(e))])
    return e[:n]
def place(sig, at, gain=1.0):
    i = int(at*SR); j = min(N, i+len(sig)); 
    if i < N: out[i:j] += sig[:j-i]*gain
def lowpass(x, cutoff):
    rc = 1/(2*np.pi*cutoff); a = (1/SR)/(rc+1/SR); y=np.zeros_like(x); acc=0.0
    for k in range(len(x)): acc += a*(x[k]-acc); y[k]=acc
    return y
rng = np.random.default_rng(7)

# ── Kick: seno con barrido de pitch
def kick(n=int(0.35*SR)):
    tt=np.arange(n)/SR; f=55+120*np.exp(-tt*28); ph=np.cumsum(2*np.pi*f/SR)
    return np.sin(ph)*env(n,0.002,0.25,0,0.08)*np.exp(-tt*6)
# ── Clap/snare suave: ruido filtrado
def clap(n=int(0.18*SR)):
    x=rng.standard_normal(n); x=x-lowpass(x,1500); return x*env(n,0.001,0.12,0,0.05)*0.35
# ── Hat: ruido corto brillante
def hat(n=int(0.06*SR), g=1.0):
    x=rng.standard_normal(n); x=x-lowpass(x,6000); return x*env(n,0.001,0.04,0,0.02)*0.18*g
# ── Bajo: cuadrada suave filtrada
def bass(freq, n):
    tt=np.arange(n)/SR; x=np.sign(np.sin(2*np.pi*freq*tt))*0.5+0.5*np.sin(2*np.pi*freq*tt)
    return lowpass(x,220)*env(n,0.01,0.2,0.6,0.08)*0.9
# ── Pad: dos sierras desafinadas por nota, filtro abierto suave
def pad(freqs, n, cutoff=900):
    tt=np.arange(n)/SR; x=np.zeros(n)
    for f in freqs:
        for det in (0.997,1.0,1.004):
            x += ((tt*f*det)%1.0*2-1)
    x = lowpass(x/ (3*len(freqs)), cutoff)
    return x*env(n,0.12,0.4,0.75,0.35)
# ── Whoosh: ruido con barrido de filtro y crescendo→corte
def whoosh(dur=0.55):
    n=int(dur*SR); tt=np.arange(n)/SR; x=rng.standard_normal(n)
    y=np.zeros(n); acc=0.0
    for k in range(n):
        c = 300 + 5000*(tt[k]/dur)**2; a=(1/SR)/((1/(2*np.pi*c))+1/SR); acc+=a*(x[k]-acc); y[k]=acc
    e=(tt/dur)**1.6; e*=np.exp(-((tt-dur*0.92)/0.05)**2*0+1)  # crescendo
    y=y*e; y[int(n*0.93):]*=np.linspace(1,0,n-int(n*0.93))
    return y*0.9
# ── Tick del contador: click corto con tono
def tick(n=int(0.045*SR), f=1800):
    tt=np.arange(n)/SR; return (np.sin(2*np.pi*f*tt)*0.6+rng.standard_normal(n)*0.15)*env(n,0.001,0.03,0,0.01)
# ── Pop de check (ticks verdes): tono que sube rápido
def pop(n=int(0.14*SR)):
    tt=np.arange(n)/SR; f=520+700*(1-np.exp(-tt*40)); ph=np.cumsum(2*np.pi*f/SR)
    return np.sin(ph)*env(n,0.002,0.1,0,0.03)*0.7
# ── Remate: acorde mayor brillante con cola
def stinger(n=int(1.6*SR)):
    tt=np.arange(n)/SR; x=np.zeros(n)
    for f,g in ((220,1),(277.2,0.8),(329.6,0.8),(440,0.6),(659.3,0.35)):
        x += np.sin(2*np.pi*f*tt)*g*np.exp(-tt*2.2)
    x += rng.standard_normal(n)*0.05*np.exp(-tt*25)
    return x/3.5

# ── Progresión (Am · F · C · G), 1 acorde por compás de 2.4 s; arranca suave, entra el beat en 3.2
chords = [((220,261.6,329.6),110),((174.6,220,261.6),87.3),((261.6,329.6,392),130.8),((196,246.9,293.7),98)]
bar = 4*beat
for b in range(8):  # 8 compases de 2.4 s = 19.2 s
    at=b*bar; freqs,root = chords[b%4]
    n=int(min(bar, DUR-at)*SR)
    if n<=0: break
    cutoff = 500 if at<3.2 else (1100 if at<10.6 else 1500)
    place(pad(freqs,n,cutoff), at, 0.55 if at<3.2 else 0.42)
    if at>=2.4:  # bajo desde el final de la intro
        for k in range(4):
            place(bass(root, int(beat*0.9*SR)), at+k*beat, 1.0 if k in (0,2) else 0.7)
# ── Batería: entra en 3.2 (escena 2) y se llena en 6.5 (contador)
tb = 2.4
while tb < 13.4:
    k = round((tb % bar)/beat)
    if k in (0,2): place(kick(), tb, 0.95)
    if k in (1,3) and tb>=3.2: place(clap(), tb, 0.8)
    if tb>=6.2:
        place(hat(), tb, 0.8); place(hat(g=0.55), tb+beat/2, 0.8)
    elif tb>=3.2:
        place(hat(g=0.6), tb+beat/2, 0.7)
    tb += beat
# ── Whooshes en cambios de escena (terminan justo en el corte)
for cut in (3.2, 6.2, 10.6, 13.4):
    w=whoosh(0.55); place(w, cut-0.55, 0.75)
# ── Precios: un pop suave por fila del menú
for c in (6.9, 7.35, 7.8, 8.25): place(pop(), c, 0.5)
# ── Checks verdes
for c in (10.8, 11.15, 11.5): place(pop(), c+0.3, 0.85)
# ── Remate del logo + fade de todo
place(kick(), 13.4, 1.0); place(stinger(), 13.4, 1.0)  # remate en el cierre regional
place(pop(), 16.45, 0.7)  # entra la tarjeta del CTA (16.4 s)
fade_start=int(17.9*SR); out[fade_start:] *= np.linspace(1,0,N-fade_start)**1.5
intro=int(0.25*SR); out[:intro]*=np.linspace(0,1,intro)
# ── Master: compresión suave + límite
out = np.tanh(out*1.4)/np.tanh(1.4)
out = out/np.max(np.abs(out))*0.89
wave_out = wave.open(sys.argv[1] if len(sys.argv)>1 else "pista.wav","wb"); wave_out.setnchannels(1); wave_out.setsampwidth(2); wave_out.setframerate(SR)
wave_out.writeframes((out*32767).astype("<i2").tobytes()); wave_out.close(); print("ok", DUR, "s")

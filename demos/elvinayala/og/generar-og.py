#!/usr/bin/env python3
"""Genera las imágenes de compartir (Open Graph 1200x630) de las 5 páginas de elvinayala.com.
Uso: python3 generar-og.py   → og/<id>.html + og/<id>.png (Chrome headless).
Se suben en ClickFunnels: página → Settings → Sharing image."""
import os, subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

PLANTILLA = '''<!doctype html><html lang="es"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?{fuentes}&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:1200px;height:630px;overflow:hidden}}
body{{background:{bg};color:{fg};font-family:'Inter',system-ui,sans-serif;position:relative;-webkit-font-smoothing:antialiased}}
.glow{{position:absolute;inset:0;background:{glow}}}
.grid{{position:absolute;inset:0;background-image:linear-gradient({linea} 1px,transparent 1px),linear-gradient(90deg,{linea} 1px,transparent 1px);background-size:60px 60px;opacity:.5;-webkit-mask-image:radial-gradient(ellipse at 30% 40%,#000 0,transparent 75%);mask-image:radial-gradient(ellipse at 30% 40%,#000 0,transparent 75%)}}
.wrap{{position:absolute;inset:0;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}}
.top{{display:flex;align-items:center;justify-content:space-between;font:600 20px 'JetBrains Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:{muted}}}
.top b{{color:{acc};font-weight:600}}
h1{{font-family:{fhead};font-weight:{whead};font-size:{tam}px;line-height:1.02;letter-spacing:{ls};max-width:1010px;text-wrap:balance}}
h1 em{{font-style:{estilo};color:{acc};{extra}}}
.sub{{margin-top:26px;font-size:30px;line-height:1.35;color:{muted};max-width:1010px}}
.bot{{display:flex;align-items:center;justify-content:space-between}}
.pill{{display:inline-flex;align-items:center;gap:12px;background:{acc};color:{accfg};font:600 21px 'JetBrains Mono',monospace;letter-spacing:.06em;text-transform:uppercase;padding:16px 26px;border-radius:999px}}
.url{{font:600 22px 'JetBrains Mono',monospace;letter-spacing:.12em;color:{muted};text-transform:uppercase}}
{css_extra}
</style></head><body>
<div class="glow"></div><div class="grid"></div>
<div class="wrap">
  <div class="top"><span><b>●</b>&nbsp; {marca}</span><span>{etiqueta}</span></div>
  <div><h1>{titulo}</h1><p class="sub">{sub}</p></div>
  <div class="bot"><span class="pill">{cta} →</span><span class="url">elvinayala.com</span></div>
</div></body></html>'''

PAGINAS = {
  'shadow': dict(
    fuentes='family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@600&family=Caveat:wght@600',
    bg='#0f1115', fg='#f2efe8', muted='#9aa0ad', acc='#ffe14d', accfg='#14120a', linea='rgba(242,239,232,.07)',
    glow='radial-gradient(900px 500px at 12% 8%,rgba(255,225,77,.10),transparent 60%),radial-gradient(700px 500px at 100% 100%,rgba(91,140,255,.16),transparent 60%)',
    fhead="'Bricolage Grotesque',sans-serif", whead=800, tam=84, ls='-.025em', estilo='normal',
    extra='background:linear-gradient(transparent 62%,rgba(255,225,77,.55) 60%,rgba(255,225,77,.55) 90%,transparent 92%);color:#f2efe8;padding:0 .04em;margin:0 -.02em',
    marca='Shadow Operator', etiqueta='Auditoría · 1 minuto',
    titulo='¿Cuál de los 4 fundamentos de tu <em>negocio digital</em> tienes flojo?',
    sub='Responde en 1 minuto y recibe tu plan de 14 días para llegar a tus primeros $10K al mes.',
    cta='Hacer mi auditoría',
    css_extra=".sub{font-family:'Caveat',cursive;font-weight:600;font-size:44px;color:#5b8cff;margin-top:22px;line-height:1.1}"),
  'escalar': dict(
    fuentes='family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@600&family=Caveat:wght@600',
    bg='#0f1115', fg='#f2efe8', muted='#9aa0ad', acc='#e8c26a', accfg='#14120a', linea='rgba(242,239,232,.07)',
    glow='radial-gradient(900px 520px at 85% 0%,rgba(232,194,106,.16),transparent 60%),radial-gradient(700px 500px at 0% 100%,rgba(91,140,255,.12),transparent 60%)',
    fhead="'Bricolage Grotesque',sans-serif", whead=800, tam=88, ls='-.03em', estilo='normal', extra='',
    marca='Elvin Ayala', etiqueta='Negocio digital',
    titulo='Escala tu negocio digital a <em>$10K–$20K</em> al mes',
    sub='Para creadores, coaches y mentores. Audita tu negocio y recibe un plan de 14 días.',
    cta='Auditar mi negocio', css_extra=''),
  'marketing': dict(
    fuentes='family=Sora:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@600',
    bg='#0b0b0b', fg='#f5f1e8', muted='#a3a3a3', acc='#f2c14e', accfg='#0b0b0b', linea='rgba(245,241,232,.06)',
    glow='radial-gradient(900px 520px at 90% 0%,rgba(242,193,78,.17),transparent 60%)',
    fhead="'Sora',sans-serif", whead=800, tam=78, ls='-.03em', estilo='normal', extra='',
    marca='Elvin Ayala · Marketing', etiqueta='Auditoría · 1 minuto',
    titulo='¿Tu negocio ya vende pero depende de <em>referidos</em>?',
    sub='Audita tu marketing y recibe un plan de acción de 14 días en menos de 1 minuto.',
    cta='Auditar mi marketing', css_extra=''),
  'ia': dict(
    fuentes='family=Outfit:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@600',
    bg='#050e0a', fg='#e8f3ec', muted='#8fb3a0', acc='#2bff88', accfg='#04140b', linea='rgba(43,255,136,.06)',
    glow='radial-gradient(800px 500px at 88% 0%,rgba(43,255,136,.15),transparent 60%),radial-gradient(600px 420px at 0% 100%,rgba(255,138,91,.14),transparent 60%)',
    fhead="'Outfit',sans-serif", whead=700, tam=82, ls='-.025em', estilo='normal', extra='',
    marca='Elvin Ayala · IA', etiqueta='Auditoría · 1 minuto',
    titulo='¿Tu negocio todavía depende de que <em>alguien conteste</em>?',
    sub='Descubre qué puedes automatizar con IA: agentes personalizados, sistemas a la medida y capacitación.',
    cta='Auditar mi operación', css_extra=''),
  'hub': dict(
    fuentes='family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@600',
    bg='#0b0c0f', fg='#f2efe8', muted='rgba(242,239,232,.62)', acc='#e8c26a', accfg='#17120a', linea='rgba(242,239,232,.06)',
    glow='radial-gradient(900px 520px at 20% 10%,rgba(232,194,106,.16),transparent 60%),radial-gradient(700px 500px at 100% 100%,rgba(91,140,255,.10),transparent 60%)',
    fhead="'Fraunces',Georgia,serif", whead=500, tam=104, ls='-.02em', estilo='italic', extra='',
    marca='Elvin Ayala', etiqueta='Elige tu camino',
    titulo='Elige por dónde <em>empezar</em>',
    sub='Negocio digital · Marketing · Inteligencia artificial · Shadow Operator',
    cta='Explorar todo', css_extra=''),
}

for pid, p in PAGINAS.items():
    html = PLANTILLA.format(**p)
    ruta = os.path.join(AQUI, f'{pid}.html')
    open(ruta, 'w', encoding='utf-8').write(html)
    png = os.path.join(AQUI, f'og-{pid}.png')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--window-size=1200,630', '--user-data-dir=' + os.path.join('/tmp', 'og-chrome-' + pid), '--no-first-run', '--no-default-browser-check', '--virtual-time-budget=8000', f'--screenshot={png}', 'file://' + ruta],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=60)
    print(pid, os.path.getsize(png) // 1024, 'KB')

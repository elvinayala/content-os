#!/usr/bin/env python3
"""Convierte index.html (página de 4 pantallas) en un snippet para el elemento Custom JS/HTML de ClickFunnels:
todo el CSS va aislado bajo #ea-hub y el hub se monta como capa fija a pantalla completa.
Uso: python3 build-hub-cf.py  → cf/hub.html"""
import re, os
AQUI = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(AQUI, 'index.html'), encoding='utf-8').read()

css = re.search(r'<style>(.*?)</style>', src, re.S).group(1)
body = re.search(r'<body>(.*?)<script>', src, re.S).group(1)
js = re.search(r'<script>(.*?)</script>\s*</body>', src, re.S).group(1)
fonts = re.search(r'<link href="(https://fonts.googleapis.com/css2[^"]+)"', src).group(1)

PFX = '#ea-hub'

def prefijar(sel):
    out = []
    for p in [x.strip() for x in sel.split(',') if x.strip()]:
        if p == ':root':
            out.append(PFX)
        elif p in ('html', 'body', 'html, body'):
            out.append(PFX)
        elif p == '*':
            out.append(PFX + ' *')
        else:
            out.append(PFX + ' ' + p)
    return ', '.join(out)

def transformar(texto):
    res, i, n = [], 0, len(texto)
    while i < n:
        # saltar espacios/comentarios
        m = re.match(r'\s+|/\*.*?\*/', texto[i:], re.S)
        if m:
            res.append(m.group(0)); i += len(m.group(0)); continue
        j = texto.index('{', i)
        cab = texto[i:j]
        d, k = 1, j + 1
        while d:
            c = texto[k]
            d += (c == '{') - (c == '}')
            k += 1
        cuerpo = texto[j + 1:k - 1]
        if cab.strip().startswith('@media'):
            res.append(cab + '{' + transformar(cuerpo) + '}')
        elif cab.strip().startswith('@keyframes'):
            res.append(cab.replace('@keyframes ', '@keyframes ea-') + '{' + cuerpo + '}')
        else:
            res.append(prefijar(cab) + ' {' + cuerpo + '}')
        i = k
    return ''.join(res)

css2 = transformar(css)
css2 = css2.replace('animation: deriva', 'animation: ea-deriva')
# el hub es una capa fija sobre la página de ClickFunnels
css2 += '''
#ea-hub { position: fixed; inset: 0; z-index: 2147483000; background: var(--bg); color: var(--fg); font-family: var(--font-sans); -webkit-font-smoothing: antialiased; overflow: hidden; line-height: normal; }
#ea-hub h1, #ea-hub h2 { margin: 0; }
#ea-hub p { margin: 0; }
'''
# eliminar los <video> (los fondos de video se activan con VIDEOS más abajo)
body = re.sub(r'<video[^>]*></video>', '', body)
body = body.replace('<div class="fondo"></div>', '<div class="fondo"></div>')
# rutas absolutas dentro del dominio (el hub vive en "/")
for a, b in [('href="escalar/"', 'href="/escalar"'), ('href="marketing/"', 'href="/marketing"'), ('href="ia/"', 'href="/ia"'), ('href="aprende/"', 'href="/auditoria"')]:
    assert a in body, a
    body = body.replace(a, b)

# JS: sin <video> locales → configuración opcional de videos por URL absoluta
js = js.replace("var $ = function (s) { return document.querySelector(s); };", "var raiz = document.getElementById('ea-hub');\n  var $ = function (s) { return raiz.querySelector(s); };")
js = js.replace("document.querySelectorAll(", "raiz.querySelectorAll(")
js = js.replace("document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });", "document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });")
js = re.sub(r"  // videos de fondo:.*?\n  paneles\.forEach\(function \(p\) \{.*?\n  \}\);\n", "", js, flags=re.S)
js = js.replace("var qs = location.search;", "var qs = location.search; // los UTM del link viajan al quiz que elijan")
# bloquear el scroll de la página de ClickFunnels mientras el hub está encima
js = "document.documentElement.style.overflow = 'hidden'; document.body.style.overflow = 'hidden';\n" + js

# el ancla "#escalar" etc. no debe chocar con ids de ClickFunnels: quitar ids de los paneles
body = body.replace(' id="escalar"', ' data-id="escalar"').replace(' id="marketing"', ' data-id="marketing"').replace(' id="ia"', ' data-id="ia"').replace(' id="aprende"', ' data-id="aprende"')
js = js.replace("paneles.map(function (p) { return p.id; })", "paneles.map(function (p) { return p.getAttribute('data-id'); })")

# ---- prefijo ea- en TODAS las clases (así ninguna regla de ClickFunnels puede filtrarse al hub) ----
CLASES = ['bar','explorar','marca','contador','carril','arrastrando','panel','fondo','atmosfera','p1','p2','p3','p4','etiqueta','linea','cta','tiempo','pie','arrastra','puntos','legal','flechas','ant','sig','indice','abierto','cerrar']
patron = '|'.join(sorted(CLASES, key=len, reverse=True))
css2 = re.sub(r'\.(' + patron + r')(?![\w-])', r'.ea-\1', css2)
def _cls(m):
    return 'class="' + ' '.join('ea-' + t if t in CLASES else t for t in m.group(1).split()) + '"'
body = re.sub(r'class="([^"]*)"', _cls, body)
js = js.replace("'.panel'", "'.ea-panel'").replace("'abierto'", "'ea-abierto'").replace("'arrastrando'", "'ea-arrastrando'")

salida = f'''<link href="{fonts}" rel="stylesheet">
<style>
{css2}
</style>
<div id="ea-hub">
{body.strip()}
</div>
<script>
(function () {{
{js.strip()}
}})();
</script>
'''
# quitar el <script> interno duplicado envuelto en IIFE (el original ya trae su propio IIFE)
salida = salida.replace('<script>\n(function () {\n(function () {', '<script>\n(function () {')
open(os.path.join(AQUI, 'cf/hub.html'), 'w', encoding='utf-8').write(salida)
u = salida.encode('utf-16-le'); n = len(u) // 2; x = 0
for i in range(n): x = (x * 31 + int.from_bytes(u[2*i:2*i+2], 'little')) & 0xffffffff
print('cf/hub.html', n, x)

# Arma index.html: fuente.html + logos de Level Up en base64 (un solo archivo, sirve en Netlify y como Artifact).
import base64, pathlib
aqui = pathlib.Path(__file__).parent
marcas = aqui.parent.parent.parent / "public" / "marcas"
b64 = lambda p: "data:image/png;base64," + base64.b64encode((marcas / p).read_bytes()).decode()
html = (aqui / "fuente.html").read_text()
html = html.replace("<style>", "<style>\n:root { --icono: url(%s); --logo: url(%s); }" % (b64("level-up-icon-dark.png"), b64("level-up-logo-dark.png")), 1)
(aqui / "index.html").write_text(html)
print(f"✓ index.html ({len(html)//1024} KB)")

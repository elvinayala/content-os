#!/usr/bin/env python3
"""Arma armador/index.html (la página que usa Lis) con todo embebido: motor, marcas, testimonios y el ejemplo de KAS."""
import json, pathlib
import armar as A

AQUI = pathlib.Path(__file__).parent
emb = lambda r, base=AQUI: A.embeber(r, base)
marcas = {k: {"nombre": v["nombre"], "logo": emb(v["logo"]), "css": v["css"], "fuentes": v["fuentes"]} for k, v in A.MARCAS.items()}
test = {k: v for k, v in json.loads((AQUI / "testimonios.json").read_text()).items() if not k.startswith("_")}
ej = json.loads((AQUI / "ejemplo/kas.json").read_text())
base_ej = AQUI / "ejemplo"
R = {
    "css": (AQUI / "motor/base.css").read_text() + (AQUI / "motor/kit.css").read_text(),
    "js": (AQUI / "motor/motor.js").read_text(),
    "marcas": marcas, "klarna": emb("marca/klarna.svg"), "testimonios": test,
    "ejemplo": {"datos": ej, "logo": emb(ej["cliente"]["logo"], base_ej), "fotos": [emb(f, base_ej) for f in ej["cliente"]["fotos"]]},
}
pag = (AQUI / "armador/pagina.html").read_text()
pag = pag.replace("__LOGO_LU__", marcas["level-up"]["logo"])
pag = pag.replace("__RECURSOS__", json.dumps(R, ensure_ascii=False).replace("</", "<\\/"))
pag = pag.replace("__ARMAR__", (AQUI / "armador/armar.js").read_text())
(AQUI / "armador/index.html").write_text(pag)
print(f"✓ armador/index.html · {len(pag) / 1e6:.1f} MB")

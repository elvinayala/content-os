// Motor del armador (versión navegador de armar.py — si cambias uno, cambia el otro).
// armarPropuesta(datos, img, R) → { html, n }
//   datos: el JSON de la propuesta · img: { logo, fotos: [] } en data URI · R: recursos embebidos (css, js, logos, testimonios)
(function () {
  const e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" }[c]));
  const txt = (s) => e(s).replace(/\*\*(.+?)\*\*/g, '<span class="bronce">$1</span>').replace(/\*(.+?)\*/g, '<span class="oro">$1</span>').replace(/\n/g, "<br>");
  const dinero = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#f5f1e8"/></svg>';
  const d2 = (n) => n.toFixed(2), d1 = (n) => n.toFixed(1);

  window.armarPropuesta = function (datos, img, R) {
    const marca = R.marcas[datos.marca || "level-up"];
    if (!marca) throw new Error('"marca" tiene que ser "level-up" o "ai-borinquen".');
    const c = datos.cliente || {};
    if (!c.negocio) throw new Error('Falta "cliente.negocio".');
    const logoM = marca.logo, logoC = img.logo || "";
    const fotos = (img.fotos || []).slice(0, 3);
    const S = [];
    const slide = (cuerpo, bloque) => S.push([cuerpo, bloque]);
    const marcasHtml = `<div class="marcas pop"><img class="lu" src="${logoM}" alt="${e(marca.nombre)}">` + (logoC ? `<span class="x">×</span><img class="kas" src="${logoC}" alt="${e(c.negocio)}">` : "") + "</div>";

    // 1 · Portada
    const p = datos.portada || {};
    const vitrina = fotos.map((f, i) => `<div class="foto f${i + 1}"><img src="${f}" alt=""></div>`).join("");
    slide(`<div class="portada"${fotos.length ? "" : ' style="width:1500px"'}>
      ${marcasHtml}
      <div class="ceja sube" style="--d:.3s">${e(p.ceja || "Propuesta para " + (c.nombre || c.negocio))}</div>
      <h1 class="sube" style="--d:.45s">${txt(p.titulo || c.negocio)}</h1>
      <p class="sub sube" style="--d:.65s">${txt(p.sub || "")}</p>
      <div class="fecha aparece" style="--d:.9s">${e(c.fecha || "")}</div>
    </div>
    <div class="vitrina">${vitrina}</div>`, p.pie || `${c.negocio} × ${marca.nombre}`);

    // 2 · Diagnóstico
    const d = datos.diagnostico;
    if (d) {
      const pts = d.puntos.slice(0, 4);
      const tarj = pts.map(([t, x], i) => `<div class="diag pop" style="--d:${d2(.35 + i * .18)}s"><b>${e(t)}</b><span>${e(x)}</span></div>`).join("");
      slide(`<div class="cab"><div class="ceja sube">${e(d.ceja || "Lo que hablamos")}</div>
      <h2 class="sube" style="--d:.1s">${txt(d.titulo)}</h2></div>
    <div class="grid-diag" style="grid-template-columns:repeat(${pts.length},1fr)">${tarj}</div>`, "Diagnóstico");
    }

    // 3 · Meta
    const m = datos.meta;
    if (m) {
      const valor = m.valor ? `<div class="flecha-meta aparece" style="--d:.7s">↓</div><div class="meta-din pop" style="--d:.9s">${e(m.valor)}<small>${e(m.valor_nota || "")}</small></div>` : "";
      slide(`<div class="centro">
      <div class="ceja sube">${e(m.ceja || "Tu meta")}</div>
      <div class="meta-num pop" style="--d:.2s">${e(m.numero)}<small>${e(m.unidad || "")}</small></div>
      ${valor}
      <p class="sub sube" style="--d:1.2s">${txt(m.nota || "")}</p>
    </div>`, "La meta");
    }

    // 4 · Plan
    const pl = datos.plan;
    if (pl) {
      const carriles = pl.carriles.slice(0, 3).map((car, i) => {
        const pasos = car.pasos.map((x, j) => `<span${j === car.pasos.length - 1 ? ' class="fin"' : ""}>${e(x)}</span>`).join("<i>→</i>");
        return `<div class="carril pop" style="--d:${d1(.4 + i * .4)}s"><small>${e(car.nombre)}</small><div class="pasos">${pasos}</div></div>`;
      }).join("");
      slide(`<div class="cab"><div class="ceja sube">${e(pl.ceja || "El plan")}</div>
      <h2 class="sube" style="--d:.1s">${txt(pl.titulo)}</h2></div>
    <div class="ruta">${carriles}</div>`, "El plan");
    }

    // 5 · Ejemplo
    const ej = datos.ejemplo;
    if (ej) {
      const a = ej.anuncio;
      let telA = "";
      if (a) {
        const foto = fotos[a.foto_n || 0] || fotos[0] || "";
        telA = `<div class="tel pop" style="--d:.3s">
        <div class="fb-top"><img src="${logoC || logoM}" alt=""><div><b>${e(a.pagina || c.negocio)}</b><span>Publicidad</span></div></div>
        <p class="fb-txt">${e(a.texto)}</p>
        ${foto ? `<img class="fb-foto" src="${foto}" alt="">` : ""}
        <div class="fb-cta"><div><small>${e((a.web || "").toUpperCase())}</small><b>${e(a.producto)}</b></div><span class="btn-fb">${e(a.boton || "Comprar")}</span></div>
      </div>`;
      }
      const burbujas = (ej.chat || []).map(([quien, t], i) => {
        const clase = quien === "cliente" ? "yo" : quien === "enlace" ? "ag link" : "ag";
        const cont = quien === "enlace" ? `<b>${e(t)}</b><span>${e(ej.web || "")}</span>` : e(t);
        return `<div class="b ${clase} sube" style="--d:${d1(1.0 + i * .6)}s">${cont}</div>`;
      }).join("");
      const telC = burbujas ? `<div class="tel chat pop" style="--d:.6s">
        <div class="ms-top"><img src="${logoC || logoM}" alt=""><div><b>${e(c.negocio)}</b><span>Responde en segundos</span></div></div>
        <div class="burbujas">${burbujas}</div>
      </div>` : "";
      slide(`<div class="cab"><div class="ceja sube">Así se ve · ejemplo</div>
      <h2 class="sube" style="--d:.1s">${txt(ej.titulo || "Del anuncio a la venta, *sin perder a nadie.*")}</h2></div>
    <div class="telefonos">${telA}${telC}
      <div class="nota-ej aparece" style="--d:3s">EJEMPLO ILUSTRATIVO · ${e(ej.nota || "precios y disponibilidad se configuran con tu información")}</div>
    </div>`, "Ejemplo");
    }

    // 6 · Prueba
    const pr = datos.prueba;
    if (pr) {
      const ts = (pr.testimonios || []).map((k) => R.testimonios[k]).filter(Boolean).slice(0, 4);
      const faltan = (pr.testimonios || []).filter((k) => !R.testimonios[k]);
      if (faltan.length) throw new Error("Estos testimonios no existen en la biblioteca: " + faltan.join(", "));
      const mini = (t) => t.poster ? "" : `<video class="mini-v" src="${t.video}#t=1" muted playsinline preload="metadata"></video>`;
      const fondo = (t) => t.poster ? `background-image:url(${t.poster})` : "";
      if (ts.length === 1) {
        const t = ts[0];
        const dato = t.dato ? `<div class="num-p pop" style="--d:.9s"><b>${e(t.dato[0])}</b><small>${e(t.dato[1])}</small></div>` : "";
        slide(`<div class="cab"><div class="ceja sube">${e(pr.ceja || "Ya lo hicimos")}</div>
      <h2 class="sube" style="--d:.1s">«${txt(t.cita)}»</h2></div>
    <div class="prueba">
      <button type="button" class="video-h pop" style="--d:.35s;${fondo(t)}" data-video="${t.video}" aria-label="Ver el testimonio de ${e(t.nombre)}">
        ${mini(t)}<div class="play">${PLAY}</div><span class="dur">${e(t.dur || "")}</span></button>
      <div class="dato-p"><b class="sube" style="--d:.6s">${e(t.nombre)}</b><span class="sube" style="--d:.7s">${e(t.negocio)}</span>${dato}<div class="legal-p aparece" style="--d:1.4s">Resultados de clientes reales; cada negocio es distinto. Toca el video para verlo.</div></div>
    </div>`, "Prueba");
      } else if (ts.length) {
        const cards = ts.map((t, i) => {
          const cita = txt(t.cita).replace(/<span class="oro">(.+?)<\/span>/g, "<em>$1</em>");
          return `<div class="testi sube" style="--d:${d2(.2 + i * .12)}s"><button type="button" class="video" data-video="${t.video}" aria-label="Ver el testimonio de ${e(t.nombre)}" style="${fondo(t)}">${mini(t)}<div class="play">${PLAY}</div><span class="dur">${e(t.dur || "")}</span></button>
          <b>${e(t.nombre)}</b><span>${e(t.negocio)}</span><q>${cita}</q></div>`;
        }).join("");
        slide(`<div class="cab" style="text-align:center;align-items:center;left:0;right:0;top:110px"><div class="ceja sube">${e(pr.ceja || "Lo dicen ellos")}</div>
      <h2 class="sube" style="--d:.1s">${txt(pr.titulo || "Resultados reales, *en su propia voz.*")}</h2></div>
    <div class="testis" style="grid-template-columns:repeat(${ts.length},300px);justify-content:center;gap:40px;top:290px;left:0;right:0">${cards}</div>
    <div class="legal aparece" style="--d:1.2s">RESULTADOS DE CLIENTES REALES · CADA NEGOCIO ES DISTINTO · TOCA UN VIDEO PARA VERLO</div>`, "Prueba");
      }
    }

    // 7 · Servicios
    (datos.servicios || []).forEach((sv, i) => {
      const items = sv.incluye.map((t, j) => `<li class="sube" style="--d:${d2(.3 + j * .09)}s"><i>${CHECK}</i>${e(t)}</li>`).join("");
      slide(`<div class="servicio">
      <div class="lado-s">
        <div class="ceja sube">${e(sv.ceja || "Servicio " + (i + 1))}</div>
        <h2 class="sube" style="--d:.1s">${txt(sv.nombre)}</h2>
        <p class="sub sube" style="--d:.2s">${txt(sv.sub || "")}</p>
        <div class="precio pop" style="--d:.5s"><small>INVERSIÓN</small><b>$<span data-cuenta="${Math.round(sv.precio)}">0</span></b><span>${e(sv.precio_nota || "")}</span></div>
        ${sv.nota ? `<div class="nota-s aparece" style="--d:1.2s">${e(sv.nota)}</div>` : ""}
      </div>
      <ul class="incluye">${items}</ul>
    </div>`, sv.pie || "Servicio " + (i + 1));
    });

    // 8 · Proyección
    const py = datos.proyeccion;
    if (py) {
      const alturas = [120, 252, 380];
      const cols = py.meses.slice(0, 3).map((col, j) => `<div class="col-p"><div class="barra-p b${j + 1}" style="height:${alturas[j]}px">${col.cifra ? `<i>${e(col.cifra)}</i>` : ""}</div><b${j === 2 ? ' class="oro"' : ""}>${e(col.mes)}</b><span>${e(col.texto)}</span></div>`).join("");
      slide(`<div class="cab"><div class="ceja sube">${e(py.ceja || "Proyección · 3 meses")}</div>
      <h2 class="sube" style="--d:.1s">${txt(py.titulo)}</h2></div>
    <div class="proy">
      ${py.linea_meta ? `<div class="meta-linea aparece" style="--d:1.2s"><span>${e(py.linea_meta)}</span></div>` : ""}
      ${cols}
    </div>
    <div class="legal-proy aparece" style="--d:1.8s">${e(py.legal || "Proyección ilustrativa; los resultados dependen de tu producto, tu operación y tu inversión en anuncios.")}</div>`, "Proyección");
    }

    // 9 · Inversión
    const inv = datos.inversion;
    if (inv) {
      const lista = inv.piezas || (datos.servicios || []).map((sv) => ({ nombre: sv.corto || sv.nombre.replace(/\*/g, ""), precio: sv.precio }));
      const suma = lista.reduce((a, x) => a + x.precio, 0), bono = inv.bono || 0, total = suma - bono;
      let piezas = lista.map((x, j) => (j ? `<div class="mas aparece" style="--d:${d1(.5 + j * .5)}s">+</div>` : "") +
        `<div class="pieza pop" style="--d:${d1(.4 + j * .5)}s"><small>${e(x.nombre.toUpperCase())}</small><b>$<span data-cuenta="${Math.round(x.precio)}">0</span></b></div>`).join("");
      if (lista.length > 1 || bono) piezas += `<div class="mas aparece" style="--d:1.2s">=</div>
        <div class="pieza total pop" style="--d:1.4s"><small>${bono ? "TOTAL CON TU BONO" : "TOTAL"}</small>${bono ? `<s>${dinero(suma)}</s>` : ""}<b>$<span data-cuenta="${Math.round(total)}" data-delay="1500">0</span></b></div>`;
      slide(`<div class="centro">
      <div class="ceja sube">${e(inv.ceja || "Tu inversión")}</div>
      <h2 class="sube" style="--d:.1s">${txt(inv.titulo || "Todo el sistema, *en una sola mirada.*")}</h2>
      <div class="suma">${piezas}</div>
      ${bono ? `<div class="bono pop" style="--d:1.9s"><b>🎁 Bono de ${dinero(bono)}</b> ${e(inv.bono_texto || "si tomas los servicios juntos.")}</div>` : ""}
      ${inv.nota ? `<p class="sub chico sube" style="--d:2.1s">${e(inv.nota)}</p>` : ""}
      ${inv.klarna ? `<div class="klarna aparece" style="--d:2.4s"><img src="${R.klarna}" alt="Klarna"><span>¿Prefieres pagar en cuotas? Financiamiento disponible con Klarna.</span></div>` : ""}
    </div>`, "Inversión");
    }

    // 10 · Cómo arrancamos
    const ar = datos.arranque;
    if (ar) {
      const ps = ar.pasos.slice(0, 4);
      const fases = ps.map(([a, b, x], i) => `<div class="hito-k pop" style="--d:${d2(.4 + i * .25)}s"><small>${e(a)}</small><b>${e(b)}</b><span>${e(x)}</span></div>`).join("");
      slide(`<div class="cab"><div class="ceja sube">${e(ar.ceja || "Cómo arrancamos")}</div>
      <h2 class="sube" style="--d:.1s">${txt(ar.titulo || "De la firma a los *resultados.*")}</h2></div>
    <div class="linea-k" style="grid-template-columns:repeat(${ps.length},1fr)"><div class="riel aparece" style="--d:.3s"></div>${fases}</div>`, "Cómo arrancamos");
    }

    // 11 · Cierre
    const ci = datos.cierre || { titulo: "¿Arrancamos?" };
    slide(`<div class="centro">
      ${marcasHtml}
      <h2 class="grande sube" style="--d:.3s">${txt(ci.titulo)}</h2>
      <p class="sub sube" style="--d:.55s">${txt(ci.sub || "")}</p>
      <div class="firma-k aparece" style="--d:.9s">${e(ci.firma || marca.nombre + " · Elvin Ayala")}</div>
    </div>`, "Próximo paso");

    const N = S.length;
    const secciones = S.map(([cuerpo, bloque], i) => `
    <section class="slide${i === 0 ? " activa" : ""}" id="s${i + 1}">
      ${i === 0 || i === N - 1 ? "" : `<img class="logo-esq" src="${logoM}" alt="">`}
      ${cuerpo}
      <div class="pie"><span>${e(bloque)}</span><span>${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}</span></div>
    </section>`).join("");
    const css = R.css + marca.css + `
:root { --bronce: ${c.acento || "#c39a6b"}; --bronce2: ${c.acento || "#c39a6b"}; }
.mini-v { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.video-h .play, .testi .video .play { z-index: 2; }`;
    const titulo = datos.titulo_pestana || `Propuesta ${c.negocio} · ${marca.nombre}`;
    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>${e(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${marca.fuentes}&display=swap">
<style>${css}</style></head><body>
<div id="visor">
  <div id="escenario">${secciones}
    <div class="cine" id="cine" hidden><video id="cineVideo" controls playsinline preload="metadata"></video><button type="button" class="cerrar" id="cineCerrar" aria-label="Cerrar video">✕</button></div>
  </div>
</div>
<div class="girar" id="girar"><span>📱 <b>Gira el teléfono</b> para verla en grande. Toca a la derecha para avanzar.</span><button type="button" id="cerrarGirar" aria-label="Cerrar aviso">✕</button></div>
<div class="progreso" aria-hidden="true"><i id="barra"></i></div>
<div class="controles" id="controles">
  <button type="button" id="btnAnt" aria-label="Slide anterior">‹</button>
  <span class="pag" id="pag">1 / ${N}</span>
  <button type="button" id="btnSig" aria-label="Slide siguiente">›</button>
  <button type="button" id="btnRep" aria-label="Repetir la animación" title="Repetir animación (R)">↻</button>
  <button type="button" id="btnFull" aria-label="Pantalla completa" title="Pantalla completa (F)">⛶</button>
</div>
<script>${R.js.replace(/<\/script>/g, "<\\/script>")}<\/script>
</body></html>
`;
    return { html, n: N };
  };
})();

import assert from "node:assert/strict";
import { test } from "node:test";

import { clasificar, leerCarpetaDrive, linksDrive, mimeDe, nombreSeguro, seBaja, unirMaterial } from "../lib/max/material-reglas.ts";

test("links de Drive: carpetas y archivos dentro del texto de Slack", () => {
  const t = "<https://drive.google.com/drive/folders/1A7a5HJwkYLaPckJismHi0PyOV_pzgjd1?usp=sharing|drive.google.com/drive/folders/…> y https://drive.google.com/file/d/1viszDFtJbJAOr0XZSogEjxqR0W7bsZBn/view";
  const l = linksDrive(t);
  assert.deepEqual(l.carpetas, ["1A7a5HJwkYLaPckJismHi0PyOV_pzgjd1"]);
  assert.deepEqual(l.archivos, ["1viszDFtJbJAOr0XZSogEjxqR0W7bsZBn"]);
  assert.deepEqual(linksDrive("sin links").carpetas, []);
});

test("carpeta pública de Drive: subcarpetas y archivos con su nombre", () => {
  const html = `<div class="flip-entry" id="entry-A"><div class="flip-entry-info"><a href="https://drive.google.com/drive/folders/14JGqbwC7RGXDnXYOQ78" target="_blank"><div class="flip-entry-title">Fotos cl&iacute;nica</div></a></div></div>`
    + `<div class="flip-entry" id="entry-B"><div class="flip-entry-info"><a href="https://drive.google.com/file/d/1viszDFtJbJAOr0XZSogEjxqR0W7bsZBn/view?usp=drive_web" target="_blank"><div class="flip-entry-title">Logo &amp; marca.png</div></a></div></div>`;
  const e = leerCarpetaDrive(html);
  assert.equal(e.length, 2);
  assert.deepEqual(e[0], { id: "14JGqbwC7RGXDnXYOQ78", titulo: "Fotos cl&iacute;nica", carpeta: true });
  assert.deepEqual(e[1], { id: "1viszDFtJbJAOr0XZSogEjxqR0W7bsZBn", titulo: "Logo & marca.png", carpeta: false });
});

test("clasificar: la carpeta manda; videos y PDFs aparte", () => {
  assert.equal(clasificar("6FC2C198.png", mimeDe("6FC2C198.png"), "Logo"), "logo");
  assert.equal(clasificar("Logo.png", "image/png"), "logo");
  assert.equal(clasificar("IMG_8726.jpg", mimeDe("IMG_8726.jpg"), "Fotos DR"), "foto");
  assert.equal(clasificar("C0723.MP4", mimeDe("C0723.MP4"), "Brolls"), "video");
  assert.equal(clasificar("Guia de Marca y Guion.pdf", mimeDe("Guia de Marca y Guion.pdf")), "pdf");
  assert.equal(mimeDe("foto.JPG", "application/octet-stream"), "image/jpeg");
});

test("se baja lo que sirve para motion; el b-roll no (por ahora)", () => {
  assert.equal(seBaja("logo"), true);
  assert.equal(seBaja("foto", 5_000_000), true);
  assert.equal(seBaja("foto", 40_000_000), false);
  assert.equal(seBaja("video", 10), false);
  assert.equal(nombreSeguro("Fotos clínica/IMG 8726 (1).jpg"), "Fotos-clinica-IMG-8726-1-.jpg");
});

test("unir: no duplica por clave y ordena logo → fotos → pdf → videos", () => {
  const viejo = [{ clave: "drive-1", nombre: "b.jpg", tipo: "foto", origen: "drive", url: "u1" }];
  const nuevo = [{ clave: "drive-1", nombre: "b.jpg", tipo: "foto", origen: "drive", url: "u2" }, { clave: "slack-F1", nombre: "logo.png", tipo: "logo", origen: "slack", url: "u3" }, { clave: "drive-9", nombre: "C1.MP4", tipo: "video", origen: "drive", ver: "v" }];
  const u = unirMaterial(viejo, nuevo);
  assert.deepEqual(u.map((x) => x.clave), ["slack-F1", "drive-1", "drive-9"]);
  assert.equal(u[1].url, "u2");
});

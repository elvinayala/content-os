// Render de los leaderboards (CLOSER / SETTER) con la plantilla de Aure: la de Canva copiada tal cual
// (fondo negro con cuadrícula, logo LU, podio oro/plata/bronce, tarjeta blanca abajo con pastillas
// amarillas). Los montos y nombres los pone el código, exactos. Sin JSX para poder usarlo también
// desde scripts: satori acepta objetos { type, props }.
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Puesto } from "./reglas";

// (Copia de formatoDinero de reglas: import solo de tipos para que el script lo corra sin build.)
const formatoDinero = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Nodo = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Nodo | string | null | false)[]): Nodo => ({
  type,
  props: { style: { display: "flex", ...style }, children: children.filter(Boolean) },
});
const img = (src: string, style: Record<string, unknown>): Nodo => ({ type: "img", props: { src, style } });

export const ANCHO = 1080;
export const ALTO = 1920;
const S = 2; // se diseña a 540×960 (proporción del ejemplo) y se escala ×2
const px = (n: number) => n * S;

const DIR = path.join(process.cwd(), "public");
const cache = new Map<string, string>();
async function dataUri(rel: string): Promise<string> {
  if (!cache.has(rel)) cache.set(rel, `data:image/png;base64,${(await readFile(path.join(DIR, rel))).toString("base64")}`);
  return cache.get(rel)!;
}
export async function fuentes() {
  const f = (w: 600 | 700 | 800) => readFile(path.join(DIR, `leaderboard/open-sans-${w}.ttf`));
  return [
    { name: "Open Sans", data: await f(600), weight: 600 as const, style: "normal" as const },
    { name: "Open Sans", data: await f(700), weight: 700 as const, style: "normal" as const },
    { name: "Open Sans", data: await f(800), weight: 800 as const, style: "normal" as const },
  ];
}

const AMARILLO = "#EDCB5E";
const GRADIENTE = [
  "linear-gradient(180deg, #F8E27A 0%, #EFCB52 45%, #D9AC34 100%)", // 1.º
  "linear-gradient(180deg, #E3E3E3 0%, #B9B9B9 50%, #8E8E8E 100%)", // 2.º
  "linear-gradient(180deg, #F0C3AA 0%, #B87555 55%, #8A4B31 100%)", // 3.º
];

function cuadricula(x: number, y: number, w: number, hgt: number, paso = 14): Nodo {
  const lineas: Nodo[] = [];
  for (let i = 0; i <= w; i += paso) lineas.push(h("div", { position: "absolute", left: px(i), top: 0, width: 2, height: px(hgt), background: "rgba(255,255,255,0.07)" }));
  for (let j = 0; j <= hgt; j += paso) lineas.push(h("div", { position: "absolute", top: px(j), left: 0, height: 2, width: px(w), background: "rgba(255,255,255,0.07)" }));
  return h("div", { position: "absolute", left: px(x), top: px(y), width: px(w), height: px(hgt) }, ...lineas);
}

async function foto(p: Puesto, d: number): Promise<Nodo> {
  const src = await dataUri(`leaderboard/fotos/${p.foto ?? "inactivo"}.png`);
  return h(
    "div",
    { width: px(d + 6), height: px(d + 6), borderRadius: 9999, background: "#111", alignItems: "center", justifyContent: "center" },
    img(src, { width: px(d), height: px(d), borderRadius: 9999, objectFit: "cover" }),
  );
}

const monto = (p: Puesto) => (p.monto == null ? "$" : formatoDinero(p.monto));

async function columnaPodio(p: Puesto | undefined, lugar: 1 | 2 | 3): Promise<Nodo[]> {
  const conf = { 1: { cx: 270, alto: 250, w: 104, d: 88 }, 2: { cx: 162, alto: 150, w: 104, d: 74 }, 3: { cx: 378, alto: 122, w: 104, d: 74 } }[lugar];
  const base = 628;
  const topColumna = base - conf.alto;
  const hijos: Nodo[] = [
    h(
      "div",
      { position: "absolute", left: px(conf.cx - conf.w / 2), top: px(topColumna), width: px(conf.w), height: px(conf.alto + 40), borderRadius: `${px(24)}px ${px(24)}px 0 0`, backgroundImage: GRADIENTE[lugar - 1], justifyContent: "center" },
      h(
        "div",
        { marginTop: px(lugar === 1 ? 34 : 12), alignItems: "flex-start", color: "#fff" },
        h("div", { fontSize: px(lugar === 1 ? 84 : 58), fontWeight: 800, lineHeight: 1 }, String(lugar)),
        h("div", { fontSize: px(14), fontWeight: 800, marginTop: px(4) }, "ST"),
      ),
    ),
  ];
  if (p) {
    const alturaTexto = 44;
    const topTexto = topColumna - alturaTexto - 6;
    hijos.push(
      h(
        "div",
        { position: "absolute", left: px(conf.cx - 110), top: px(topTexto - conf.d - 10), width: px(220), flexDirection: "column", alignItems: "center" },
        await foto(p, conf.d),
        h("div", { marginTop: px(8), fontSize: px(13), fontWeight: 700, color: "#fff", textAlign: "center" }, p.nombre),
        h("div", { fontSize: px(13), fontWeight: 700, color: "#fff" }, monto(p)),
      ),
    );
  }
  // [columna, foto + nombre]: se pintan todas las columnas primero para que ningún nombre quede tapado.
  return [hijos[0], ...hijos.slice(1)];
}

async function filaAbajo(p: Puesto): Promise<Nodo> {
  return h(
    "div",
    { alignItems: "center", height: px(46) },
    h("div", { width: px(44), justifyContent: "center" }, await foto(p, 36)),
    h("div", { flex: 1, justifyContent: "center", fontSize: px(p.nombre.length > 16 ? 11 : 14), fontWeight: 600, color: "#111" }, p.nombre),
    h("div", { width: px(112), height: px(24), borderRadius: 9999, background: AMARILLO, alignItems: "center", justifyContent: "center", fontSize: px(11), fontWeight: 600, color: "#111" }, monto(p)),
  );
}

export async function leaderboard(opc: { tipo: "closer" | "setter"; mes: string; total?: number; podio: Puesto[]; abajo: Puesto[] }): Promise<Nodo> {
  const logo = await dataUri("marcas/level-up-logo-dark.png");
  const esCloser = opc.tipo === "closer";
  const cabecera: Nodo[] = [
    img(logo, { position: "absolute", left: px(270 - 58), top: px(22), width: px(116), height: px(84) }),
    h("div", { position: "absolute", left: 0, top: px(112), width: ANCHO, justifyContent: "center", fontSize: px(21), fontWeight: 800, color: "#fff" }, `${opc.mes} LEADERBOARD`),
  ];
  if (esCloser) {
    cabecera.push(
      h("div", { position: "absolute", left: 0, top: px(145), width: ANCHO, justifyContent: "center" },
        h("div", { padding: `${px(3)}px ${px(16)}px`, borderRadius: 9999, background: AMARILLO, fontSize: px(16), fontWeight: 700, color: "#111" }, formatoDinero(opc.total ?? 0))),
      h("div", { position: "absolute", left: 0, top: px(186), width: ANCHO, justifyContent: "center", fontSize: px(30), fontWeight: 800, color: "#fff" }, "CLOSER"),
    );
  } else {
    cabecera.push(h("div", { position: "absolute", left: 0, top: px(140), width: ANCHO, justifyContent: "center", fontSize: px(30), fontWeight: 800, color: "#fff" }, "SETTER"));
  }
  const [p1, p2, p3] = opc.podio;
  const partes = [await columnaPodio(p2, 2), await columnaPodio(p1, 1), await columnaPodio(p3, 3)];
  const columnas = [...partes.map((x) => x[0]), ...partes.flatMap((x) => x.slice(1))];
  const filas = await Promise.all(opc.abajo.map(filaAbajo));
  const tarjeta = h(
    "div",
    { position: "absolute", left: px(42), top: px(608), width: px(456), height: px(380), borderRadius: `${px(32)}px ${px(32)}px 0 0`, background: "#fff", flexDirection: "column", padding: `${px(20)}px ${px(26)}px` },
    ...filas,
  );
  return h(
    "div",
    { position: "relative", width: ANCHO, height: ALTO, background: "#1c1c1c", fontFamily: "Open Sans" },
    cuadricula(8, 4, 84, 126),
    cuadricula(478, 560, 56, 170),
    ...cabecera,
    ...columnas,
    tarjeta,
  );
}

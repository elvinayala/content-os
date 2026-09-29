// Graba la presentación cuadro por cuadro con reloj virtual (animaciones CSS + rAF + setTimeout controlados).
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const [, , archivo, salida, inicio, dursCsv] = process.argv;
const durs = dursCsv.split(",").map(Number);
fs.mkdirSync(salida, { recursive: true });
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--hide-scrollbars"] });
const matar = setTimeout(() => { console.error("timeout"); process.exit(2); }, 1500000);
try {
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  await p.evaluateOnNewDocument(() => {
    let T = 0, id = 1, rafQ = []; const timers = new Map();
    performance.now = () => T;
    window.requestAnimationFrame = (cb) => { const i = id++; rafQ.push([i, cb]); return i; };
    window.cancelAnimationFrame = (i) => { rafQ = rafQ.filter((x) => x[0] !== i); };
    window.setTimeout = (cb, ms = 0, ...a) => { const i = id++; timers.set(i, { t: T + (+ms || 0), cb, a }); return i; };
    window.clearTimeout = (i) => timers.delete(i);
    const sincronizar = () => { for (const an of document.getAnimations()) { if (an.__t0 === undefined) { an.__t0 = T; an.pause(); } an.currentTime = Math.max(0, T - an.__t0); } };
    window.__avanzar = (ms) => {
      const fin = T + ms;
      while (true) {
        const due = [...timers.entries()].filter(([, x]) => x.t <= fin).sort((a, b) => a[1].t - b[1].t)[0];
        if (!due) break;
        T = Math.max(T, due[1].t); timers.delete(due[0]); due[1].cb(...due[1].a); sincronizar();
      }
      T = fin;
      const q = rafQ; rafQ = []; q.forEach(([, cb]) => cb(T));
      sincronizar();
    };
  });
  await p.goto(`file://${archivo}#s${inicio}`, { waitUntil: "networkidle0" });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => window.__avanzar(0));
  let n = 0; const paso = 1000 / 30;
  for (let s = 0; s < durs.length; s++) {
    if (s > 0) await p.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" })));
    const cuadros = Math.round(durs[s] * 30);
    for (let k = 0; k < cuadros; k++) {
      await p.evaluate((ms) => window.__avanzar(ms), paso);
      await p.screenshot({ path: `${salida}/${String(n++).padStart(5, "0")}.jpg`, type: "jpeg", quality: 92 });
    }
  }
  console.log("cuadros", n);
} finally { clearTimeout(matar); await b.close(); }


(function () {
  const esc = document.getElementById("escenario");
  function ajustar() {
    const w = window.innerWidth, h = window.innerHeight, k = Math.min(w / 1920, h / 1080);
    esc.style.transform = `scale(${k})`; esc.style.left = (w - 1920 * k) / 2 + "px"; esc.style.top = (h - 1080 * k) / 2 + "px";
  }
  window.addEventListener("resize", ajustar); ajustar();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slides = [...document.querySelectorAll(".slide")];
  let actual = 0;
  const timers = [];
  const limpiar = () => { while (timers.length) clearTimeout(timers.pop()); };

  // Los números de los casos cuentan al entrar
  function contar(s) {
    s.querySelectorAll("[data-cuenta]").forEach((el) => {
      const hasta = +el.dataset.cuenta, pre = el.dataset.pre || "", suf = el.dataset.suf || "";
      const fmt = (n) => pre + Math.round(n).toLocaleString("en-US") + suf;
      el.textContent = fmt(0);
      if (reduce) { el.textContent = fmt(hasta); return; }
      timers.push(setTimeout(() => { const t0 = performance.now(); const paso = (n) => { const k = Math.min(1, (n - t0) / 1300), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(hasta * e); if (k < 1) requestAnimationFrame(paso); }; requestAnimationFrame(paso); }, +el.dataset.delay || 700));
    });
  }
  // Testimonios: clic → el video en grande; Esc o ✕ lo cierra
  const cine = document.getElementById("cine"), cineV = document.getElementById("cineVideo");
  const abrirCine = (src) => { cineV.src = src; cine.hidden = false; cineV.play().catch(() => {}); };
  const cerrarCine = () => { cineV.pause(); cineV.removeAttribute("src"); cineV.load(); cine.hidden = true; };
  document.querySelectorAll("[data-video]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); abrirCine(b.dataset.video); }));
  cine.addEventListener("click", (e) => { e.stopPropagation(); if (e.target === cine) cerrarCine(); });
  document.getElementById("cineCerrar").addEventListener("click", (e) => { e.stopPropagation(); cerrarCine(); });
  document.getElementById("cerrarGirar").addEventListener("click", (e) => { e.stopPropagation(); document.getElementById("girar").hidden = true; });

  function arrancar(s) { s.classList.remove("activa"); void s.offsetWidth; s.classList.add("activa"); contar(s); }
  function ir(n, forzar) {
    if (!cine.hidden) cerrarCine();
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === actual && !forzar) return;
    limpiar();
    slides[actual].classList.remove("activa");
    actual = n; arrancar(slides[actual]);
    document.getElementById("pag").textContent = `${actual + 1} / ${slides.length}`;
    document.getElementById("barra").style.width = ((actual + 1) / slides.length) * 100 + "%";
    try { history.replaceState(null, "", "#s" + (actual + 1)); } catch (e) {}
  }
  const inicial = /^#s(\d+)$/.exec(location.hash);
  actual = inicial ? Math.min(slides.length - 1, +inicial[1] - 1) : 0;
  slides.forEach((s, i) => { if (i !== actual) s.classList.remove("activa"); });
  ir(actual, true);

  document.getElementById("btnAnt").addEventListener("click", (e) => { e.stopPropagation(); ir(actual - 1); });
  document.getElementById("btnSig").addEventListener("click", (e) => { e.stopPropagation(); ir(actual + 1); });
  document.getElementById("btnRep").addEventListener("click", (e) => { e.stopPropagation(); ir(actual, true); });
  const full = () => { const d = document.documentElement; try { (document.fullscreenElement ? document.exitFullscreen() : d.requestFullscreen?.())?.catch?.(() => {}); } catch (e) {} };
  document.getElementById("btnFull").addEventListener("click", (e) => { e.stopPropagation(); full(); });
  document.getElementById("visor").addEventListener("click", (e) => ir(e.clientX < window.innerWidth * 0.3 ? actual - 1 : actual + 1));
  window.addEventListener("keydown", (e) => {
    if (!cine.hidden) { if (e.key === "Escape") cerrarCine(); else if (e.key === " ") { e.preventDefault(); cineV.paused ? cineV.play() : cineV.pause(); } return; }
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); ir(actual + 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); ir(actual - 1); }
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(slides.length - 1);
    else if (e.key === "f" || e.key === "F") full();
    else if (e.key === "r" || e.key === "R") ir(actual, true);
  });
  let x0 = null;
  window.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  window.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1)); x0 = null; });
  const ctl = document.getElementById("controles"); let dormir;
  const despertar = () => { ctl.classList.remove("dormido"); clearTimeout(dormir); dormir = setTimeout(() => ctl.classList.add("dormido"), 2600); };
  window.addEventListener("mousemove", despertar); despertar();
})();

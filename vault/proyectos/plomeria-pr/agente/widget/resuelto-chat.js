/* Widget de chat de Resuelto para las landings. Se incluye con:
   <script src="https://agente.resueltopr.com/widget.js" defer></script>
   Abre una burbuja con el mismo asistente de WhatsApp; guarda la sesión en localStorage. */
(function () {
  var API = "__API__";
  var sid = null;
  try { sid = localStorage.getItem("resuelto_sid"); if (!sid) { sid = "w-" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("resuelto_sid", sid); } } catch (e) { sid = "w-" + Date.now(); }

  var css = "\
  .rs-fab{position:fixed;right:18px;bottom:88px;z-index:9998;width:56px;height:56px;border-radius:50%;background:#0F3D5E;border:0;cursor:pointer;box-shadow:0 12px 30px -8px rgba(0,0,0,.35);display:grid;place-items:center}\
  .rs-fab svg{width:28px;height:28px}\
  .rs-box{position:fixed;right:18px;bottom:156px;z-index:9999;width:360px;max-width:calc(100vw - 36px);height:520px;max-height:calc(100vh - 180px);background:#fff;border-radius:20px;box-shadow:0 30px 60px -20px rgba(8,36,58,.4);display:none;flex-direction:column;overflow:hidden;font-family:'DM Sans',system-ui,sans-serif}\
  .rs-box.on{display:flex}\
  .rs-head{background:#0F3D5E;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}\
  .rs-head b{font-family:Sora,system-ui,sans-serif;font-size:15px;display:block}.rs-head span{font-size:12px;opacity:.75}\
  .rs-head .rs-av{width:34px;height:34px;border-radius:50%;background:#F2621F;display:grid;place-items:center}\
  .rs-head button{margin-left:auto;background:none;border:0;color:#fff;font-size:20px;cursor:pointer}\
  .rs-log{flex:1;overflow:auto;padding:14px;background:#F3EDE2;display:flex;flex-direction:column;gap:8px}\
  .rs-m{max-width:86%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.4;white-space:pre-wrap}\
  .rs-m.bot{background:#fff;color:#08243A;align-self:flex-start;border-bottom-left-radius:5px}\
  .rs-m.me{background:#DCF8C6;color:#0b2e13;align-self:flex-end;border-bottom-right-radius:5px}\
  .rs-m.wait{color:#5C6670;font-style:italic}\
  .rs-form{display:flex;gap:8px;padding:10px;border-top:1px solid #eee;background:#fff}\
  .rs-form input{flex:1;border:1.5px solid #ddd;border-radius:12px;padding:11px 12px;font:inherit;font-size:14px}\
  .rs-form button{background:#F2621F;color:#fff;border:0;border-radius:12px;padding:0 16px;font-weight:600;cursor:pointer}\
  .rs-form label{display:grid;place-items:center;width:40px;border:1.5px solid #ddd;border-radius:12px;cursor:pointer;color:#5C6670}\
  .rs-form input[type=file]{display:none}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var fab = document.createElement("button"); fab.className = "rs-fab"; fab.setAttribute("aria-label", "Chat con Resuelto");
  fab.innerHTML = '<svg viewBox="0 0 64 64" fill="none"><path d="M32 8 L56 28 V56 H8 V28 Z" fill="#fff"/><path d="M20 35 L29 44 L46 26" stroke="#F2621F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var box = document.createElement("div"); box.className = "rs-box";
  box.innerHTML = '<div class="rs-head"><div class="rs-av"><svg width="20" height="20" viewBox="0 0 64 64" fill="none"><path d="M32 8 L56 28 V56 H8 V28 Z" fill="#fff"/><path d="M20 35 L29 44 L46 26" stroke="#F2621F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div><b>Resuelto</b><span>Te damos el precio antes de llegar</span></div><button aria-label="Cerrar">×</button></div><div class="rs-log"></div><form class="rs-form"><label title="Adjuntar foto o audio">📎<input type="file" accept="image/*,audio/*,.pdf" multiple></label><input type="text" placeholder="Cuéntanos el problema…" autocomplete="off"><button type="submit">Enviar</button></form>';
  document.body.appendChild(fab); document.body.appendChild(box);

  var log = box.querySelector(".rs-log"), form = box.querySelector("form"), inp = form.querySelector('input[type=text]'), file = form.querySelector('input[type=file]');
  function add(t, cls) { var d = document.createElement("div"); d.className = "rs-m " + cls; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }
  var abierto = false;
  fab.onclick = function () { box.classList.toggle("on"); if (!abierto) { abierto = true; add("¡Hola! Soy el asistente de Resuelto. Cuéntame qué pasa en tu casa y en qué municipio estás, y te doy el precio fijo.", "bot"); } inp.focus(); };
  box.querySelector(".rs-head button").onclick = function () { box.classList.remove("on"); };

  function leer(f) { return new Promise(function (ok) { var r = new FileReader(); r.onload = function () { ok({ mime: f.type || "application/octet-stream", base64: String(r.result).split(",")[1], nombre: f.name }); }; r.readAsDataURL(f); }); }

  form.onsubmit = function (e) {
    e.preventDefault();
    var texto = inp.value.trim(); var files = Array.prototype.slice.call(file.files || []);
    if (!texto && !files.length) return;
    if (texto) add(texto, "me"); if (files.length) add("📎 " + files.map(function (f) { return f.name; }).join(", "), "me");
    inp.value = ""; file.value = "";
    var w = add("escribiendo…", "bot wait");
    Promise.all(files.map(leer)).then(function (adj) {
      return fetch(API + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: sid, texto: texto, adjuntos: adj }) });
    }).then(function (r) { return r.json(); }).then(function (j) {
      w.remove();
      (j.respuestas || []).forEach(function (t) { add(t, "bot"); });
      if (j.humano) add("Una persona del equipo sigue esta conversación por WhatsApp.", "bot wait");
      if (j.error) add(j.error, "bot wait");
    }).catch(function () { w.textContent = "No pude conectar. Escríbenos por WhatsApp."; });
  };
})();

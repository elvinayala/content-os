/* Resuelto · consentimientos y aviso de cookies (compartido por las 3 landings)
 * - Aviso de cookies/píxel con Aceptar / Rechazar (rechazar = fbq('consent','revoke')).
 * - Recoge las casillas [data-consent] de cada formulario con el texto exacto, la versión
 *   de los documentos y la hora, y lo manda junto con el lead (lead.mjs le pone IP, user agent
 *   y la hora del servidor y lo guarda como nota en GHL).
 * - Envío con estado "Enviando…", éxito y error claros.
 * Si cambias Términos, Privacidad o Reembolsos: sube VERSION y archiva la versión anterior.
 */
(function () {
  var VERSION = '2026-10-24';
  var KEY = 'resuelto_cookies';
  var TEXTO_BANNER = 'Usamos cookies y el píxel de Meta para medir nuestros anuncios. Puedes rechazarlos y el sitio funciona igual.';
  var me = document.currentScript;
  var BASE = me && me.src ? me.src.replace(/legal\/consentimiento\.js(\?.*)?$/, '') : '/';

  function leer() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // ── Aviso de cookies ──
  var banner = null;
  function decidir(v) {
    guardar(v);
    if (typeof window.fbq === 'function') { try { window.fbq('consent', v === 'si' ? 'grant' : 'revoke'); } catch (e) {} }
    if (banner) { banner.remove(); banner = null; }
  }
  function mostrarBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'ck-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.setAttribute('data-keep', '');
    banner.innerHTML = '<p>' + TEXTO_BANNER + ' <a href="' + BASE + 'privacidad/#cookies">Más información</a></p>' +
      '<div class="ck-acc"><button type="button" class="ck-b ghost" data-ck="no">Rechazar</button>' +
      '<button type="button" class="ck-b" data-ck="si">Aceptar</button></div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (b) decidir(b.getAttribute('data-ck'));
    });
    document.body.appendChild(banner);
  }
  function iniciar() {
    if (!leer()) mostrarBanner();
    document.querySelectorAll('[data-cookies]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); mostrarBanner(); });
    });
    // Mensaje propio cuando falta una casilla obligatoria
    document.querySelectorAll('input[data-consent][required]').forEach(function (c) {
      c.addEventListener('invalid', function () { c.setCustomValidity(c.checked ? '' : 'Para enviar, marca esta casilla.'); });
      c.addEventListener('change', function () { c.setCustomValidity(''); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();

  // ── Consentimientos del formulario ──
  function recoger(form) {
    var ahora = new Date().toISOString(), out = [];
    form.querySelectorAll('input[type=checkbox][data-consent]').forEach(function (c) {
      var lab = c.closest('label');
      out.push({
        tipo: c.getAttribute('data-consent'),
        accion: c.checked ? 'acepto' : 'no_marco',
        version_documento: VERSION,
        texto_casilla: lab ? (lab.textContent || '').replace(/\s+/g, ' ').trim() : '',
        origen: location.href,
        fecha_hora_cliente: ahora
      });
    });
    var ck = leer();
    if (ck) out.push({ tipo: 'cookies', accion: ck === 'si' ? 'acepto' : 'rechazo', version_documento: VERSION, texto_casilla: TEXTO_BANNER, origen: location.href, fecha_hora_cliente: ahora });
    return out;
  }

  // ── Envío con estados ──
  function enviar(form, url, data, alExito) {
    var btn = form.querySelector('button[type=submit]');
    var err = form.querySelector('.form-err');
    data.consentimientos = recoger(form);
    data.version_documentos = VERSION;
    var original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.innerHTML = '<span class="spin" aria-hidden="true"></span>Enviando…'; }
    if (err) { err.hidden = true; err.textContent = ''; }
    var fallo = function () {
      if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = original; }
      if (err) { err.textContent = 'No pudimos enviar tu información. Revisa tu conexión e intenta otra vez. Si sigue fallando, escríbenos por WhatsApp.'; err.hidden = false; }
    };
    var exito = function () {
      if (btn) { btn.removeAttribute('aria-busy'); btn.innerHTML = original; }
      alExito();
      var ok = form.querySelector('.form-ok, .ok');
      if (ok) { ok.setAttribute('tabindex', '-1'); try { ok.focus({ preventScroll: true }); } catch (e) {} }
    };
    if (!url) { exito(); return; }
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); exito(); })
      .catch(fallo);
  }

  window.ResueltoLegal = { VERSION: VERSION, recoger: recoger, enviar: enviar, cookies: mostrarBanner };
})();

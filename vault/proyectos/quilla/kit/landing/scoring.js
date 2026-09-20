/* Quilla · scoring de aplicaciones de creadores (v1)
   Puro: calcular(d) → { score, banda, calificado, gates, modeloSugerido, motivos, sub }
   Especificación: vault/proyectos/quilla/sistema-aplicacion-scoring.md §3
   Se usa en el navegador (window.QUILLA_SCORING) y en Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QUILLA_SCORING = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var W = { aud: 25, eng: 15, nicho: 12, ingresos: 12, monet: 8, objetivo: 6, disp: 6, dispos: 10, cred: 6 };
  var NICHO = { salud: 1, finanzas: 1, fitness: .85, tech: .8, belleza: .8, comida: .7, familia: .7, entretenimiento: .6, musica: .55, deportes: .55, lifestyle: .5, otro: .4 };
  var NICHO_NOMBRE = { salud: 'salud', finanzas: 'finanzas', fitness: 'fitness', tech: 'tecnología', belleza: 'belleza', comida: 'comida', familia: 'familia', entretenimiento: 'entretenimiento', musica: 'música', deportes: 'deportes', lifestyle: 'lifestyle', otro: 'otro' };
  var ING = { 0: 0, 250: .2, 1000: .4, 3000: .6, 7500: .8, 15000: .9, 30000: 1 };
  var MONET = { 0: 0, 1: .35, 2: .6, 3: .8 };
  var OBJ = { negocio: 1, delegar: 1, producto: .9, patrocinios: .7, crecer: .5 };
  var DISP = { 2: 0, 6: .5, 12: .8, 25: 1 };
  var SI = { si: 1, depende: .5, no: 0 };
  var EXC = { si: 1, depende: .5, no: .15 };
  var CRED_FUERTE = ['tv', 'radio', 'profesion'];
  var PLAT = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook', x: 'X' };

  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function logN(n, lo, hi) { return clamp01((Math.log10(Math.max(n, 1)) - lo) / (hi - lo)); }
  function lista(v) { if (Array.isArray(v)) return v; if (!v) return []; return String(v).split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function k(n) { return n >= 1000 ? (Math.round(n / 100) / 10).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(n); }

  function calcular(d) {
    d = d || {};
    var seg = { instagram: +d.seg_instagram || 0, tiktok: +d.seg_tiktok || 0, youtube: +d.seg_youtube || 0, facebook: +d.seg_facebook || 0, x: +d.seg_x || 0 };
    var principal = d.principal && seg[d.principal] !== undefined ? d.principal : null;
    if (!principal) { principal = 'instagram'; for (var p in seg) if (seg[p] > seg[principal]) principal = p; }
    var fp = seg[principal];
    var ft = seg.instagram + seg.tiktok + seg.youtube + seg.facebook + seg.x;
    var cred = lista(d.credibilidad).filter(function (c) { return c !== 'ninguna'; });
    var credFuerte = cred.some(function (c) { return CRED_FUERTE.indexOf(c) >= 0; });
    var monet = lista(d.monetizacion).filter(function (m) { return m !== 'ninguna'; });

    // engagement: % declarado; si no, vistas/seguidores (0.2 vistas por seguidor ≈ 1 %); "nose" → null
    var engPct = null;
    if (d.engagement_pct !== undefined && d.engagement_pct !== '' && d.engagement_pct !== 'nose' && d.engagement_pct !== null) engPct = +d.engagement_pct;
    else if (+d.vistas > 0 && fp > 0) engPct = (+d.vistas / fp) * 5;

    var S = {};
    S.aud = W.aud * (0.6 * logN(fp, 3.7, 5.7) + 0.4 * logN(ft, 4.0, 6.0));
    if (d.ubicacion === 'latam') S.aud *= .6; else if (d.ubicacion === 'us') S.aud *= .85;
    S.eng = W.eng * (engPct === null ? .4 : engPct < 1 ? 0 : engPct < 2 ? .55 : engPct < 4 ? .8 : 1);
    S.nicho = W.nicho * (NICHO[d.nicho] || .4);
    S.ingresos = W.ingresos * (ING[+d.ingresos] || 0);
    S.monet = W.monet * (MONET[monet.length] !== undefined ? MONET[monet.length] : 1);
    S.objetivo = W.objetivo * (OBJ[d.objetivo] || .5);
    S.disp = W.disp * (DISP[+d.disponibilidad] || 0);
    S.dispos = W.dispos * (.6 * (SI[d.revshare] || 0) + .4 * (EXC[d.exclusividad] || 0));
    S.cred = W.cred * (credFuerte ? 1 : cred.length ? .6 : 0);

    var score = 0; for (var s in S) score += S[s];
    score = Math.max(0, Math.min(100, Math.round(score)));

    var gates = [];
    if (fp < 25000 && ft < 50000 && !credFuerte) gates.push('audiencia');
    if (engPct !== null && engPct < 1) gates.push('engagement');
    if (d.revshare === 'no') gates.push('revshare');
    if (+d.disponibilidad < 4) gates.push('disponibilidad');

    var banda = gates.length ? 'no-califica' : score >= 70 ? 'llamada' : score >= 45 ? 'revision' : 'no-califica';

    var modelo;
    if (d.objetivo === 'negocio' && (+d.ingresos >= 3000 || ft >= 100000)) modelo = 'business-building';
    else if (fp >= 100000 && (d.objetivo === 'delegar' || d.nicho === 'entretenimiento' || d.nicho === 'musica')) modelo = 'management';
    else if (credFuerte || d.objetivo === 'patrocinios' || (NICHO[d.nicho] || 0) >= .8) modelo = 'partnerships';
    else modelo = 'monetizacion';

    var m = [];
    m.push('Audiencia principal ' + k(fp) + ' en ' + (PLAT[principal] || principal) + (ft > fp ? ' (' + k(ft) + ' en total)' : ''));
    if (engPct === null) m.push('Engagement sin declarar: verificar en el perfil');
    else if (engPct < 1) m.push('Engagement menor de 1 %: audiencia dormida o comprada');
    else if (engPct < 2) m.push('Engagement 1–2 %: aceptable, verificar vistas');
    else if (engPct < 4) m.push('Engagement 2–4 %: real');
    else m.push('Engagement mayor de 4 %: excepcional');
    if (d.nicho) m.push('Nicho ' + (NICHO_NOMBRE[d.nicho] || d.nicho) + ': ' + ((NICHO[d.nicho] || .4) >= .8 ? 'alto potencial de negocio' : (NICHO[d.nicho] || .4) >= .6 ? 'potencial medio' : 'potencial bajo para producto propio'));
    if (+d.ingresos >= 3000) m.push('Ya genera $' + (+d.ingresos).toLocaleString('en-US') + '+ al mes con su audiencia');
    else if (+d.ingresos > 0) m.push('Genera menos de $3K al mes: audiencia sin explotar');
    else m.push('No monetiza todavía');
    if (credFuerte) m.push('Credibilidad fuerte fuera de redes (' + cred.join(', ') + ')');
    if (d.revshare === 'no') m.push('Sin disposición a revenue share');
    else if (d.revshare === 'depende') m.push('Revenue share: "depende" — aclarar en la llamada');
    if (d.exclusividad === 'no') m.push('No acepta exclusividad limitada al proyecto');
    if (+d.disponibilidad < 4) m.push('Menos de 4 horas a la semana');
    if (d.ubicacion === 'latam') m.push('Audiencia mayormente en Latinoamérica');
    else if (d.ubicacion === 'us') m.push('Audiencia mayormente hispana en EE. UU.');
    gates.forEach(function (g) { m.push('Gate: ' + g); });

    return { score: score, banda: banda, calificado: banda === 'llamada', gates: gates, modeloSugerido: modelo, motivos: m, sub: S, principal: principal, seguidoresPrincipal: fp, seguidoresTotal: ft, engagementEstimado: engPct };
  }

  return { calcular: calcular, PESOS: W, NICHO: NICHO, version: '1.0' };
});

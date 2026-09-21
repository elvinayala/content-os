#!/usr/bin/env node
// Pipeline de creadores para colaboraciones (Bori primero; sirve para LU/AIB/Shadow).
// Elvin (21/sep/2026): "hay creadores que tú no estás encontrando: 10–15K seguidores pero con un
// engagement orgánico bueno, hablan bonito, tienen estilo. No podemos subestimarlos." Este script
// convierte ese ojo en números: cualquiera (Elvin por Telegram, Lis, un agente) agrega un @handle;
// /creadores (Claude + Apify) baja el perfil y sus últimos 12 posts; `puntuar` calcula el score con
// el criterio de Elvin y deja la ficha en data/creadores.json, que es el tablero del pipeline.
//
//   node scripts/creadores.mjs agregar @a @b --por elvin --marca bori --nota "..."
//   node scripts/creadores.mjs puntuar data/creadores/raw/<handle>.json   (item del Actor apify/instagram-profile-scraper)
//   node scripts/creadores.mjs lista [por-vetar|vetado|contactado|cotizado|aprobado|publicado|descartado]
//   node scripts/creadores.mjs estado @handle <estado> [--nota "..."]
//   node scripts/creadores.mjs tabla-viernes        → las 3 mejores cotizaciones pendientes de OK de Elvin
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DB = path.join(ROOT, "data/creadores.json");
const leer = () => { try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return { actualizadoEl: null, creadores: [] }; } };
const guardar = (d) => { d.actualizadoEl = new Date().toISOString(); fs.writeFileSync(DB, JSON.stringify(d, null, 2) + "\n"); };
const handle = (s) => String(s || "").trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?].*$/, "").toLowerCase();
const arg = (n, def) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : def; };
const mediana = (a) => { const s = [...a].filter((x) => Number.isFinite(x)).sort((x, y) => x - y); if (!s.length) return 0; const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (x) => `${(x * 100).toFixed(1)} %`;

// El criterio de Elvin en números. Se mira la MEDIANA de los últimos 12 posts (un viral no engaña).
export function puntuar(p) {
  const posts = (p.latestPosts || []).slice(0, 12);
  const seg = p.followersCount || 0;
  const inter = posts.map((x) => (x.likesCount || 0) + (x.commentsCount || 0));
  const er = seg ? mediana(inter) / seg : 0;                                  // engagement por post
  const reels = posts.filter((x) => x.videoViewCount);
  const alcanceReels = seg && reels.length ? mediana(reels.map((x) => x.videoViewCount)) / seg : 0; // vistas/seguidores
  const comentarios = mediana(posts.map((x) => (x.likesCount ? (x.commentsCount || 0) / x.likesCount : 0)));
  const fechas = posts.map((x) => Date.parse(x.timestamp)).filter(Boolean).sort((a, b) => b - a);
  const diasUltimo = fechas.length ? Math.round((Date.now() - fechas[0]) / 86400000) : 999;
  const postsMes = fechas.length > 1 ? Math.round(fechas.length / Math.max(1, (fechas[0] - fechas[fechas.length - 1]) / (30 * 86400000))) : 0;
  const textoPR = /puerto rico|boricua|\bpr\b|san juan|bayam[oó]n|carolina|guaynabo|caguas|ponce|mayag[üu]ez|arecibo|humacao/i;
  const esPR = posts.some((x) => /puerto rico/i.test(x.locationName || "")) || textoPR.test(p.biography || "") || posts.some((x) => textoPR.test(x.caption || ""));
  const video = posts.length ? reels.length / posts.length : 0;

  // Puntos (100): engagement 35 · alcance de reels 20 · conversación 10 · actividad 15 · tamaño 10 · PR 10
  let pts = 0;
  pts += er >= 0.06 ? 35 : er >= 0.035 ? 28 : er >= 0.02 ? 18 : er >= 0.01 ? 8 : 0;
  pts += alcanceReels >= 0.5 ? 20 : alcanceReels >= 0.25 ? 14 : alcanceReels >= 0.1 ? 7 : 0;
  pts += comentarios >= 0.06 ? 10 : comentarios >= 0.03 ? 6 : comentarios >= 0.015 ? 3 : 0;
  pts += diasUltimo <= 14 && postsMes >= 6 ? 15 : diasUltimo <= 30 && postsMes >= 3 ? 10 : diasUltimo <= 60 ? 4 : 0;
  pts += seg >= 8000 && seg <= 100000 ? 10 : seg >= 3000 ? 5 : 0;
  pts += esPR ? 10 : 0;
  const tier = pts >= 70 ? "A" : pts >= 50 ? "B" : pts >= 35 ? "C" : "descartar";
  const alertas = [];
  if (diasUltimo > 60) alertas.push(`inactivo: último post hace ${diasUltimo} días`);
  if (p.private) alertas.push("cuenta privada");
  if (!esPR) alertas.push("no se ve Puerto Rico en bio/ubicaciones");
  if (er < 0.01 && seg > 20000) alertas.push("muchos seguidores, poca interacción (¿comprados?)");
  if (video < 0.3) alertas.push("casi no publica video");
  return {
    handle: p.username, nombre: p.fullName || "", seguidores: seg, posts: p.postsCount || 0, bio: (p.biography || "").slice(0, 200),
    categoria: p.businessCategoryName || null, verificado: !!p.verified, negocio: !!p.isBusinessAccount,
    metricas: { engagementMediano: +er.toFixed(4), alcanceReels: +alcanceReels.toFixed(3), comentariosPorLike: +comentarios.toFixed(3), postsPorMes: postsMes, diasDesdeUltimoPost: diasUltimo, proporcionVideo: +video.toFixed(2), esPR },
    puntos: pts, tier, alertas,
    resumen: `${seg.toLocaleString("en-US")} seg · ER ${pct(er)} · reels ${pct(alcanceReels)} de sus seguidores · ${postsMes}/mes · último hace ${diasUltimo} d${esPR ? " · PR" : ""} → ${pts} pts, Tier ${tier}${alertas.length ? " ⚠️ " + alertas.join("; ") : ""}`,
    vetadoEl: new Date().toISOString().slice(0, 10),
  };
}

const cmd = process.argv[2];
if (cmd === "agregar") {
  const d = leer(); const por = arg("por", "elvin"), marca = arg("marca", "bori"), nota = arg("nota", "");
  const hs = process.argv.slice(3).filter((a) => !a.startsWith("--") && !["elvin", "lis", "aure", "sofi", "bori", "lu", "aib", "shadow", nota].includes(a)).map(handle).filter(Boolean);
  const nuevos = [];
  for (const h of hs) {
    if (d.creadores.some((c) => c.handle === h)) continue;
    d.creadores.push({ handle: h, url: `https://instagram.com/${h}`, estado: "por-vetar", marca, propuestoPor: por, nota, agregadoEl: new Date().toISOString().slice(0, 10), historial: [] });
    nuevos.push(h);
  }
  guardar(d); console.log(nuevos.length ? `Agregados: ${nuevos.map((h) => "@" + h).join(", ")} (por-vetar)` : "Nada nuevo (ya estaban).");
} else if (cmd === "puntuar") {
  const d = leer();
  for (const f of process.argv.slice(3)) {
    const raw = JSON.parse(fs.readFileSync(f, "utf8")); const items = Array.isArray(raw) ? raw : [raw];
    for (const p of items) {
      if (!p?.username) continue;
      const ficha = puntuar(p); const h = handle(p.username);
      let c = d.creadores.find((x) => x.handle === h);
      if (!c) { c = { handle: h, url: `https://instagram.com/${h}`, estado: "por-vetar", marca: "bori", propuestoPor: "sistema", agregadoEl: ficha.vetadoEl, historial: [] }; d.creadores.push(c); }
      Object.assign(c, ficha, { estado: ficha.tier === "descartar" ? "descartado" : "vetado" });
      c.historial.push({ fecha: ficha.vetadoEl, que: `vetado: ${ficha.puntos} pts Tier ${ficha.tier}` });
      console.log(`@${h}: ${ficha.resumen}`);
    }
  }
  guardar(d);
} else if (cmd === "lista") {
  const d = leer(); const f = process.argv[3];
  const cs = d.creadores.filter((c) => !f || c.estado === f).sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
  for (const c of cs) console.log(`${c.estado.padEnd(11)} @${c.handle.padEnd(22)} ${c.tier ? "Tier " + c.tier + " " + String(c.puntos).padStart(3) : "   —    "} ${c.seguidores ? c.seguidores.toLocaleString("en-US").padStart(8) : "".padStart(8)}  ${c.cotizacion ? "$" + c.cotizacion.precio + " · " + c.cotizacion.formato : c.nota || ""}`);
  console.log(`\n${cs.length} creadores${f ? " en " + f : ""}.`);
} else if (cmd === "estado") {
  const d = leer(); const h = handle(process.argv[3]), e = process.argv[4]; const c = d.creadores.find((x) => x.handle === h);
  if (!c) { console.error("No existe @" + h); process.exit(1); }
  c.estado = e; const nota = arg("nota", ""); c.historial.push({ fecha: new Date().toISOString().slice(0, 10), que: e + (nota ? ": " + nota : "") });
  if (e === "cotizado") c.cotizacion = { precio: +arg("precio", 0), formato: arg("formato", "3 reels"), entrega: arg("entrega", ""), recomendacion: nota };
  guardar(d); console.log(`@${h} → ${e}`);
} else if (cmd === "tabla-viernes") {
  const d = leer(); const cs = d.creadores.filter((c) => c.estado === "cotizado").sort((a, b) => (b.puntos || 0) - (a.puntos || 0)).slice(0, 3);
  if (!cs.length) { console.log("No hay cotizaciones pendientes de tu OK."); process.exit(0); }
  console.log("Cotizaciones para tu OK (marca una o más):\n");
  cs.forEach((c, i) => console.log(`${i + 1}. @${c.handle} · ${c.nombre || ""} · ${(c.seguidores || 0).toLocaleString("en-US")} seg · Tier ${c.tier}\n   ${c.cotizacion.formato} por $${c.cotizacion.precio}${c.cotizacion.entrega ? " · entrega " + c.cotizacion.entrega : ""}\n   Por qué: ${c.cotizacion.recomendacion || c.nota || "—"}\n`));
} else {
  console.log("Uso: agregar | puntuar | lista | estado | tabla-viernes (ver cabecera del archivo)");
}

// node --test test-scoring.mjs  (sin dependencias)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { calcular } = createRequire(import.meta.url)('./scoring.js');

const perfiles = [
  { n: '1 entretenedor PR', d: { seg_instagram: 350000, seg_tiktok: 750000, principal: 'tiktok', engagement_pct: 3, nicho: 'entretenimiento', ingresos: 7500, monetizacion: ['patrocinios', 'eventos'], ubicacion: 'pr', objetivo: 'delegar', disponibilidad: 12, revshare: 'si', exclusividad: 'si', credibilidad: ['tv'] }, banda: 'llamada', modelo: 'management' },
  { n: '2 médico 37.5K', d: { seg_instagram: 37500, principal: 'instagram', engagement_pct: 3, nicho: 'salud', ingresos: 1000, monetizacion: ['ninguna'], ubicacion: 'pr', objetivo: 'negocio', disponibilidad: 6, revshare: 'si', exclusividad: 'depende', credibilidad: ['profesion'] }, banda: 'revision', modelo: 'partnerships' },
  { n: '3 micro 7.5K', d: { seg_instagram: 7500, principal: 'instagram', engagement_pct: 5, nicho: 'lifestyle', ingresos: 0, monetizacion: ['ninguna'], ubicacion: 'pr', objetivo: 'crecer', disponibilidad: 12, revshare: 'si', exclusividad: 'si', credibilidad: ['ninguna'] }, banda: 'no-califica', gate: 'audiencia' },
  { n: '4 finanzas sin rev share', d: { seg_instagram: 150000, principal: 'instagram', engagement_pct: 1.5, nicho: 'finanzas', ingresos: 15000, monetizacion: ['productos', 'cursos'], ubicacion: 'pr', objetivo: 'producto', disponibilidad: 12, revshare: 'no', exclusividad: 'si', credibilidad: ['autor'] }, banda: 'no-califica', gate: 'revshare' },
  { n: '5 US eng 0.5', d: { seg_instagram: 75000, principal: 'instagram', engagement_pct: 0.5, nicho: 'belleza', ingresos: 1000, monetizacion: ['patrocinios'], ubicacion: 'us', objetivo: 'patrocinios', disponibilidad: 6, revshare: 'si', exclusividad: 'si', credibilidad: ['ninguna'] }, banda: 'no-califica', gate: 'engagement' },
  { n: '6 creador de negocios', d: { seg_instagram: 75000, seg_youtube: 17500, principal: 'instagram', engagement_pct: 1.5, nicho: 'finanzas', ingresos: 3000, monetizacion: ['afiliados', 'patrocinios'], ubicacion: 'mixta', objetivo: 'negocio', disponibilidad: 25, revshare: 'si', exclusividad: 'si', credibilidad: ['podcast'] }, banda: 'llamada', modelo: 'business-building' },
];

for (const p of perfiles) {
  test(p.n, () => {
    const r = calcular(p.d);
    assert.equal(r.banda, p.banda, `banda ${r.banda} (score ${r.score}, gates ${r.gates})`);
    if (p.modelo) assert.equal(r.modeloSugerido, p.modelo);
    if (p.gate) assert.ok(r.gates.includes(p.gate), `gates: ${r.gates}`);
    assert.ok(r.score >= 0 && r.score <= 100);
    if (r.gates.length) assert.equal(r.calificado, false);
    assert.ok(r.motivos.length > 0 && r.motivos.every((m) => typeof m === 'string' && m.length));
  });
}

test('vacío no explota', () => {
  const r = calcular({});
  assert.equal(r.banda, 'no-califica');
  assert.ok(r.gates.includes('audiencia'));
});

test('vistas sustituyen al engagement', () => {
  const r = calcular({ seg_instagram: 75000, principal: 'instagram', engagement_pct: 'nose', vistas: 6000, nicho: 'fitness', ingresos: 1000, objetivo: 'producto', disponibilidad: 12, revshare: 'si', exclusividad: 'si' });
  assert.ok(r.engagementEstimado > 0 && r.engagementEstimado < 1, String(r.engagementEstimado)); // 6000/75000*5 = 0.4 → gate engagement
  assert.ok(r.gates.includes('engagement'));
});

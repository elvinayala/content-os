// Califica y puntúa las cuentas de data/victory-core/cuentas.json con las
// reglas de config.json (ICP + pesos + umbrales). Determinístico: sin IA, sin
// red. Se puede re-correr cuando cambian pesos sin volver a scrapear.
//
// Uso: node scripts/victory-core/puntuar.mjs [--todas]
//   sin flag: solo cuentas en etapa "enriquecida" (o sin calificación)
//   --todas : recalcula todas (p. ej. tras cambiar pesos en config)
import { readFileSync, writeFileSync } from "node:fs";

const DIR = "data/victory-core";
const config = JSON.parse(readFileSync(`${DIR}/config.json`, "utf8"));
const store = JSON.parse(readFileSync(`${DIR}/cuentas.json`, "utf8"));
const todas = process.argv.includes("--todas");
const hoy = new Date().toISOString().slice(0, 10);

const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
const nivel = (valor, tabla, def) => {
  if (valor == null) return def;
  for (const [min, puntos] of tabla) if (valor >= min) return puntos;
  return Math.min(...tabla.map(([, p]) => p)) - 15;
};

export function calificar(c, cfg = config) {
  const razones = [];
  const industria = cfg.industrias.find((i) => i.id === c.industria);
  const perfil = c.perfil ?? {};
  const territorio = cfg.territorios.find((t) => t.id === c.territorio);

  // Geo: territorio activo (regla dura si el ICP lo exige)
  const geo = territorio?.activo ? 100 : 0;
  if (geo === 0) razones.push("fuera_de_territorio");

  // Exclusiones por categoría de Maps / palabras
  const texto = `${c.categoriaMaps ?? ""} ${c.nombre ?? ""}`.toLowerCase();
  const excluida =
    (cfg.excluir?.categoriasMaps ?? []).some((x) => texto.includes(x.toLowerCase())) ||
    (cfg.excluir?.palabras ?? []).some((x) => texto.includes(x.toLowerCase()));
  if (excluida) razones.push("categoria_excluida");

  // Facility / service fit: base por industria, ajustado por lo que dijo el perfil
  let facilityFit = industria?.fitFacility ?? 50;
  if (perfil.aptaParaLimpiezaRecurrente === false) { facilityFit = 20; razones.push("sin_necesidad_recurrente"); }
  if (perfil.aptaParaLimpiezaRecurrente === true) facilityFit = Math.max(facilityFit, 80);

  // Contrato estimado: solo con evidencia (empleados o sqft); si no, "desconocido"
  const t = cfg.icp.contrato;
  // En property management la nómina no dice nada del contrato: cuenta el
  // portafolio administrado (nLocations); en el resto, empleados o sqft.
  const porPortafolio = industria?.tamanoPorPortafolio ? nivel(perfil.nLocations ?? null, t.portafolio, null) : null;
  const porEmpleados = industria?.tamanoPorPortafolio ? null : nivel(perfil.empleadosEst ?? null, t.empleados, null);
  const porSqft = nivel(perfil.sqftEst ?? null, t.sqft, null);
  const candidatos = [porPortafolio, porEmpleados, porSqft].filter((v) => v != null);
  const contrato = candidatos.length ? Math.max(...candidatos) : t.desconocido;
  const conEvidenciaTamano = candidatos.length > 0;
  const rangoOportunidad = conEvidenciaTamano ? (t.rangoPorNivel[String(contrato)] ?? null) : null;
  if (!conEvidenciaTamano) razones.push("tamano_desconocido");

  // Decisor: mejor contacto por prioridad de rol + estado del email
  const prioridad = cfg.decisores.prioridad;
  const contactos = (c.contactos ?? []).slice().sort((a, b) => prioridad.indexOf(a.rol) - prioridad.indexOf(b.rol));
  const mejor = contactos[0] ?? null;
  let decisor = 0;
  if (mejor) {
    const rango = Math.max(0, prioridad.indexOf(mejor.rol));
    const baseRol = 100 - rango * 8; // facility 100 … dueño 52
    const canal = mejor.emailEstado === "verificado" ? 1 : mejor.email ? 0.75 : mejor.telefono ? 0.55 : 0.3;
    decisor = clamp(baseRol * canal);
  } else razones.push("sin_decisor");

  // Expansión: locations + matriz
  const n = perfil.nLocations ?? null;
  let expansion = n == null ? 30 : n >= 5 ? 100 : n >= 2 ? 70 : 20;
  if (["regional", "nacional", "franquicia"].includes(perfil.clasificacion)) expansion = Math.max(expansion, 75);
  if (expansion >= 70) razones.push("multi_location");

  // Calidad de cuenta: reseñas, rating, web
  let calidad = 30;
  if (c.web) calidad = 60;
  if (c.web && (c.rating ?? 0) >= 4 && (c.resenas ?? 0) >= 10) calidad = 90;
  if (perfil.activaYLegitima === false) { calidad = 10; razones.push("cuenta_dudosa"); }

  // Señales de compra
  const senales = perfil.senales ?? [];
  const senalesPts = senales.length ? clamp(20 + senales.length * 30) : 20;
  if (senales.length) razones.push(`senales:${senales.length}`);

  const comp = { facilityFit: clamp(facilityFit), contrato: clamp(contrato), decisor, expansion: clamp(expansion), calidad, geo, senales: senalesPts };
  const p = cfg.pesos;
  const total = clamp(
    (comp.facilityFit * p.facilityFit + comp.contrato * p.contrato + comp.decisor * p.decisor + comp.expansion * p.expansion +
      comp.calidad * p.calidad + comp.geo * p.geo + comp.senales * p.senales) / 100,
  );

  // Reglas duras del ICP
  let segmento = total >= cfg.umbrales.hot ? "hot" : total >= cfg.umbrales.qualified ? "qualified" : total >= cfg.umbrales.nurture ? "nurture" : "disqualified";
  if (cfg.icp.territorioObligatorio && geo === 0) segmento = "disqualified";
  if (excluida) segmento = "disqualified";
  if (cfg.icp.requiereContacto && !mejor && (segmento === "hot" || segmento === "qualified")) { segmento = "nurture"; razones.push("baja_a_nurture_sin_contacto"); }

  return { version: cfg.version, score: total, componentes: comp, segmento, razones, rangoOportunidad, contactoPrincipal: mejor?.nombre ?? null, fecha: hoy };
}

if (process.argv[1] && process.argv[1].endsWith("puntuar.mjs")) {
  let n = 0;
  const conteo = { hot: 0, qualified: 0, nurture: 0, disqualified: 0 };
  for (const c of store.cuentas) {
    if (!todas && c.calificacion && c.etapa !== "enriquecida") continue;
    // Sin perfil todavía (etapa descubierta) solo se evalúa el early-stop por
    // categoría excluida; el resto espera al enrichment para no puntuar en vacío.
    if (!c.perfil) {
      const k = calificar(c);
      if (k.razones.includes("categoria_excluida")) { c.calificacion = k; c.etapa = "descalificada"; conteo.disqualified++; n++; }
      continue;
    }
    c.calificacion = calificar(c);
    if (["exportada"].includes(c.etapa)) { /* no retrocede */ } else c.etapa = c.calificacion.segmento === "disqualified" ? "descalificada" : c.calificacion.segmento === "nurture" ? "nurture" : "calificada";
    conteo[c.calificacion.segmento]++;
    n++;
  }
  store.actualizadoEl = new Date().toISOString();
  writeFileSync(`${DIR}/cuentas.json`, JSON.stringify(store, null, 2) + "\n");
  console.log(`Calificadas ${n} cuentas:`, conteo);
}

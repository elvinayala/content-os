// Mapeo puro Monday → Pulse (sin red ni DB) para poder testearlo: tipos de columna,
// settings (etiquetas/colores), valores de celda y color de grupo.

// Hex de los 20 colores (mismos que lib/pulse/colores.ts).
export const HEX_COLOR = {
  green: "#00c875", bright_green: "#9cd326", yellow: "#ffcb00", orange: "#fdab3d", dark_orange: "#ff642e",
  red: "#e2445c", dark_red: "#bb3354", pink: "#ff158a", purple: "#a25ddc", dark_purple: "#784bd1",
  indigo: "#5559df", blue: "#0086c0", bright_blue: "#579bfc", dark_blue: "#225091", aqua: "#4eccc6",
  teal: "#175a63", river: "#68a1bd", brown: "#7f5347", grey: "#c4c4c4", dark_grey: "#808080",
};
// Nombres de color que Monday usa en labels_colors.var_name / groups.color y que no están
// en nuestra paleta: se aproximan.
const ALIAS_COLOR = {
  "grass_green": "green", "done-green": "green", "working_orange": "orange", "stuck-red": "red",
  "dark-orange": "dark_orange", "bright-green": "bright_green", "bright-blue": "bright_blue",
  "dark-blue": "dark_blue", "dark-purple": "dark_purple", "dark-red": "dark_red", "dark-grey": "dark_grey",
  "explosive": "yellow", "lipstick": "pink", "sofia_pink": "pink", "berry": "dark_purple", "peach": "orange",
  "sunset": "dark_orange", "bubble": "pink", "lavender": "purple", "tan": "brown", "sky": "aqua",
  "coffee": "brown", "royal": "blue", "chili-blue": "bright_blue", "navy": "dark_blue", "winter": "river",
  "american_gray": "grey", "blackish": "dark_grey", "egg_yolk": "yellow", "saladish": "bright_green",
  "aquamarine": "aqua", "steel_blue": "river", "pecan": "brown", "wine": "dark_red", "mustered": "yellow",
  "purple": "purple", "orchid": "purple", "lilac": "purple", "grey": "grey", "dark_indigo": "indigo",
};

export function nombreAColor(nombre) {
  if (!nombre) return null;
  const n = String(nombre).toLowerCase().trim();
  if (n in HEX_COLOR) return n;
  if (n in ALIAS_COLOR) return ALIAS_COLOR[n];
  const guion = n.replace(/-/g, "_");
  if (guion in HEX_COLOR) return guion;
  return null;
}

export function hexAColor(hex) {
  if (!hex) return "grey";
  const h = String(hex).replace("#", "");
  if (h.length !== 6) return "grey";
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  let mejor = "grey";
  let dist = Infinity;
  for (const [c, t] of Object.entries(HEX_COLOR)) {
    const tt = t.replace("#", "");
    const trgb = [0, 2, 4].map((i) => parseInt(tt.slice(i, i + 2), 16));
    const d = rgb.reduce((s, v, i) => s + (v - trgb[i]) ** 2, 0);
    if (d < dist) {
      dist = d;
      mejor = c;
    }
  }
  return mejor;
}

// Monday: groups[].color viene como "#579bfc" o como nombre ("bright-blue").
export function colorDeGrupo(color) {
  return nombreAColor(color) ?? hexAColor(color);
}

export const MAPA_TIPOS = {
  text: "text",
  long_text: "long_text",
  numbers: "number",
  status: "status",
  color: "status", // nombre viejo del tipo status
  dropdown: "dropdown",
  tags: "dropdown",
  date: "date",
  people: "people",
  multiple_person: "people",
  checkbox: "checkbox",
  boolean: "checkbox",
  link: "link",
  email: "email",
  phone: "phone",
  file: "file",
  board_relation: "relation",
};

// Tipos de Monday que no se migran (se reportan).
export const TIPOS_SALTADOS = new Set([
  "mirror", "lookup", "formula", "subtasks", "subitems", "creation_log", "last_updated", "auto_number",
  "button", "timeline", "world_clock", "item_id", "doc", "dependency", "progress", "time_tracking",
  "vote", "week", "country", "location", "rating", "hour", "integration", "name",
]);

function parseSettings(settings_str) {
  try {
    return settings_str ? JSON.parse(settings_str) : {};
  } catch {
    return {};
  }
}

// Columna de Monday → { type, settings } de Pulse, o { saltada: true, motivo }.
export function mapearColumna(col) {
  if (col.archived) return { saltada: true, motivo: "archivada" };
  if (TIPOS_SALTADOS.has(col.type)) return { saltada: true, motivo: `tipo ${col.type}` };
  const st = parseSettings(col.settings_str);
  const type = MAPA_TIPOS[col.type] ?? "text";
  const settings = {};
  if (type === "status") {
    const labels = st.labels ?? {};
    const colores = st.labels_colors ?? {};
    const done = new Set((st.done_colors ?? []).map(String));
    const orden = st.labels_positions_v2 ?? null;
    let indices = Object.keys(labels);
    if (orden) indices.sort((a, b) => (orden[a] ?? 999) - (orden[b] ?? 999));
    else indices.sort((a, b) => Number(a) - Number(b));
    settings.labels = indices
      .filter((i) => labels[i] !== undefined && labels[i] !== "")
      .map((i) => ({
        id: `m${i}`,
        label: String(labels[i]),
        color: nombreAColor(colores[i]?.var_name) ?? hexAColor(colores[i]?.color) ?? "grey",
        ...(done.has(String(i)) ? { esDone: true } : {}),
      }));
  } else if (type === "dropdown") {
    settings.labels = (st.labels ?? []).map((l) => ({ id: `m${l.id}`, label: String(l.name), color: "blue" }));
    settings.multiple = true;
  } else if (type === "number") {
    if (st.unit?.symbol === "$" || /\$/.test(String(st.unit?.custom_unit ?? ""))) settings.formato = "moneda";
  } else if (type === "people") {
    settings.multiple = true;
  } else if (type === "relation") {
    settings.mondayBoardIds = (st.boardIds ?? []).map(String);
    settings.multiple = true;
  }
  return { type, settings, tipoMonday: col.type };
}

function parseValue(cv) {
  try {
    return cv.value ? JSON.parse(cv.value) : null;
  } catch {
    return null;
  }
}

// Valor de celda de Monday → ValorCelda de Pulse. ctx: { usuarios: Map(mondayUserId → pulseId),
// pendientesRelacion(itemMondayIds) para resolver después, archivos(assets) → ids }.
// Devuelve { value, descartado? }.
export function mapearValor(colPulse, cv, ctx = {}) {
  const v = parseValue(cv);
  const text = (cv.text ?? "").trim();
  switch (colPulse.type) {
    case "text":
    case "long_text":
    case "email":
    case "phone": {
      let t = text;
      if (colPulse.type === "email" && v?.email) t = String(v.email).trim();
      if (colPulse.type === "phone" && v?.phone) t = String(v.phone).trim();
      if (colPulse.type === "long_text" && v?.text) t = String(v.text).trim();
      if (colPulse.type === "email" && t && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return { value: null, descartado: t };
      return { value: t || null };
    }
    case "number": {
      const n = Number(String(text).replace(/[$,\s]/g, ""));
      return Number.isFinite(n) && text !== "" ? { value: n } : { value: null, descartado: text || undefined };
    }
    case "date": {
      const d = cv.date ?? v?.date ?? null;
      return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? { value: d } : { value: null, descartado: text || undefined };
    }
    case "checkbox":
      return { value: v?.checked === "true" || v?.checked === true };
    case "status": {
      const idx = cv.index ?? v?.index;
      if (idx === undefined || idx === null) return { value: null };
      const id = `m${idx}`;
      return (colPulse.settings.labels ?? []).some((l) => l.id === id) ? { value: id } : { value: null, descartado: text || String(idx) };
    }
    case "dropdown": {
      const ids = (v?.ids ?? []).map((id) => `m${id}`);
      const validos = new Set((colPulse.settings.labels ?? []).map((l) => l.id));
      const ok = ids.filter((id) => validos.has(id));
      return ok.length ? { value: ok } : { value: null, descartado: ids.length ? text : undefined };
    }
    case "people": {
      const personas = (cv.persons_and_teams ?? v?.personsAndTeams ?? []).filter((p) => p.kind === "person");
      const ids = personas.map((p) => ctx.usuarios?.get(String(p.id))).filter(Boolean);
      const faltan = personas.filter((p) => !ctx.usuarios?.get(String(p.id))).map((p) => String(p.id));
      return { value: ids.length ? ids : null, descartado: faltan.length ? faltan.join(",") : undefined };
    }
    case "link": {
      const url = v?.url ? String(v.url).trim() : "";
      if (!url) return { value: null };
      const conProtocolo = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      const t = v?.text ? String(v.text).trim() : "";
      return { value: t && t !== url ? { url: conProtocolo, text: t } : { url: conProtocolo } };
    }
    case "relation": {
      const ids = (cv.linked_item_ids ?? v?.linkedPulseIds?.map((x) => x.linkedPulseId) ?? []).map(String);
      return { value: null, relacionPendiente: ids.length ? ids : undefined };
    }
    case "file": {
      const assets = (cv.files ?? []).map((f) => f.asset).filter(Boolean);
      return { value: null, archivosPendientes: assets.length ? assets : undefined };
    }
    default:
      return { value: text || null };
  }
}

export function slugDeBoard(nombre, mondayId) {
  const fijos = { "7784685790": "level-up-media", "18399101258": "ai-borinquen", "9506323087": "asignacion-estrategas" };
  if (fijos[String(mondayId)]) return fijos[String(mondayId)];
  return (
    String(nombre)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `monday-${mondayId}`
  );
}

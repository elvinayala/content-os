import "server-only";

import path from "path";

import { leerNota, leerTodas, type NotaVault } from "@/lib/vault";

// Memoria compuesta del Content OS. Sobre el vault (reuniones/slack/entidades/…)
// construye: (1) el GRAFO de entidades por [[wikilinks]], (2) la vista de una
// ENTIDAD con todo lo que la menciona (backlinks), y (3) la lectura de la SÍNTESIS
// destilada (ángulos ganadores, objeciones reales, ideas de data, decisiones).
// La síntesis la escribe /destilar-memoria; acá solo se lee (server-only).

// ---- Síntesis destilada (documentos vivos que el equipo produce con DATA) ----
export type TipoSintesis =
  | "angulos-ganadores"
  | "objeciones-reales"
  | "ideas-de-data"
  | "decisiones-negocio";

export const SINTESIS: { tipo: TipoSintesis; slug: string; titulo: string; que: string }[] = [
  {
    tipo: "angulos-ganadores",
    slug: "estilo/angulos-ganadores",
    titulo: "Ángulos ganadores",
    que: "Ángulos que están funcionando de verdad (de cierres, bombazos, llamadas y objeciones reales).",
  },
  {
    tipo: "objeciones-reales",
    slug: "estilo/objeciones-reales",
    titulo: "Objeciones reales",
    que: "Las objeciones que salen en las llamadas de venta — material directo para contenido y para el equipo.",
  },
  {
    tipo: "ideas-de-data",
    slug: "estilo/ideas-de-data",
    titulo: "Ideas de contenido (de data)",
    que: "Ideas destiladas de temas recurrentes en reuniones, chats y llamadas.",
  },
  {
    tipo: "decisiones-negocio",
    slug: "estilo/decisiones-negocio",
    titulo: "Decisiones de negocio",
    que: "Decisiones y patrones que el CEO tomó, extraídos del histórico.",
  },
];

export interface DocSintesis {
  tipo: TipoSintesis;
  titulo: string;
  que: string;
  cuerpo: string | null; // null = todavía no destilado
  fecha?: string;
}

export async function leerSintesis(): Promise<DocSintesis[]> {
  return Promise.all(
    SINTESIS.map(async (s) => {
      const nota = await leerNota(s.slug);
      return {
        tipo: s.tipo,
        titulo: s.titulo,
        que: s.que,
        cuerpo: nota?.cuerpo ?? null,
        fecha: nota?.fecha,
      };
    }),
  );
}

export async function leerSintesisDoc(tipo: string): Promise<string | null> {
  const def = SINTESIS.find((s) => s.tipo === tipo);
  if (!def) return null;
  const nota = await leerNota(def.slug);
  return nota?.cuerpo ?? null;
}

// ---- Grafo de entidades por [[wikilinks]] ----
const RE_LINK = /\[\[([^\]]+)\]\]/g;

function normalizar(target: string): string {
  // "carpeta/nota" → "nota"; baja a minúsculas; sin sufijo .md
  const base = target.includes("/") ? target.split("/").pop()! : target;
  return base.trim();
}

export interface NodoEntidad {
  nombre: string; // como aparece en el [[link]] (normalizado)
  menciones: number; // cuántas notas la mencionan
  slugEntidad: string | null; // vault/entidades/<slug> si existe la nota propia
  ultimaFecha?: string;
}

export interface Grafo {
  entidades: NodoEntidad[]; // ordenadas por menciones desc
  totalNotas: number;
  totalEnlaces: number;
}

function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function construirGrafo(): Promise<Grafo> {
  const notas = await leerTodas();
  const slugsEntidad = new Set(
    notas.filter((n) => n.carpeta === "entidades").map((n) => path.basename(n.slug)),
  );
  const conteo = new Map<string, NodoEntidad>();
  let totalEnlaces = 0;

  for (const n of notas) {
    const vistos = new Set<string>(); // una entidad cuenta 1 vez por nota
    let m: RegExpExecArray | null;
    RE_LINK.lastIndex = 0;
    while ((m = RE_LINK.exec(n.cuerpo)) !== null) {
      const nombre = normalizar(m[1]);
      if (!nombre || vistos.has(nombre.toLowerCase())) continue;
      vistos.add(nombre.toLowerCase());
      totalEnlaces++;
      const clave = nombre.toLowerCase();
      const prev = conteo.get(clave);
      const sl = slugify(nombre);
      const slugEntidad = slugsEntidad.has(sl) ? `entidades/${sl}` : null;
      if (prev) {
        prev.menciones++;
        if ((n.fecha ?? "") > (prev.ultimaFecha ?? "")) prev.ultimaFecha = n.fecha;
      } else {
        conteo.set(clave, {
          nombre,
          menciones: 1,
          slugEntidad,
          ultimaFecha: n.fecha,
        });
      }
    }
  }

  return {
    entidades: [...conteo.values()].sort((a, b) => b.menciones - a.menciones),
    totalNotas: notas.length,
    totalEnlaces,
  };
}

export async function entidadesMasConectadas(limite = 12): Promise<NodoEntidad[]> {
  const g = await construirGrafo();
  return g.entidades.slice(0, limite);
}

// ---- Vista de una entidad: su nota propia (si existe) + todo lo que la menciona ----
export interface MencionEntidad {
  slug: string;
  titulo: string;
  fecha?: string;
  fuente?: string;
  snippet: string;
}

export interface VistaEntidad {
  nombre: string;
  notaPropia: NotaVault | null; // vault/entidades/<slug> con el resumen acumulado
  menciones: MencionEntidad[]; // notas que la mencionan por [[nombre]] o texto
}

export async function leerEntidad(nombre: string): Promise<VistaEntidad> {
  const notas = await leerTodas();
  const sl = slugify(nombre);
  const nombreBajo = nombre.toLowerCase();

  const notaPropia =
    notas.find((n) => n.carpeta === "entidades" && path.basename(n.slug) === sl) ?? null;

  const menciones: MencionEntidad[] = [];
  for (const n of notas) {
    if (notaPropia && n.slug === notaPropia.slug) continue;
    const texto = `${n.titulo}\n${n.cuerpo}`;
    const bajo = texto.toLowerCase();
    // menciona por [[nombre]] o por el nombre en texto
    const idx = bajo.indexOf(nombreBajo);
    if (idx < 0) continue;
    menciones.push({
      slug: n.slug,
      titulo: n.titulo,
      fecha: n.fecha,
      fuente: n.fuente,
      snippet: texto
        .slice(Math.max(0, idx - 60), idx + 180)
        .replace(/\n+/g, " ")
        .trim(),
    });
  }
  menciones.sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));

  return { nombre, notaPropia, menciones };
}

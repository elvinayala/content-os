import "server-only";

import { promises as fs } from "fs";
import path from "path";

// Lector del vault (vault/**/*.md): la memoria del Content OS.
// Las notas las escriben /sync-vault y /worker-encargos (y Elvin a mano u
// Obsidian). Frontmatter con regex, mismo criterio que lib/jarvis/skills.ts.

export interface NotaVault {
  slug: string; // "reuniones/2026-07-04-llamada-x" (ruta sin .md)
  titulo: string; // primer H1 o el nombre del archivo
  carpeta: string; // "reuniones" | "slack" | "ideas" | "estilo" | "decisiones" | ""
  fecha?: string;
  fuente?: string;
  unidad?: string;
  tags: string[];
  cuerpo: string; // markdown sin frontmatter
}

const VAULT_DIR = path.join(process.cwd(), "vault");

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  cuerpo: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, cuerpo: raw };
  const meta: Record<string, string> = {};
  for (const linea of match[1].split("\n")) {
    const idx = linea.indexOf(":");
    if (idx > 0) meta[linea.slice(0, idx).trim()] = linea.slice(idx + 1).trim();
  }
  return { meta, cuerpo: raw.slice(match[0].length) };
}

function tituloDe(cuerpo: string, slug: string): string {
  const h1 = cuerpo.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].replace(/\[\[|\]\]/g, "") : path.basename(slug);
}

async function listarArchivos(dir: string, base = ""): Promise<string[]> {
  const out: string[] = [];
  const entradas = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entradas) {
    if (e.name.startsWith(".")) continue;
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push(...(await listarArchivos(path.join(dir, e.name), rel)));
    } else if (e.name.endsWith(".md")) {
      out.push(rel);
    }
  }
  return out;
}

async function leerArchivo(rel: string): Promise<NotaVault | null> {
  try {
    const raw = await fs.readFile(path.join(VAULT_DIR, rel), "utf-8");
    const { meta, cuerpo } = parseFrontmatter(raw);
    const slug = rel.replace(/\.md$/, "");
    return {
      slug,
      titulo: tituloDe(cuerpo, slug),
      carpeta: slug.includes("/") ? slug.split("/")[0] : "",
      fecha: meta.fecha,
      fuente: meta.fuente,
      unidad: meta.unidad,
      tags: meta.tags
        ? meta.tags
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      cuerpo,
    };
  } catch {
    return null;
  }
}

export async function listarNotas(
  carpeta?: string,
): Promise<Omit<NotaVault, "cuerpo">[]> {
  try {
    const archivos = await listarArchivos(VAULT_DIR);
    const notas = await Promise.all(archivos.map((a) => leerArchivo(a)));
    return notas
      .filter((n): n is NotaVault => n !== null)
      .filter((n) => !carpeta || n.carpeta === carpeta)
      .map(({ cuerpo: _cuerpo, ...resto }) => resto)
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
  } catch {
    return [];
  }
}

export async function leerNota(slug: string): Promise<NotaVault | null> {
  // sanitizar: sin "..", solo rutas relativas simples
  if (slug.includes("..") || path.isAbsolute(slug)) return null;
  return leerArchivo(`${slug}.md`);
}

// Todas las notas CON cuerpo (para construir el grafo / backlinks de la memoria).
export async function leerTodas(): Promise<NotaVault[]> {
  try {
    const archivos = await listarArchivos(VAULT_DIR);
    const notas = await Promise.all(archivos.map((a) => leerArchivo(a)));
    return notas.filter((n): n is NotaVault => n !== null);
  } catch {
    return [];
  }
}

// Búsqueda de texto en TODO el vault (la memoria histórica: slack/ día a día,
// reuniones/ de Granola, ideas/, decisiones/). Devuelve snippets con contexto.
export interface ResultadoBusqueda {
  slug: string;
  titulo: string;
  fecha?: string;
  snippet: string; // ±160 chars alrededor del match
}

export async function buscarNotas(
  consulta: string,
  limite = 12,
): Promise<ResultadoBusqueda[]> {
  const terminos = consulta
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2);
  if (terminos.length === 0) return [];
  try {
    const archivos = await listarArchivos(VAULT_DIR);
    const notas = await Promise.all(archivos.map((a) => leerArchivo(a)));
    const resultados: ResultadoBusqueda[] = [];
    for (const n of notas) {
      if (!n) continue;
      const texto = `${n.titulo}\n${n.cuerpo}`;
      const bajo = texto.toLowerCase();
      const idx = terminos
        .map((t) => bajo.indexOf(t))
        .filter((i) => i >= 0)
        .sort((a, b) => a - b)[0];
      if (idx === undefined) continue;
      resultados.push({
        slug: n.slug,
        titulo: n.titulo,
        fecha: n.fecha,
        snippet: texto
          .slice(Math.max(0, idx - 60), idx + 160)
          .replace(/\n+/g, " ")
          .trim(),
      });
    }
    return resultados
      .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""))
      .slice(0, limite);
  } catch {
    return [];
  }
}

// [[Nota]] o [[carpeta/nota]] → link a la vista del vault. Si el target no
// matchea un slug conocido se linkea igual (el vault crece hacia esos huecos).
export function resolverWikilinks(
  md: string,
  slugsConocidos: string[],
): string {
  return md.replace(/\[\[([^\]]+)\]\]/g, (_m, target: string) => {
    const limpio = target.trim();
    const slug =
      slugsConocidos.find(
        (s) =>
          s === limpio ||
          s.endsWith(`/${limpio}`) ||
          path.basename(s).toLowerCase() === limpio.toLowerCase(),
      ) ?? limpio;
    return `[${limpio}](/ceo/vault/${slug})`;
  });
}

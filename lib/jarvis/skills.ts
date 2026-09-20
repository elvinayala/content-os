import "server-only";

import { promises as fs } from "fs";
import path from "path";

// Puente entre las skills del repo (.claude/skills/*/SKILL.md) y Jarvis-live:
// los mismos archivos son skills nativas de Claude Code Y fragmentos de system
// prompt del portal. Frontmatter parseado con regex (sin deps).

export interface SkillJarvis {
  nombre: string; // "guionar-reel"
  descripcion: string;
  ejecucion: "live" | "worker";
  marcas: string[];
  cuerpo: string; // markdown sin frontmatter
}

const SKILLS_DIR = path.join(process.cwd(), ".claude", "skills");

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  cuerpo: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, cuerpo: raw };
  const meta: Record<string, string> = {};
  for (const linea of match[1].split("\n")) {
    const idx = linea.indexOf(":");
    if (idx > 0) {
      meta[linea.slice(0, idx).trim()] = linea.slice(idx + 1).trim();
    }
  }
  return { meta, cuerpo: raw.slice(match[0].length) };
}

function parseMarcas(valor: string | undefined): string[] {
  if (!valor) return [];
  return valor
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

async function leerSkillArchivo(nombre: string): Promise<SkillJarvis | null> {
  try {
    const raw = await fs.readFile(
      path.join(SKILLS_DIR, nombre, "SKILL.md"),
      "utf-8",
    );
    const { meta, cuerpo } = parseFrontmatter(raw);
    return {
      nombre: meta.name ?? nombre,
      descripcion: meta.description ?? "",
      ejecucion: meta.ejecucion === "worker" ? "worker" : "live",
      marcas: parseMarcas(meta.marcas),
      cuerpo,
    };
  } catch {
    return null;
  }
}

export async function listarSkills(): Promise<Omit<SkillJarvis, "cuerpo">[]> {
  try {
    const dirs = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
    const skills = await Promise.all(
      dirs
        .filter((d) => d.isDirectory())
        .map((d) => leerSkillArchivo(d.name)),
    );
    return skills
      .filter((s): s is SkillJarvis => s !== null)
      .map(({ cuerpo: _cuerpo, ...resto }) => resto);
  } catch {
    return [];
  }
}

export async function leerSkill(nombre: string): Promise<SkillJarvis | null> {
  // sanitizar: solo nombres tipo slug (viene de una tool del modelo)
  if (!/^[a-z0-9-]+$/.test(nombre)) return null;
  return leerSkillArchivo(nombre);
}

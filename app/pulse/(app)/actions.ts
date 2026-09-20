"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { requiereUsuario } from "@/lib/pulse/auth";
import { crearBoard, listarBoards } from "@/lib/pulse/repo";
import type { ColorPulse } from "@/lib/pulse/types";
import { slugify } from "@/lib/pulse/valores";

export async function crearBoardAction(formData: FormData) {
  await requiereUsuario();
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;
  const color = String(formData.get("color") ?? "bright_blue") as ColorPulse;
  const existentes = new Set((await listarBoards()).map((b) => b.slug));
  let slug = slugify(nombre);
  let n = 2;
  while (existentes.has(slug)) slug = `${slugify(nombre)}-${n++}`;
  const b = await crearBoard({ nombre, slug, color });
  refresh();
  redirect(`/pulse/${b.slug}`);
}

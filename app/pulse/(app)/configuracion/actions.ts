"use server";

import { refresh } from "next/cache";

import { requiereAdmin } from "@/lib/pulse/auth";
import { hashPassword } from "@/lib/pulse/password";
import { actualizarUsuario, buscarUsuarioPorEmail, crearUsuario } from "@/lib/pulse/repo";
import type { ColorPulse } from "@/lib/pulse/types";

type R = { ok: true } | { ok: false; error: string };

export async function crearUsuarioAction(formData: FormData): Promise<R> {
  try {
    await requiereAdmin();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const nombre = String(formData.get("nombre") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const rol = formData.get("rol") === "admin" ? "admin" : "miembro";
    const color = String(formData.get("color") ?? "blue") as ColorPulse;
    if (!email || !nombre) return { ok: false, error: "Faltan nombre o e-mail" };
    if (password.length < 6) return { ok: false, error: "La clave debe tener al menos 6 caracteres" };
    if (await buscarUsuarioPorEmail(email)) return { ok: false, error: "Ya existe un usuario con ese e-mail" };
    await crearUsuario({ email, nombre, rol, passwordHash: hashPassword(password), color });
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function actualizarUsuarioAction(p: { id: string; nombre?: string; rol?: "admin" | "miembro"; activo?: boolean; password?: string; color?: ColorPulse }): Promise<R> {
  try {
    const admin = await requiereAdmin();
    if (p.id === admin.id && (p.activo === false || p.rol === "miembro")) return { ok: false, error: "No podés quitarte a vos mismo el acceso de admin" };
    const patch: Parameters<typeof actualizarUsuario>[1] = {};
    if (p.nombre !== undefined) patch.nombre = p.nombre.trim().slice(0, 100) || undefined;
    if (p.rol !== undefined) patch.rol = p.rol;
    if (p.activo !== undefined) patch.activo = p.activo;
    if (p.color !== undefined) patch.color = p.color;
    if (p.password !== undefined) {
      if (p.password.length < 6) return { ok: false, error: "La clave debe tener al menos 6 caracteres" };
      patch.passwordHash = hashPassword(p.password);
      patch.activo = patch.activo ?? true;
    }
    await actualizarUsuario(p.id, patch);
    refresh();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

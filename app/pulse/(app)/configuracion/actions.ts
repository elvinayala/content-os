"use server";

import { refresh } from "next/cache";

import { requiereGestor } from "@/lib/pulse/auth";
import { hashPassword } from "@/lib/pulse/password";
import { actualizarUsuario, buscarUsuarioPorEmail, crearUsuario, leerUsuario } from "@/lib/pulse/repo";
import type { ColorPulse, RolUsuario } from "@/lib/pulse/types";

type R = { ok: true } | { ok: false; error: string };

export async function crearUsuarioAction(formData: FormData): Promise<R> {
  try {
    const gestor = await requiereGestor();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const nombre = String(formData.get("nombre") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const pedido = String(formData.get("rol") ?? "miembro");
    const rol: RolUsuario = pedido === "admin" ? "admin" : pedido === "editor" ? "editor" : "miembro";
    if (rol === "admin" && gestor.rol !== "admin") return { ok: false, error: "Solo un admin puede crear admins" };
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

export async function actualizarUsuarioAction(p: { id: string; nombre?: string; rol?: RolUsuario; activo?: boolean; password?: string; color?: ColorPulse }): Promise<R> {
  try {
    const gestor = await requiereGestor();
    if (p.id === gestor.id && (p.activo === false || (p.rol && p.rol !== gestor.rol))) return { ok: false, error: "No podés cambiarte el rol ni desactivarte a vos mismo" };
    const objetivo = await leerUsuario(p.id);
    if (!objetivo) return { ok: false, error: "El usuario no existe" };
    // Un editor no toca admins ni crea admins.
    if (gestor.rol !== "admin" && (objetivo.rol === "admin" || p.rol === "admin")) return { ok: false, error: "Solo un admin puede modificar admins" };
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

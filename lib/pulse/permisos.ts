import type { RolUsuario } from "./types";

// Matriz de poderes de Pulse. El admin (Elvin) siempre puede más que cualquiera; el editor
// (Carilin) administra el equipo y los datos del día a día, pero NO saca información fuera
// de Pulse ni toca la estructura mayor. Puro y testeado (tests/pulse-permisos.test.mjs).

export const TOPE_BORRADO_NO_ADMIN = 50; // items por operación

export interface Poderes {
  agregarUsuarios: boolean; // dar de alta gente y ponerle clave
  rolesQuePuedeAsignar: RolUsuario[];
  editarDatos: boolean; // celdas, items, columnas, grupos
  eliminarTablero: boolean;
  topeBorradoItems: number | null; // null = sin tope
  exportarDatos: boolean; // sacar la base fuera de Pulse (CSV, respaldo, API de n8n)
  verRegistroSeguridad: boolean;
  administrarAccesoTableros: boolean; // marcar un tablero como privado y elegir quién entra
}

export function poderes(rol: RolUsuario): Poderes {
  if (rol === "admin") {
    return {
      agregarUsuarios: true,
      rolesQuePuedeAsignar: ["admin", "editor", "miembro"],
      editarDatos: true,
      eliminarTablero: true,
      topeBorradoItems: null,
      exportarDatos: true,
      verRegistroSeguridad: true,
      administrarAccesoTableros: true,
    };
  }
  if (rol === "editor") {
    return {
      agregarUsuarios: true,
      rolesQuePuedeAsignar: ["miembro"], // un editor no crea editores ni admins
      editarDatos: true,
      eliminarTablero: false,
      topeBorradoItems: TOPE_BORRADO_NO_ADMIN,
      exportarDatos: false,
      verRegistroSeguridad: false,
      administrarAccesoTableros: false,
    };
  }
  return {
    agregarUsuarios: false,
    rolesQuePuedeAsignar: [],
    editarDatos: true,
    eliminarTablero: false,
    topeBorradoItems: TOPE_BORRADO_NO_ADMIN,
    exportarDatos: false,
    verRegistroSeguridad: false,
    administrarAccesoTableros: false,
  };
}

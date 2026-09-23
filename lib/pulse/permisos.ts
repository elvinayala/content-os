import type { RolUsuario } from "./types";

// Matriz de poderes de Pulse. El admin (Elvin) siempre puede más que cualquiera. Las
// editoras (Carilin y Aure, por igual) tienen acceso total al día a día y administran al
// equipo, pero NO sacan información de Pulse ni borran datos en masa. Puro y testeado
// (tests/pulse-permisos.test.mjs); el servidor aplica exactamente esto.

export const TOPE_BORRADO_NO_ADMIN = 20; // items por operación

export interface Poderes {
  agregarUsuarios: boolean; // dar de alta gente y ponerle clave
  rolesQuePuedeAsignar: RolUsuario[];
  editarDatos: boolean; // celdas, items, columnas nuevas, grupos, etiquetas nuevas
  eliminarColumnas: boolean; // borra ese dato en TODOS los items → borrado en masa
  quitarEtiquetasEnUso: boolean; // deja huérfanas las filas que la tenían → borrado en masa
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
      eliminarColumnas: true,
      quitarEtiquetasEnUso: true,
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
      rolesQuePuedeAsignar: ["miembro"], // no crean editores ni admins: nadie se sube de rango
      editarDatos: true,
      eliminarColumnas: false,
      quitarEtiquetasEnUso: false,
      eliminarTablero: false,
      topeBorradoItems: TOPE_BORRADO_NO_ADMIN,
      exportarDatos: false,
      verRegistroSeguridad: true,
      administrarAccesoTableros: false,
    };
  }
  return {
    agregarUsuarios: false,
    rolesQuePuedeAsignar: [],
    editarDatos: true,
    eliminarColumnas: false,
    quitarEtiquetasEnUso: false,
    eliminarTablero: false,
    topeBorradoItems: TOPE_BORRADO_NO_ADMIN,
    exportarDatos: false,
    verRegistroSeguridad: false,
    administrarAccesoTableros: false,
  };
}

// Etiquetas (status/dropdown) que un cambio de settings quitaría y que hoy usa algún item.
export function etiquetasQuitadasEnUso(antes: { id: string }[] | undefined, despues: { id: string }[] | undefined, enUso: Set<string>): string[] {
  const quedan = new Set((despues ?? []).map((l) => l.id));
  return (antes ?? []).map((l) => l.id).filter((id) => !quedan.has(id) && enUso.has(id));
}

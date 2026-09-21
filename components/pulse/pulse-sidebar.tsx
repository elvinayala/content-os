"use client";

import { Activity, ArrowLeft, LayoutGrid, Lock, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutPulseAction } from "@/app/pulse/login/actions";
import { UserAvatar } from "@/components/pulse/user-avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cssColor } from "@/lib/pulse/colores";
import { NOMBRE_APP, NOMBRE_ROL, puedeGestionarUsuarios, SUBTITULO_APP, type UsuarioPulse } from "@/lib/pulse/types";
import type { BoardResumen } from "@/lib/pulse/repo";

export function PulseSidebar({
  boards,
  usuario,
}: {
  boards: Pick<BoardResumen, "id" | "slug" | "nombre" | "color" | "items" | "privado">[];
  usuario: UsuarioPulse;
}) {
  const pathname = usePathname();
  return (
    // className="pulse": el Sheet mobile portalea a <body> y sale del scope del tema
    <Sidebar collapsible="icon" className="pulse">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="logo-pulse flex size-9 shrink-0 items-center justify-center rounded-xl text-white">
            <Activity className="size-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">{NOMBRE_APP}</span>
            <span className="text-xs text-muted-foreground">{SUBTITULO_APP}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/pulse"} tooltip="Tableros">
                <Link href="/pulse">
                  <LayoutGrid />
                  <span>Tableros</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Mis tableros</SidebarGroupLabel>
          <SidebarMenu>
            {boards.map((b) => {
              const href = `/pulse/${b.slug}`;
              return (
                <SidebarMenuItem key={b.id}>
                  <SidebarMenuButton asChild isActive={pathname === href || pathname.startsWith(href + "/")} tooltip={b.nombre}>
                    <Link href={href}>
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: cssColor(b.color), boxShadow: `0 0 0 3px color-mix(in srgb, ${cssColor(b.color)} 22%, transparent)` }} />
                      <span className="truncate">{b.nombre}</span>
                      {b.privado ? <Lock className="size-3 shrink-0 text-muted-foreground" /> : null}
                      <span className="ml-auto text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">{b.items}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {puedeGestionarUsuarios(usuario.rol) ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith("/pulse/configuracion")} tooltip="Configuración">
                <Link href="/pulse/configuracion">
                  <Settings />
                  <span>Usuarios y configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          {usuario.rol === "admin" ? (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Command Center">
                <Link href="/ceo">
                  <ArrowLeft />
                  <span>Command Center</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <UserAvatar nombre={usuario.nombre} color={usuario.color} />
              <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">{usuario.nombre}</span>
                <span className="truncate text-xs text-muted-foreground">{NOMBRE_ROL[usuario.rol]}</span>
              </div>
              <form action={logoutPulseAction} className="ml-auto group-data-[collapsible=icon]:hidden">
                <button type="submit" title="Salir" className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

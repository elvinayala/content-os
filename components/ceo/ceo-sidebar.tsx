"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Hexagon } from "lucide-react";

import { agentesEjecutivos, ceoNavItems } from "@/lib/ceo";
import type { EstadoAgente } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const DOT_VAR: Record<EstadoAgente, string> = {
  working: "--status-working",
  waiting: "--status-waiting",
  idle: "--status-idle",
};

export function CeoSidebar({
  estados,
}: {
  estados?: Record<string, EstadoAgente>;
}) {
  const pathname = usePathname();

  return (
    // className="ceo": el Sheet mobile portalea a <body> y sale del scope del tema
    <Sidebar collapsible="icon" className="ceo">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <Avatar className="size-9 rounded-lg ring-2 ring-primary/50">
            <AvatarFallback className="rounded-lg bg-primary/15 text-primary">
              <Hexagon className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">CEO Command Center</span>
            <span className="label-mono text-muted-foreground">
              Agentic growth operations
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {ceoNavItems.map((item) => {
              const activo =
                item.href === "/ceo"
                  ? pathname === "/ceo"
                  : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={activo}
                    tooltip={item.titulo}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="label-mono">Agents</SidebarGroupLabel>
          <SidebarMenu>
            {agentesEjecutivos.map((agente) => (
              <SidebarMenuItem key={agente.id}>
                <SidebarMenuButton
                  asChild
                  tooltip={agente.nombre}
                  className="h-auto py-1.5"
                >
                  <Link href="/ceo/agents">
                    <agente.icon />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-xs font-medium">
                        {agente.nombre}
                      </span>
                      <span className="label-mono truncate text-muted-foreground">
                        {agente.subtitulo}
                      </span>
                    </span>
                    <span
                      className="ml-auto size-1.5 shrink-0 rounded-full group-data-[collapsible=icon]:hidden"
                      style={{
                        backgroundColor: `var(${
                          DOT_VAR[estados?.[agente.id] ?? agente.estado]
                        })`,
                      }}
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Tablero de contenido">
              <Link href="/tablero">
                <ArrowLeft />
                <span>Tablero de contenido</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

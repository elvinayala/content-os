"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/lib/nav";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <Avatar className="size-9 rounded-lg ring-2 ring-primary/40">
            <AvatarFallback className="rounded-lg bg-primary/15 font-semibold text-primary">
              TM
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">@tenfoldmarc</span>
            <span className="text-xs text-muted-foreground">
              Tablero de contenido
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Secciones</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const activo =
                pathname === item.href || pathname.startsWith(item.href + "/");
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          PASO 01 · datos de ejemplo
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bot } from "lucide-react";

import { borinquenNav } from "@/lib/borinquen-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export function BorinquenSidebar() {
  const pathname = usePathname();

  return (
    // className="borinquen": el Sheet mobile portalea a <body> y sale del scope.
    <Sidebar collapsible="icon" className="borinquen">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <Avatar className="size-9 rounded-lg ring-2 ring-primary/50">
            <AvatarFallback className="rounded-lg bg-primary/15 text-primary">
              <Bot className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-semibold">
              AI Borinquen
            </span>
            <span className="label-mono text-muted-foreground">
              Tus agentes, en un lugar
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {borinquenNav.map((item) => {
              const activo =
                item.href === "/borinquen"
                  ? pathname === "/borinquen"
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="CEO Command Center">
              <Link href="/ceo">
                <ArrowLeft />
                <span>CEO Command Center</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

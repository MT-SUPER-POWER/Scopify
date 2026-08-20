"use client";

import type { CSSProperties } from "react";
import { Compass, Heart, Library, Search } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@scopify/ui/shadcn/components/sidebar";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnSidebarPreview({ name }: ShadcnPreviewProps) {
  if (name !== "shadcn-sidebar") return null;

  return (
    <SidebarProvider
      className="min-h-64! w-full max-w-2xl overflow-hidden rounded-xl border"
      style={{ "--sidebar-width": "15rem" } as CSSProperties}
    >
      <Sidebar collapsible="none">
        <SidebarHeader>
          <div className="px-2 py-1 text-sm font-semibold">Scopify</div>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-2 left-2 size-4" />
            <SidebarInput className="pl-8" placeholder="搜索音乐" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>音乐</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Compass /> <span>发现音乐</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Library /> <span>我的音乐</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Heart /> <span>我喜欢的音乐</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-w-0 p-4">
        <SidebarTrigger />
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <p className="font-medium">内容区域</p>
            <p className="text-muted-foreground mt-1 text-sm">侧边栏与页面内容协同布局</p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@scopify/ui/shadcn/components/menubar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@scopify/ui/shadcn/components/navigation-menu";

import type { ShadcnPreviewProps } from "@/types/component-docs";

export function ShadcnNavigationMenuPreview({ name }: ShadcnPreviewProps) {
  switch (name) {
    case "shadcn-menubar":
      return (
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>播放</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                播放 / 暂停 <MenubarShortcut>Space</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>下一首</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>清空播放队列</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>视图</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>全屏播放器</MenubarItem>
              <MenubarItem>桌面歌词</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    case "shadcn-navigation-menu":
      return (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#discover">发现音乐</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#podcasts">播客</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#library">我的音乐</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
  }
}

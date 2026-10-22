"use client";

import { ArrowUpRight, Check, FlaskConical, Moon, Palette, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@scopify/ui/shadcn/components/dialog";

import { useThemePrototype } from "@/hooks/use-theme-prototype";

export function ThemePrototypeSwitcher() {
  const pathname = usePathname();
  const themePrototype = useThemePrototype();
  const isUiLibraryRoute =
    pathname === "/docs/ui-library" ||
    ["/docs/shadcn", "/docs/scopify"].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  if (!isUiLibraryRoute) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label="切换组件预览主题"
          className="fixed right-5 bottom-5 z-40 h-10 rounded-full border shadow-lg"
          size="sm"
          variant="secondary"
        >
          <Palette aria-hidden />
          <span className="max-w-32 truncate">{themePrototype.activeThemeId}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b p-5 pr-12">
          <DialogTitle>组件预览主题</DialogTitle>
          <DialogDescription>
            在这里快速切换预览主题；编辑颜色、保存主题和导出 CSS，请进入 Theme Lab。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 p-5">
          <div className="bg-muted flex w-fit rounded-full p-1">
            <Button
              size="sm"
              variant={themePrototype.mode === "light" ? "secondary" : "ghost"}
              onClick={() => themePrototype.setMode("light")}
            >
              <Sun /> 浅色
            </Button>
            <Button
              size="sm"
              variant={themePrototype.mode === "dark" ? "secondary" : "ghost"}
              onClick={() => themePrototype.setMode("dark")}
            >
              <Moon /> 深色
            </Button>
          </div>

          <div className="space-y-2">
            {themePrototype.themes.map((theme) => {
              const active = theme.id === themePrototype.activeThemeId;

              return (
                <button
                  className="hover:bg-muted flex w-full items-center gap-3 rounded-xl border p-3 text-left transition"
                  key={theme.id}
                  type="button"
                  onClick={() => themePrototype.applyTheme(theme.id)}
                >
                  <span
                    className="size-9 shrink-0 rounded-full border shadow-sm"
                    style={{ background: theme.draft.light["--primary"] }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{theme.name}</span>
                    <span className="text-muted-foreground block truncate font-mono text-xs">
                      {theme.id}
                    </span>
                  </span>
                  {active ? <Check className="text-primary size-4" /> : null}
                </button>
              );
            })}
          </div>

          <Button className="w-full" variant="outline" asChild>
            <Link href="/theme-editor">
              <FlaskConical aria-hidden /> 进入 Theme Lab 主题实验室 <ArrowUpRight aria-hidden />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

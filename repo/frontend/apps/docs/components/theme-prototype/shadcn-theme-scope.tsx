"use client";

import type { ReactNode } from "react";

import { useThemePrototype } from "@/hooks/use-theme-prototype";
import { createPreviewStyle } from "@/lib/theme-lab";
import type { ThemeDraft, ThemeMode } from "@/types/theme-lab";

interface ShadcnThemeScopeProps {
  children: ReactNode;
  className?: string;
  draft?: ThemeDraft;
  mode?: ThemeMode;
  themeId?: string;
}

export function ShadcnThemeScope({
  children,
  className,
  draft,
  mode,
  themeId,
}: ShadcnThemeScopeProps) {
  const prototype = useThemePrototype();
  const resolvedDraft = draft ?? prototype.activeTheme?.draft;
  const resolvedMode = mode ?? prototype.mode;
  const resolvedThemeId = themeId ?? prototype.activeThemeId;
  const style = resolvedDraft
    ? createPreviewStyle(resolvedDraft[resolvedMode], resolvedMode)
    : { colorScheme: resolvedMode };

  return (
    <div
      className={[resolvedMode === "dark" ? "dark" : "", className].filter(Boolean).join(" ")}
      data-shadcn-theme-scope=""
      data-theme={resolvedThemeId}
      style={style}
    >
      {children}
    </div>
  );
}

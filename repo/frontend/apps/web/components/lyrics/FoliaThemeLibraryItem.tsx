"use client";

import { FoliaThemeRecord } from "@/components/lyrics/FoliaThemeRecord";
import { useI18n } from "@/store/module/i18n";
import type { FoliaThemeLibraryItemProps } from "@/types/components/lyrics";

export function FoliaThemeLibraryItem({
  activeThemeId,
  collapsed,
  onSelect,
  selected,
  theme,
}: FoliaThemeLibraryItemProps) {
  const { t } = useI18n();
  const isApplied = theme.id === activeThemeId;

  return (
    <button
      className={`relative flex items-center rounded-2xl border text-left transition ${collapsed ? "mx-auto size-12 justify-center overflow-visible p-1" : "w-full gap-3 p-2.5"}`}
      onClick={onSelect}
      style={{
        backgroundColor: selected ? `${theme.dark.accentColor}18` : "transparent",
        borderColor: selected ? theme.dark.accentColor : "rgba(255,255,255,0.08)",
      }}
      title={theme.name}
      type="button"
    >
      <FoliaThemeRecord size="library" theme={theme} />
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{theme.name}</span>
          {isApplied ? (
            <span className="block text-[10px] opacity-50">{t("folia.ui.currentTheme")}</span>
          ) : null}
        </div>
      ) : null}
      {!collapsed ? (
        <span className="flex shrink-0 gap-1">
          <i className="size-2 rounded-full" style={{ backgroundColor: theme.light.accentColor }} />
          <i className="size-2 rounded-full" style={{ backgroundColor: theme.dark.accentColor }} />
        </span>
      ) : null}
    </button>
  );
}

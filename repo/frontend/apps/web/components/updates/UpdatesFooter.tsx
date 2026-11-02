"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@scopify/ui/shadcn/components/select";
import { UPDATES, UPDATES_UNRELEASED_KEY } from "@/constants/updates";
import { useTranslation } from "react-i18next";

import type { UpdatesFooterProps } from "@/types/updates/model";
import { cn } from "@/lib/utils";
import {
  UPDATES_DOC_FONTS_STYLE,
  UPDATES_DOC_THEME_CLASS,
  UPDATES_FOCUS_CLASS,
} from "./updatesDocStyles";

export function UpdatesFooter({ releaseKey, onReleaseChange, onClose }: UpdatesFooterProps) {
  const { t } = useTranslation();
  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-(--doc-border) py-3.5 pr-5 pl-9 font-(family-name:--doc-font-ui) max-[440px]:pl-5">
      <div className="flex min-w-0 items-center gap-4">
        <Select value={releaseKey} onValueChange={onReleaseChange}>
          <SelectTrigger
            size="sm"
            className="rounded-[8px] bg-transparent text-[13px] leading-(--text-sm--line-height) text-(--doc-text) shadow-none data-[size=sm]:h-[30px] dark:bg-transparent dark:hover:bg-transparent"
            aria-label={t("updates.version")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className={cn(UPDATES_DOC_THEME_CLASS, "z-262 font-(family-name:--doc-font-ui)")}
            style={UPDATES_DOC_FONTS_STYLE}
            side="top"
            position="popper"
          >
            {!UPDATES.releases.some((item) => item.version === UPDATES.currentVersion) ? (
              <SelectItem value={UPDATES.currentVersion}>v{UPDATES.currentVersion}</SelectItem>
            ) : null}
            {UPDATES.releases.map((item) => (
              <SelectItem
                key={item.version ?? UPDATES_UNRELEASED_KEY}
                value={item.version ?? UPDATES_UNRELEASED_KEY}
              >
                {item.version ? `v${item.version}` : t("updates.unreleased")}
                {item.version === UPDATES.currentVersion ? ` · ${t("updates.current")}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        className={cn(
          "h-[34px] shrink-0 cursor-pointer rounded-[8px] bg-(--doc-heading) px-5 text-[13px] font-semibold text-(--doc-bg) transition-opacity duration-120 hover:opacity-88",
          UPDATES_FOCUS_CLASS,
        )}
        onClick={onClose}
      >
        {t("updates.close")}
      </button>
    </footer>
  );
}

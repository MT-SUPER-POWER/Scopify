"use client";
import { Check, ChevronsUpDown } from "lucide-react";
import type { MusicProvider } from "@scopify/music-domain/identity";
import { useTranslation } from "react-i18next";
import { ProviderLogo } from "@/components/provider/ProviderLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TranslationKey } from "@/lib/i18n";

import type { LoginPlatformSwitchProps } from "@/types/auth/qqLogin";

const PLATFORMS = [
  { provider: "netease", labelKey: "login.platform.netease" },
  { provider: "qq", labelKey: "login.platform.qq" },
] as const satisfies readonly { provider: MusicProvider; labelKey: TranslationKey }[];

/** One quiet footer row at the bottom of the card: which platform, with a small menu to change it. */
export function LoginPlatformSwitch({ value, disabled, onChange }: LoginPlatformSwitchProps) {
  const { t } = useTranslation();
  const current = PLATFORMS.find((item) => item.provider === value) ?? PLATFORMS[0];
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-content-subtle">{t("login.platform.label")}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled}
          className="-mr-1.5 flex items-center gap-2 rounded-full py-1 pr-2 pl-2.5 text-xs font-medium text-content transition-colors outline-none hover:bg-content/5 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50"
        >
          <ProviderLogo provider={current.provider} className="size-4" />
          {t(current.labelKey)}
          <ChevronsUpDown className="size-3 text-content-subtle" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {PLATFORMS.map((item) => (
            <DropdownMenuItem
              key={item.provider}
              onSelect={() => onChange(item.provider)}
              className="gap-2.5 text-xs"
            >
              <ProviderLogo provider={item.provider} className="size-4" />
              {t(item.labelKey)}
              {item.provider === value && <Check className="ml-auto size-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

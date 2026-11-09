"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ProviderLogo } from "@/components/provider/ProviderLogo";
import { useProviderAccounts } from "@/hooks/auth/useProviderAccounts";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useSwitchProvider } from "@/hooks/provider/useSwitchProvider";
import { openLoginForPlatform } from "@/lib/auth/loginPlatform";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useActiveProviderStore } from "@/store/module/provider";
import type { MusicProvider } from "@scopify/music-domain/identity";

const PLATFORM_LABEL_KEYS: Record<MusicProvider, TranslationKey> = {
  netease: "login.platform.netease",
  qq: "login.platform.qq",
};

/**
 * Both accounts with their login state. Choosing a signed-in account switches the whole app to
 * that platform; choosing a signed-out one opens its login.
 */
export function ProfileMenuAccounts() {
  const { t } = useTranslation();
  const smartRouter = useSmartRouter();
  const accounts = useProviderAccounts();
  const activeProvider = useActiveProviderStore((state) => state.activeProvider);
  const switchProvider = useSwitchProvider();

  return (
    <DropdownMenuGroup className="flex flex-col gap-1 p-3">
      <DropdownMenuLabel className="px-3 pb-1 text-xs font-medium text-content-subtle">
        {t("profile.accounts.title")}
      </DropdownMenuLabel>
      {accounts.map((account) => {
        const isActive = account.provider === activeProvider;
        const name = account.profile?.nickname || t("profile.accounts.signedIn");
        return (
          <DropdownMenuItem
            key={account.provider}
            className={cn(
              "min-h-14 cursor-pointer gap-3 rounded-xl px-3 py-2 focus:bg-content/5",
              isActive && "bg-content/5",
            )}
            onSelect={() => {
              if (!account.isLoggedIn) {
                openLoginForPlatform(account.provider, (url) => smartRouter.push(url));
              } else if (!isActive) {
                void switchProvider(account.provider);
              }
            }}
          >
            <div className="relative size-10 shrink-0">
              {account.profile?.avatarUrl ? (
                <>
                  <Image
                    src={account.profile.avatarUrl}
                    alt={account.profile.nickname}
                    fill
                    sizes="40px"
                    className="rounded-full object-cover"
                  />
                  <ProviderLogo
                    provider={account.provider}
                    className="absolute -right-1 -bottom-1 size-4 rounded-full ring-2 ring-surface-overlay"
                  />
                </>
              ) : (
                <ProviderLogo provider={account.provider} className="size-10" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-content">
                {t(PLATFORM_LABEL_KEYS[account.provider])}
              </span>
              <span className="truncate text-xs text-content-muted">
                {account.isLoggedIn ? name : t("profile.accounts.notLoggedIn")}
              </span>
            </div>
            {!account.isLoggedIn ? (
              <span className="shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground">
                {t("common.action.login")}
              </span>
            ) : (
              isActive && (
                <Check
                  className="size-4 shrink-0 text-brand"
                  aria-label={t("profile.accounts.active")}
                />
              )
            )}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuGroup>
  );
}

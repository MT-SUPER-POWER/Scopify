"use client";

import { Check, User } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
    <DropdownMenuGroup className="px-3 py-2">
      <DropdownMenuLabel className="px-3 text-xs font-medium text-content-subtle">
        {t("profile.accounts.title")}
      </DropdownMenuLabel>
      {accounts.map((account) => {
        const isActive = account.provider === activeProvider;
        const name = account.profile?.nickname || t("profile.accounts.signedIn");
        return (
          <DropdownMenuItem
            key={account.provider}
            className="min-h-12 cursor-pointer gap-3 rounded-lg px-3 focus:bg-content/5"
            onSelect={() => {
              if (!account.isLoggedIn) {
                openLoginForPlatform(account.provider, (url) => smartRouter.push(url));
              } else if (!isActive) {
                void switchProvider(account.provider);
              }
            }}
          >
            <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-content/10 text-content-muted">
              {account.profile?.avatarUrl ? (
                <Image
                  src={account.profile.avatarUrl}
                  alt={account.profile.nickname}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <User className="size-4" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-content">
                {t(PLATFORM_LABEL_KEYS[account.provider])}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  account.isLoggedIn ? "text-content-muted" : "text-brand",
                )}
              >
                {account.isLoggedIn ? name : t("profile.accounts.login")}
              </span>
            </div>
            {isActive && (
              <Check
                className="size-4 shrink-0 text-brand"
                aria-label={t("profile.accounts.active")}
              />
            )}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenuGroup>
  );
}

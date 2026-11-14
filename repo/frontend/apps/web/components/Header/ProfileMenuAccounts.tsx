"use client";

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

/** Platform selection and account sign-in are separate actions. */
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
        const platformName = t(PLATFORM_LABEL_KEYS[account.provider]);
        const name = account.profile?.nickname || t("profile.accounts.signedIn");
        return (
          <div
            key={account.provider}
            className={cn("flex min-h-14 items-center rounded-xl", isActive && "bg-content/5")}
          >
            <DropdownMenuItem
              asChild
              aria-current={isActive ? "true" : undefined}
              className="group min-h-14 min-w-0 flex-1 cursor-pointer gap-3 px-3 py-2 text-left focus:bg-transparent"
              onSelect={() => {
                if (!isActive) void switchProvider(account.provider);
              }}
            >
              <button type="button">
                <span className="relative size-10 shrink-0">
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
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-content group-focus-visible:underline">
                    {platformName}
                  </span>
                  <span className="truncate text-xs text-content-muted">
                    {account.isLoggedIn ? name : t("profile.accounts.notLoggedIn")}
                  </span>
                </span>
              </button>
            </DropdownMenuItem>
            {!account.isLoggedIn && (
              <DropdownMenuItem
                asChild
                className="mr-3 shrink-0 cursor-pointer rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground focus:bg-brand-hover focus:text-brand-foreground focus:ring-2 focus:ring-content"
                onSelect={() => {
                  void openLoginForPlatform(account.provider, (url) => smartRouter.push(url));
                }}
              >
                <button type="button" aria-label={`${t("common.action.login")} · ${platformName}`}>
                  {t("common.action.login")}
                </button>
              </DropdownMenuItem>
            )}
          </div>
        );
      })}
    </DropdownMenuGroup>
  );
}

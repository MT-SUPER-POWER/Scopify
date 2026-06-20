"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/i18n";
import { useI18n } from "@/store/module/i18n";
import type { LoginRequiredPromptProps, LoginRequiredReason } from "@/types/auth";

const loginRequiredCopy: Record<
  LoginRequiredReason,
  { title: TranslationKey; subtitle: TranslationKey }
> = {
  "album-subscribe": {
    title: "login.required.albumSubscribe.title",
    subtitle: "login.required.albumSubscribe.subtitle",
  },
  "playlist-edit": {
    title: "login.required.playlistEdit.title",
    subtitle: "login.required.playlistEdit.subtitle",
  },
  "profile-edit": {
    title: "login.required.profileEdit.title",
    subtitle: "login.required.profileEdit.subtitle",
  },
  comment: {
    title: "login.required.comment.title",
    subtitle: "login.required.comment.subtitle",
  },
  "add-to-playlist": {
    title: "login.required.addToPlaylist.title",
    subtitle: "login.required.addToPlaylist.subtitle",
  },
  library: {
    title: "login.required.library.title",
    subtitle: "login.required.library.subtitle",
  },
  "followed-artists": {
    title: "login.required.followedArtists.title",
    subtitle: "login.required.followedArtists.subtitle",
  },
};

export function LoginRequiredPrompt({ reason, onLogin, compact }: LoginRequiredPromptProps) {
  const { t } = useI18n();
  const copy = loginRequiredCopy[reason];

  return (
    <div
      className={
        compact
          ? "flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2"
          : "flex flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-6 py-8 text-center"
      }
    >
      <div className={compact ? "min-w-0" : "flex flex-col items-center gap-2"}>
        {!compact && <LogIn className="h-8 w-8 text-zinc-400" />}
        <p className="text-sm font-semibold text-white">{t(copy.title)}</p>
        <p className="mt-1 text-xs text-zinc-400">{t(copy.subtitle)}</p>
      </div>
      <Button type="button" size={compact ? "sm" : "default"} onClick={onLogin}>
        {t("common.action.login")}
      </Button>
    </div>
  );
}

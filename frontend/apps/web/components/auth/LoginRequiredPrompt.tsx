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
          ? "bg-content/4 border-content/10 flex items-center justify-between gap-3 rounded-md border px-3 py-2"
          : "bg-content/4 border-content/10 flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-8 text-center"
      }
    >
      <div className={compact ? "min-w-0" : "flex flex-col items-center gap-2"}>
        {!compact && <LogIn className="text-content-muted size-8" />}
        <p className="text-content text-sm font-semibold">{t(copy.title)}</p>
        <p className="text-content-muted mt-1 text-xs">{t(copy.subtitle)}</p>
      </div>
      <Button type="button" size={compact ? "sm" : "default"} onClick={onLogin}>
        {t("common.action.login")}
      </Button>
    </div>
  );
}

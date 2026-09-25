"use client";

import { toast } from "sonner";
import { useI18n } from "@/store/module/i18n";
import type { SocialEvent } from "@/types/social";

export function useSocialShare(event: SocialEvent) {
  const { t } = useI18n();
  return async () => {
    try {
      const params = new URLSearchParams({ id: event.id, uid: event.user.id });
      await navigator.clipboard.writeText("https://music.163.com/#/event?" + params);
      toast.success(t("social.copied"));
    } catch {
      toast.error(t("social.actionFailed"));
    }
  };
}

"use client";

import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import type { SocialEvent } from "@/types/social/model";

export function useSocialShare(event: SocialEvent) {
  const { t } = useTranslation();
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

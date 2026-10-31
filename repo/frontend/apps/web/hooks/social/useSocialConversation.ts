"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendMessage } from "@/lib/api/social";
import { socialKey } from "@/lib/social/cache";
import { useSocialAccount } from "./useSocialQueries";
import { useTranslation } from "react-i18next";

export function useSocialSendMessage(uid: string) {
  const { account } = useSocialAccount(),
    client = useQueryClient(),
    { t } = useTranslation();
  return useMutation({
    mutationFn: (text: string) => sendMessage(uid, text),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: socialKey(account, "messages", uid) });
      toast.success(t("social.sent"));
    },
    onError: () => toast.error(t("social.actionFailed")),
  });
}

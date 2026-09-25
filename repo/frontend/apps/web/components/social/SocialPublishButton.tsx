"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { useI18n } from "@/store/module/i18n";
import { SocialComposer } from "./SocialComposer";
import s from "./Social.module.css";

export function SocialPublishButton() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const requireLogin = useRequireLoginAction();
  return (
    <>
      <button
        type="button"
        aria-label={t("social.publishPost")}
        title={t("social.publishPost")}
        className={s.button + " " + s.primary + " " + s.publishButton}
        onClick={() => void requireLogin(() => setOpen(true))}
      >
        <Plus aria-hidden="true" className="size-4" />
        <span>{t("social.publishPost")}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={s.dialog + " sm:max-w-2xl"}>
          <DialogTitle>{t("social.publish")}</DialogTitle>
          <DialogDescription className="sr-only">{t("social.compose")}</DialogDescription>
          <SocialComposer onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

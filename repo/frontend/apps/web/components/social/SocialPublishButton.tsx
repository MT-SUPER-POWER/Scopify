"use client";

import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const params = useSearchParams();
  // 个人动态只会出现在「关注」流中；在其他视图发布后跳过去，让用户看到自己刚发的内容
  const handleDone = () => {
    setOpen(false);
    if (params.get("view") !== "following")
      router.push("/social?view=following", { scroll: false });
  };
  return (
    <>
      <button
        type="button"
        aria-label={t("social.publishPost")}
        title={t("social.publishPost")}
        className={s.button + " " + s.publishButton}
        onClick={() => void requireLogin(() => setOpen(true))}
      >
        <Plus aria-hidden="true" className="size-4" />
        <span>{t("social.publishPost")}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={s.dialog + " sm:max-w-2xl"}>
          <DialogTitle>{t("social.publish")}</DialogTitle>
          <DialogDescription className={s.muted}>{t("social.publishTarget")}</DialogDescription>
          <SocialComposer onDone={handleDone} />
        </DialogContent>
      </Dialog>
    </>
  );
}

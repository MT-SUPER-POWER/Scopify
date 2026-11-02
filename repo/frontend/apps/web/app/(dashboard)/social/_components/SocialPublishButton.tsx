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
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { useTranslation } from "react-i18next";

import { SocialComposer } from "@/components/social/SocialComposer";
import { cn } from "@/lib/utils";
import {
  socialButtonClass,
  socialDialogClass,
  socialMutedClass,
} from "@/components/social/socialClasses";

export function SocialPublishButton() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
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
        className={cn(
          socialButtonClass,
          "min-h-[34px] bg-transparent py-1.5 pr-3.5 pl-[11px] text-[13px] text-foreground hover:border-[color:color-mix(in_srgb,var(--primary)_55%,color-mix(in_srgb,var(--foreground)_10%,transparent))] hover:bg-primary/8 @max-[500px]:px-3",
        )}
        onClick={() => void requireLogin(() => setOpen(true))}
      >
        <Plus aria-hidden="true" className="size-4 text-primary" />
        <span className="@max-[360px]:hidden">{t("social.publishPost")}</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(socialDialogClass, "sm:max-w-2xl")}>
          <DialogTitle>{t("social.publish")}</DialogTitle>
          {/* 保留 DialogDescription 默认 text-sm 的行高，只改字号与颜色 */}
          <DialogDescription className={cn(socialMutedClass, "leading-[calc(1.25/0.875)]")}>
            {t("social.publishTarget")}
          </DialogDescription>
          <SocialComposer onDone={handleDone} />
        </DialogContent>
      </Dialog>
    </>
  );
}

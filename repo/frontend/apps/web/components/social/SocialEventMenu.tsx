"use client";

import { MoreHorizontal, Share, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useSocialShare } from "@/hooks/social/useSocialShare";
import { useTranslation } from "react-i18next";

import type { SocialEventMenuProps } from "@/types/social/components";
import { cn } from "@/lib/utils";
import {
  socialButtonClass,
  socialDangerClass,
  socialDialogClass,
  socialIconButtonClass,
  socialRowClass,
} from "./socialClasses";

export function SocialEventMenu({ event, pending, onDelete }: SocialEventMenuProps) {
  const { t } = useTranslation();
  const { uid } = useSocialAccount();
  const copyLink = useSocialShare(event);
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={socialIconButtonClass} aria-label={t("social.more")}>
            <MoreHorizontal />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void copyLink()}>
            <Share className="size-4" />
            {t("social.share")}
          </DropdownMenuItem>
          {event.user.id === uid && (
            <DropdownMenuItem className="text-destructive" onSelect={() => setDeleting(true)}>
              <Trash2 className="size-4" />
              {t("social.delete")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog
        open={deleting}
        onOpenChange={(value) => {
          if (!pending) setDeleting(value);
        }}
      >
        <DialogContent className={socialDialogClass}>
          <DialogTitle>{t("social.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("social.deleteHint")}</DialogDescription>
          <div className={cn(socialRowClass, "justify-end")}>
            <button
              type="button"
              className={socialButtonClass}
              disabled={pending}
              onClick={() => setDeleting(false)}
            >
              {t("social.cancel")}
            </button>
            <button
              type="button"
              className={cn(socialButtonClass, socialDangerClass)}
              disabled={pending}
              onClick={() => onDelete(() => setDeleting(false))}
            >
              {t("social.delete")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

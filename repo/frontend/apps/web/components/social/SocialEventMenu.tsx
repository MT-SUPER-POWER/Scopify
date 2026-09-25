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
import { useI18n } from "@/store/module/i18n";
import type { SocialEventMenuProps } from "@/types/components/social";
import s from "./Social.module.css";

export function SocialEventMenu({ event, pending, onDelete }: SocialEventMenuProps) {
  const { t } = useI18n();
  const { uid } = useSocialAccount();
  const copyLink = useSocialShare(event);
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className={s.iconButton} aria-label={t("social.more")}>
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
        <DialogContent className={s.dialog}>
          <DialogTitle>{t("social.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("social.deleteHint")}</DialogDescription>
          <div className={s.row + " justify-end"}>
            <button
              type="button"
              className={s.button}
              disabled={pending}
              onClick={() => setDeleting(false)}
            >
              {t("social.cancel")}
            </button>
            <button
              type="button"
              className={s.button + " " + s.danger}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/store/module/i18n";
import type { EditUserProfileDialogProps } from "@/types/components/social";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";

export function EditUserProfileDialog({
  open,
  user,
  saving,
  onCancel,
  onConfirm,
}: EditUserProfileDialogProps) {
  const { t } = useI18n();
  const [nickname, setNickname] = useState(user.nickname);
  const [signature, setSignature] = useState(user.signature ?? "");
  const [gender, setGender] = useState<0 | 1 | 2>((user.gender as 0 | 1 | 2 | undefined) ?? 0);

  const openedFor = useRef<number | null>(null);
  useEffect(() => {
    if (!open) {
      openedFor.current = null;
      return;
    }
    if (openedFor.current === user.userId) return;
    openedFor.current = user.userId;
    setNickname(user.nickname);
    setSignature(user.signature ?? "");
    setGender((user.gender as 0 | 1 | 2 | undefined) ?? 0);
  }, [open, user]);

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !saving) onCancel();
      }}
    >
      <DialogContent className="rounded-xl bg-surface-overlay p-6 text-content sm:max-w-md">
        <DialogTitle className="text-xl font-bold">{t("profile.edit.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("profile.edit.signature")}</DialogDescription>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-content-muted">
            {t("profile.edit.nickname")}
            <Input
              disabled={saving}
              value={nickname}
              maxLength={30}
              onChange={(event) => setNickname(event.target.value)}
              className="bg-content/10 text-content placeholder:text-content-subtle focus-visible:ring-brand/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-content-muted">
            {t("profile.edit.signature")}
            <Textarea
              disabled={saving}
              value={signature}
              maxLength={300}
              rows={4}
              onChange={(event) => setSignature(event.target.value)}
              className="resize-none bg-content/10 text-content placeholder:text-content-subtle focus-visible:ring-brand/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-content-muted">
            {t("profile.edit.gender")}
            <Select
              disabled={saving}
              value={String(gender)}
              onValueChange={(val) => setGender(Number(val) as 0 | 1 | 2)}
            >
              <SelectTrigger className="bg-content/10 text-content focus-visible:ring-brand/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("profile.edit.genderPrivate")}</SelectItem>
                <SelectItem value="1">{t("profile.edit.genderMale")}</SelectItem>
                <SelectItem value="2">{t("profile.edit.genderFemale")}</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={onCancel}
            className="rounded-full border-content/20 text-content hover:border-content hover:text-content"
          >
            {t("common.action.cancel")}
          </Button>
          <Button
            type="button"
            disabled={saving || !nickname.trim()}
            onClick={() => onConfirm({ nickname: nickname.trim(), signature, gender })}
            className="rounded-full bg-brand text-brand-foreground hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? t("common.action.saving") : t("common.action.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

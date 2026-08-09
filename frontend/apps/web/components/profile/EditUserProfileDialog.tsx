"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { UpdateUserProfilePayload } from "@/types/api/profileUpdate";
import type { NeteaseUser } from "@/types/api/user";

type EditableProfileUser = NeteaseUser;

interface EditUserProfileDialogProps {
  open: boolean;
  user: EditableProfileUser;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (payload: UpdateUserProfilePayload) => Promise<void>;
}

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

  useEffect(() => {
    if (!open) return;
    setNickname(user.nickname);
    setSignature(user.signature ?? "");
    setGender((user.gender as 0 | 1 | 2 | undefined) ?? 0);
  }, [open, user]);

  if (!open) return null;

  return (
    <div className="bg-overlay fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-sm">
      <div className="bg-surface-overlay shadow-floating w-full max-w-md rounded-xl border p-6">
        <h2 className="text-content text-xl font-bold">{t("profile.edit.title")}</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="text-content-muted flex flex-col gap-2 text-xs font-semibold">
            {t("profile.edit.nickname")}
            <Input
              value={nickname}
              maxLength={30}
              onChange={(event) => setNickname(event.target.value)}
              className="bg-content/10 text-content placeholder:text-content-subtle focus-visible:ring-brand/30"
            />
          </label>
          <label className="text-content-muted flex flex-col gap-2 text-xs font-semibold">
            {t("profile.edit.signature")}
            <Textarea
              value={signature}
              maxLength={300}
              rows={4}
              onChange={(event) => setSignature(event.target.value)}
              className="bg-content/10 text-content placeholder:text-content-subtle focus-visible:ring-brand/30 resize-none"
            />
          </label>
          <label className="text-content-muted flex flex-col gap-2 text-xs font-semibold">
            {t("profile.edit.gender")}
            <Select
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
            onClick={onCancel}
            className="border-content/20 text-content hover:border-content hover:text-content rounded-full"
          >
            {t("common.action.cancel")}
          </Button>
          <Button
            type="button"
            disabled={saving || !nickname.trim()}
            onClick={() => onConfirm({ nickname: nickname.trim(), signature, gender })}
            className="bg-brand text-brand-foreground hover:bg-brand-hover rounded-full disabled:opacity-50"
          >
            {saving ? t("common.action.saving") : t("common.action.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

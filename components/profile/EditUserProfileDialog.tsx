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

type EditableProfileUser = NeteaseUser & Partial<Pick<UpdateUserProfilePayload, "gender">>;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#282828] p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white">{t("profile.edit.title")}</h2>
        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-xs font-semibold text-zinc-400">
            {t("profile.edit.nickname")}
            <Input
              value={nickname}
              maxLength={30}
              onChange={(event) => setNickname(event.target.value)}
              className="bg-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-white/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-zinc-400">
            {t("profile.edit.signature")}
            <Textarea
              value={signature}
              maxLength={300}
              rows={4}
              onChange={(event) => setSignature(event.target.value)}
              className="resize-none bg-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-white/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-zinc-400">
            {t("profile.edit.gender")}
            <Select
              value={String(gender)}
              onValueChange={(val) => setGender(Number(val) as 0 | 1 | 2)}
            >
              <SelectTrigger className="bg-white/10 text-white focus-visible:ring-white/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#282828] text-white">
                <SelectItem value="0" className="focus:bg-white/10 focus:text-white">
                  {t("profile.edit.genderPrivate")}
                </SelectItem>
                <SelectItem value="1" className="focus:bg-white/10 focus:text-white">
                  {t("profile.edit.genderMale")}
                </SelectItem>
                <SelectItem value="2" className="focus:bg-white/10 focus:text-white">
                  {t("profile.edit.genderFemale")}
                </SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-full border-white/20 text-white hover:border-white hover:text-white"
          >
            {t("common.action.cancel")}
          </Button>
          <Button
            type="button"
            disabled={saving || !nickname.trim()}
            onClick={() => onConfirm({ nickname: nickname.trim(), signature, gender })}
            className="rounded-full bg-[#1ed760] text-black hover:bg-[#3be477] disabled:opacity-50"
          >
            {saving ? t("common.action.saving") : t("common.action.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

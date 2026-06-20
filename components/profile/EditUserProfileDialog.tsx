"use client";

import { useEffect, useState } from "react";
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
            <input
              value={nickname}
              maxLength={30}
              onChange={(event) => setNickname(event.target.value)}
              className="rounded-md bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-white/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-zinc-400">
            {t("profile.edit.signature")}
            <textarea
              value={signature}
              maxLength={300}
              rows={4}
              onChange={(event) => setSignature(event.target.value)}
              className="resize-none rounded-md bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-white/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-zinc-400">
            {t("profile.edit.gender")}
            <select
              value={gender}
              onChange={(event) => setGender(Number(event.target.value) as 0 | 1 | 2)}
              className="rounded-md bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value={0}>{t("profile.edit.genderPrivate")}</option>
              <option value={1}>{t("profile.edit.genderMale")}</option>
              <option value={2}>{t("profile.edit.genderFemale")}</option>
            </select>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-bold text-white hover:border-white"
          >
            {t("common.action.cancel")}
          </button>
          <button
            type="button"
            disabled={saving || !nickname.trim()}
            onClick={() => onConfirm({ nickname: nickname.trim(), signature, gender })}
            className="rounded-full bg-[#1ed760] px-5 py-2 text-sm font-bold text-black hover:bg-[#3be477] disabled:opacity-50"
          >
            {saving ? t("common.action.saving") : t("common.action.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

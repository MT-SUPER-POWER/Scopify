"use client";

import { Globe2, Music2, X } from "lucide-react";
import { useState } from "react";
import { useSocialPublish } from "@/hooks/social/useSocialActions";
import { useSocialAccount } from "@/hooks/social/useSocialQueries";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";
import { useTranslation } from "react-i18next";

import type { SocialComposerProps } from "@/types/social/components";
import type { SocialResource } from "@/types/social/model";
import { SocialAvatar } from "./SocialPrimitives";
import { SocialResourceCard } from "./SocialResourceCard";
import { SocialResourcePicker } from "./SocialResourcePicker";
import s from "./Social.module.css";

export function SocialComposer({ forwarded, onDone }: SocialComposerProps) {
  const { t } = useTranslation(),
    { uid } = useSocialAccount();
  const user = useUserStore((state) => state.user),
    song = usePlayerStore((state) => state.currentSongDetail);
  const [text, setText] = useState(""),
    [resource, setResource] = useState<SocialResource>(),
    [picker, setPicker] = useState(false);
  const mutation = useSocialPublish(forwarded),
    requireLogin = useRequireLoginAction();
  const length = Array.from(text).length;
  async function submit() {
    await requireLogin(async () => {
      if (mutation.isPending || length > 140 || (!text.trim() && !resource && !forwarded)) return;
      try {
        await mutation.mutateAsync({ text: text.trim(), resource });
        setText("");
        setResource(undefined);
        onDone?.();
      } catch {
        /* Keep the draft for retry. */
      }
    });
  }
  return (
    <>
      <form
        className={s.composer}
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <SocialAvatar
          user={{
            id: uid,
            name: user?.nickname ?? "",
            avatar: user?.avatarUrl ?? "",
            signature: "",
            followed: false,
            mutual: false,
          }}
        />
        <div className={s.composerBody}>
          <textarea
            className={s.textarea}
            value={text}
            disabled={mutation.isPending}
            aria-label={t(forwarded ? "social.forwardPlaceholder" : "social.compose")}
            placeholder={t(forwarded ? "social.forwardPlaceholder" : "social.compose")}
            onChange={(e) => setText(e.target.value)}
            rows={2}
          />
          {forwarded && (
            <div className={s.quote}>
              <strong className="text-sm">{forwarded.user.name}</strong>
              <p className={s.postText}>{forwarded.text || t("social.unknownPost")}</p>
            </div>
          )}
          {resource && (
            <div>
              <div className={s.between}>
                <span className={s.muted}>{t("social.attach")}</span>
                <button
                  type="button"
                  className={s.iconButton}
                  disabled={mutation.isPending}
                  aria-label={t("social.removeAttachment")}
                  onClick={() => setResource(undefined)}
                >
                  <X />
                </button>
              </div>
              <SocialResourceCard resource={resource} compact />
            </div>
          )}
          <div className={s.composerFooter}>
            <div className={s.composerTools}>
              {!forwarded && (
                <>
                  <button
                    type="button"
                    className={s.action}
                    disabled={mutation.isPending}
                    onClick={() => setPicker(true)}
                    title={t("social.attach")}
                  >
                    <Music2 />
                    <span className={s.toolLabel}>{t("social.attach")}</span>
                  </button>
                  {Boolean(song?.id) && song && (
                    <button
                      type="button"
                      className={s.textButton + " " + s.toolLabel}
                      disabled={mutation.isPending}
                      onClick={() =>
                        setResource({
                          id: String(song.id),
                          kind: "song",
                          name: song.name,
                          subtitle: song.ar.map((a) => a.name).join(" / "),
                          cover: song.al.picUrl,
                          song,
                        })
                      }
                    >
                      {t("social.currentSong")}
                    </button>
                  )}
                </>
              )}
              <span title={t("social.public")}>
                <Globe2 className="size-3.5 text-content-muted" />
              </span>
            </div>
            <div className={s.row}>
              <span
                className={s.counter + (length > 140 ? " text-destructive!" : "")}
                aria-live="polite"
              >
                {length}/140
              </span>
              <button
                type="submit"
                className={s.button + " " + s.primary}
                disabled={
                  mutation.isPending || length > 140 || (!text.trim() && !resource && !forwarded)
                }
              >
                {t(
                  mutation.isPending
                    ? "social.publishing"
                    : forwarded
                      ? "social.forward"
                      : "social.publish",
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
      <SocialResourcePicker open={picker} onClose={() => setPicker(false)} onSelect={setResource} />
    </>
  );
}

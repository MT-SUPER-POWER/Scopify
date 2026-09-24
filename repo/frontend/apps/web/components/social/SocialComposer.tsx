"use client";

import { Globe2, Music2, Search, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { useSocialPublish } from "@/hooks/social/useSocialActions";
import { useSocialAccount, useSocialResourceSearch } from "@/hooks/social/useSocialQueries";
import { useRequireLoginAction } from "@/lib/hooks/useRequireLoginAction";
import { usePlayerStore } from "@/store/module/player";
import { useUserStore } from "@/store/module/user";
import { useI18n } from "@/store/module/i18n";
import type { SocialComposerProps, SocialResourcePickerProps } from "@/types/components/social";
import type { SocialResource } from "@/types/social";
import { SocialAvatar, SocialState } from "./SocialPrimitives";
import { SocialResourceCard } from "./SocialResourceCard";
import s from "./Social.module.css";

export function SocialResourcePicker({ open, onClose, onSelect }: SocialResourcePickerProps) {
  const { t } = useI18n();
  const [input, setInput] = useState(""),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState<"song" | "playlist">("song");
  const result = useSocialResourceSearch(query, kind, open);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className={s.dialog + " sm:max-w-xl"}>
        <DialogTitle>{t("social.chooseMusic")}</DialogTitle>
        <DialogDescription className="sr-only">{t("social.searchMusic")}</DialogDescription>
        <form
          className={s.search}
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input.trim());
          }}
        >
          <Search />
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={t("social.searchMusic")}
            placeholder={t("social.searchMusic")}
          />
          <button type="submit" className={s.textButton} disabled={!input.trim()}>
            {t("social.search")}
          </button>
        </form>
        <div className={s.tabs}>
          {(["song", "playlist"] as const).map((item) => (
            <button
              type="button"
              key={item}
              className={s.tab}
              data-active={kind === item}
              onClick={() => setKind(item)}
            >
              {t(item === "song" ? "social.song" : "social.playlist")}
            </button>
          ))}
        </div>
        {query && (
          <SocialState
            loading={result.isPending}
            error={result.isError}
            onRetry={() => void result.refetch()}
            empty={!result.data?.length ? t("social.emptySearch") : undefined}
          >
            <div>
              {result.data?.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={s.person + " w-full text-left"}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <span className={s.cover}>
                    {item.cover ? <img src={item.cover} alt="" loading="lazy" /> : <Music2 />}
                  </span>
                  <span className={s.personText}>
                    <strong>{item.name}</strong>
                    <p>{item.subtitle}</p>
                  </span>
                </button>
              ))}
            </div>
          </SocialState>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function SocialComposer({ forwarded, onDone }: SocialComposerProps) {
  const { t } = useI18n(),
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

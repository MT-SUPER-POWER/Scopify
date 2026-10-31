"use client";

import { Music2, Search } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocialResourceSearch } from "@/hooks/social/useSocialQueries";
import { useSocialPickerPlaylists } from "@/hooks/social/useSocialPickerPlaylists";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";

import type { SocialResourcePickerProps } from "@/types/social/components";
import { SocialState } from "./SocialPrimitives";
import s from "./Social.module.css";

const KINDS = ["song", "playlist"] as const;

export function SocialResourcePicker({ open, onClose, onSelect }: SocialResourcePickerProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState(""),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState<(typeof KINDS)[number]>("song");
  const result = useSocialResourceSearch(query, "song", open && kind === "song");
  const playlists = useSocialPickerPlaylists();
  const keyword = input.trim().toLocaleLowerCase();
  const items =
    kind === "song"
      ? result.data
      : playlists.data
          ?.filter((playlist) => playlist.name.toLocaleLowerCase().includes(keyword))
          .map((playlist) => ({
            id: String(playlist.id),
            kind: "playlist" as const,
            name: playlist.name,
            subtitle: playlist.creator.nickname,
            cover: playlist.coverImgUrl,
          }));
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className={s.dialog + " " + s.pickerDialog + " sm:max-w-xl"}>
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
        <div className={s.segmented + " " + s.pickerKinds} role="group">
          {KINDS.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={kind === item}
              onClick={() => setKind(item)}
            >
              {t(item === "song" ? "social.song" : "social.playlist")}
            </button>
          ))}
        </div>
        {(kind === "playlist" || query) && (
          <SocialState
            loading={
              kind === "song"
                ? result.isPending
                : playlists.data === undefined && playlists.fetchStatus === "fetching"
            }
            error={
              kind === "song" ? result.isError : playlists.data === undefined && playlists.isError
            }
            onRetry={kind === "song" ? () => void result.refetch() : undefined}
            empty={items !== undefined && !items.length ? t("social.emptySearch") : undefined}
          >
            <ScrollArea
              viewportClassName={`overscroll-contain [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full ${s.pickerViewport}`}
            >
              <ul className={s.pickerList}>
                {items?.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={s.pickerRow}
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                    >
                      <span className={s.pickerCover}>
                        {item.cover ? (
                          <img
                            src={getSizedImageUrl(item.cover, 96)}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Music2 />
                        )}
                      </span>
                      <span className={s.pickerText}>
                        <strong>{item.name}</strong>
                        <span>{item.subtitle}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </SocialState>
        )}
      </DialogContent>
    </Dialog>
  );
}

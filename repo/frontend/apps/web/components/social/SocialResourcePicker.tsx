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
import { cn } from "@/lib/utils";
import {
  socialDialogClass,
  socialSearchClass,
  socialSearchInputClass,
  socialSegmentedButtonClass,
  socialSegmentedClass,
  socialTextButtonClass,
} from "./socialClasses";

const pickerEllipsisClass = "block truncate";

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
      <DialogContent
        className={cn(
          socialDialogClass,
          "grid-cols-[minmax(0,1fr)] gap-3.5 overflow-hidden sm:max-w-xl",
        )}
      >
        <DialogTitle>{t("social.chooseMusic")}</DialogTitle>
        <DialogDescription className="sr-only">{t("social.searchMusic")}</DialogDescription>
        <form
          className={cn(
            socialSearchClass,
            "m-0 py-2 pr-2 pl-3.5 focus-within:border-[color:color-mix(in_srgb,var(--primary)_55%,transparent)]",
          )}
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input.trim());
          }}
        >
          <Search />
          <input
            autoFocus
            className={cn(socialSearchInputClass, "focus-visible:outline-none!")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label={t("social.searchMusic")}
            placeholder={t("social.searchMusic")}
          />
          <button
            type="submit"
            className={cn(socialTextButtonClass, "rounded-full px-3 py-1 font-[650]")}
            disabled={!input.trim()}
          >
            {t("social.search")}
          </button>
        </form>
        <div className={cn(socialSegmentedClass, "justify-self-start")} role="group">
          {KINDS.map((item) => (
            <button
              type="button"
              key={item}
              className={socialSegmentedButtonClass}
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
              viewportClassName={`overscroll-contain [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full max-h-[min(52dvh,25rem)]`}
            >
              <ul className="list-none pr-2">
                {items?.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3.5 rounded-[8px] px-2.5 py-2 text-left hover:bg-foreground/8 focus-visible:-outline-offset-2!"
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-secondary text-muted-foreground [&_img]:size-full [&_img]:object-cover [&_svg]:size-5">
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
                      <span className="min-w-0 flex-1">
                        <strong className={cn(pickerEllipsisClass, "text-[14px] font-[650]")}>
                          {item.name}
                        </strong>
                        <span
                          className={cn(
                            pickerEllipsisClass,
                            "mt-0.5 text-[12px] text-muted-foreground",
                          )}
                        >
                          {item.subtitle}
                        </span>
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

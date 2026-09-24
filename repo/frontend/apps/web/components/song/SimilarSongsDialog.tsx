"use client";
import { LoaderCircle, X } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { SimilarSongRow } from "@/components/song/SimilarSongRow";
import { useSimilarSongs } from "@/hooks/song/useSimilarSongs";
import { useI18n } from "@/store/module/i18n";
import type { SimilarSongsDialogProps } from "@/types/components/similarSongs";

export function SimilarSongsDialog({ song, open, onOpenChange }: SimilarSongsDialogProps) {
  const { t } = useI18n();
  const query = useSimilarSongs(song.id, open);
  const songs = query.data ?? [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <DialogHeader className="shrink-0 border-b p-5 pr-12 text-left">
          <DialogTitle>{t("song.similar.action")}</DialogTitle>
          <DialogDescription>
            {t("song.similar.description", { name: song.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3"
            aria-label={t("song.similar.close")}
          >
            <X className="size-4" />
          </Button>
        </DialogClose>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
          aria-busy={query.isFetching}
        >
          {query.isPending ? (
            <div
              role="status"
              className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <LoaderCircle className="size-4 animate-spin" />
              {t("song.similar.loading")}
            </div>
          ) : query.isError ? (
            <div
              role="alert"
              className="flex min-h-40 flex-col items-center justify-center gap-3 p-5"
            >
              <p className="text-sm text-muted-foreground">{t("song.similar.error")}</p>
              <Button
                variant="outline"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t("song.similar.retry")}
              </Button>
            </div>
          ) : songs.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t("song.similar.empty")}
            </p>
          ) : (
            <ul className="space-y-1">
              {songs.map((item) => (
                <li key={item.id}>
                  <SimilarSongRow song={item} songs={songs} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {!query.isPending && !query.isError && (
          <p className="shrink-0 border-t px-5 py-3 text-xs text-muted-foreground">
            {t("song.similar.count", { count: songs.length })}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

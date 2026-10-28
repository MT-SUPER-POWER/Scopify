"use client";

import { LoaderCircle, Search } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { Input } from "@scopify/ui/shadcn/components/input";
import { CLOUD_SONG_FALLBACK_COVER } from "@/constants/cloud";
import { useCloudMatchSearch } from "@/hooks/library/useCloudMatchSearch";
import { cn, formatDuration } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { CloudMatchDialogProps } from "@/types/library/components";

export function CloudMatchDialog({ busy, onClose, onConfirm, song }: CloudMatchDialogProps) {
  const { t } = useI18n();
  const { candidates, isLoading, query, search, selectedId, setQuery, setSelectedId } =
    useCloudMatchSearch(song);

  return (
    <Dialog
      open={song !== null}
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{t("library.cloud.match")}</DialogTitle>
          <DialogDescription>
            {t("library.cloud.matchHint", { name: song?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void search(query);
          }}
        >
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("library.cloud.matchPlaceholder")}
            autoFocus
          />
          <Button
            type="submit"
            variant="secondary"
            size="icon"
            aria-label={t("library.cloud.matchSearch")}
          >
            {isLoading ? <LoaderCircle className="animate-spin" /> : <Search />}
          </Button>
        </form>
        <div className="-mx-2 max-h-80 min-h-40 overflow-y-auto">
          {!isLoading && candidates.length === 0 && (
            <p className="py-12 text-center text-sm text-content-muted">
              {t("library.cloud.matchEmpty")}
            </p>
          )}
          {candidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSelectedId(candidate.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors",
                candidate.id === selectedId ? "bg-content/10" : "hover:bg-content/5",
              )}
            >
              <img
                src={
                  candidate.coverUrl
                    ? `${candidate.coverUrl}?param=80y80`
                    : CLOUD_SONG_FALLBACK_COVER
                }
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 rounded object-cover"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-content">{candidate.name}</span>
                <span className="truncate text-xs text-content-muted">
                  {[candidate.artistNames.join(" / "), candidate.albumName]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="shrink-0 text-xs text-content-muted tabular-nums">
                {formatDuration(candidate.durationMs)}
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            {t("common.action.cancel")}
          </Button>
          <Button
            disabled={busy || selectedId === null}
            onClick={() => selectedId !== null && onConfirm(selectedId)}
          >
            {t("library.cloud.matchConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@scopify/ui/shadcn/components/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/store/module/i18n";
import type { SongResourcesDialogProps } from "@/types/songResources/components";
import { SongWikiSection } from "./SongWikiSection";
import { SongSheetsSection } from "./SongSheetsSection";

export function SongResourcesDialog({
  song,
  initialTab = "sheets",
  open,
  onOpenChange,
}: SongResourcesDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-5 overflow-hidden sm:max-w-2xl">
        <header className="pr-6">
          <DialogTitle className="text-xl leading-7">{song.name}</DialogTitle>
          <DialogDescription className="mt-2">
            {song.ar.map((artist) => artist.name).join(" / ")}
          </DialogDescription>
        </header>
        <Tabs
          key={`${song.id}:${initialTab}`}
          defaultValue={initialTab}
          className="flex min-h-0 flex-col"
        >
          <TabsList className="shrink-0 self-start">
            <TabsTrigger value="sheets">{t("songResources.sheets")}</TabsTrigger>
            <TabsTrigger value="wiki">{t("songResources.wiki")}</TabsTrigger>
          </TabsList>
          <ScrollArea
            className="mt-4 h-[min(60dvh,36rem)]"
            viewportClassName="overscroll-contain [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
          >
            <TabsContent value="sheets" className="mt-0 pr-3">
              <SongSheetsSection songId={song.id} />
            </TabsContent>
            <TabsContent value="wiki" className="mt-0 pr-3">
              <SongWikiSection songId={song.id} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

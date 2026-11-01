"use client";

import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Dialog, DialogOverlay, DialogPortal } from "@scopify/ui/shadcn/components/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UPDATES, UPDATES_UNRELEASED_KEY } from "@/constants/updates";
import { useUpdates } from "@/hooks/updates/useUpdates";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

import { UpdateReleaseContent } from "./UpdateReleaseContent";
import { UpdatesHeader } from "./UpdatesHeader";
import { UpdatesFooter } from "./UpdatesFooter";
import { UPDATES_DOC_FONTS_STYLE, UPDATES_DOC_THEME_CLASS } from "./updatesDocStyles";

const releaseKey = (version: string | null) => version ?? UPDATES_UNRELEASED_KEY;
// Dev builds open on the unreleased preview so new commits can be checked right away.
const defaultRelease =
  UPDATES.releases.find((item) => item.version === null) ??
  UPDATES.releases.find((item) => item.version === UPDATES.currentVersion) ??
  UPDATES.releases[0];
const DEFAULT_RELEASE = defaultRelease
  ? releaseKey(defaultRelease.version)
  : UPDATES.currentVersion;

export function WhatsNewModal() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { isOpen, close } = useUpdates();
  const { t } = useTranslation();
  const [selected, setSelected] = useState(DEFAULT_RELEASE);
  const release = UPDATES.releases.find((item) => releaseKey(item.version) === selected);
  const dismiss = () => {
    close();
    setSelected(DEFAULT_RELEASE);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="z-260 bg-[rgb(20_16_12/55%)] backdrop-blur-[3px]" />
        <DialogPrimitive.Content
          ref={dialogRef}
          className={cn(
            UPDATES_DOC_THEME_CLASS,
            "fixed top-1/2 left-1/2 z-261 flex max-h-[min(700px,calc(100dvh-48px))] w-[min(560px,calc(100vw-32px))] -translate-1/2 flex-col overflow-hidden rounded-[14px] border border-(--doc-border) bg-(--doc-bg) font-(family-name:--doc-font-body) text-(--doc-text) antialiased shadow-[0_24px_60px_rgb(0_0_0/28%)] outline-none",
            // Rise in by 8px; the centering lives on `translate`, so the enter transform stacks on it.
            "duration-180 ease-[cubic-bezier(0.2,0.9,0.3,1)] motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:slide-in-from-bottom-2",
          )}
          style={UPDATES_DOC_FONTS_STYLE}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            dialogRef.current?.focus();
          }}
        >
          <UpdatesHeader release={release} onClose={dismiss} />
          <ScrollArea
            key={selected}
            className="flex min-h-0 flex-[0_1_auto] flex-col overflow-hidden border-t border-(--doc-border)"
            viewportClassName="h-auto max-h-[min(500px,calc(100dvh-250px))] min-h-0 flex-[0_1_auto] overscroll-contain"
            aria-label={t("updates.title")}
          >
            {release?.entries.length ? (
              <UpdateReleaseContent release={release} />
            ) : (
              <p className="m-0 px-9 pt-5 pb-8 text-[15px] text-(--doc-muted) italic max-[440px]:px-5">
                {t("updates.empty")}
              </p>
            )}
          </ScrollArea>
          <UpdatesFooter releaseKey={selected} onReleaseChange={setSelected} onClose={dismiss} />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

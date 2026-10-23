"use client";

import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Dialog, DialogOverlay, DialogPortal } from "@scopify/ui/shadcn/components/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UPDATES, UPDATES_UNRELEASED_KEY } from "@/constants/updates";
import { useUpdates } from "@/hooks/updates/useUpdates";
import { useI18n } from "@/store/module/i18n";
import { UpdateReleaseContent } from "./UpdateReleaseContent";
import { UpdatesHeader } from "./UpdatesHeader";
import { UpdatesFooter } from "./UpdatesFooter";
import styles from "./WhatsNewModal.module.css";

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
  const { t } = useI18n();
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
        <DialogOverlay className={styles.overlay} />
        <DialogPrimitive.Content
          ref={dialogRef}
          className={styles.dialog}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            dialogRef.current?.focus();
          }}
        >
          <UpdatesHeader release={release} onClose={dismiss} />
          <ScrollArea key={selected} className={styles.scrollArea} aria-label={t("updates.title")}>
            {release?.entries.length ? (
              <UpdateReleaseContent release={release} />
            ) : (
              <p className={styles.empty}>{t("updates.empty")}</p>
            )}
          </ScrollArea>
          <UpdatesFooter releaseKey={selected} onReleaseChange={setSelected} onClose={dismiss} />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

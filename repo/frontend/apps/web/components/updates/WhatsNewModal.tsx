"use client";

import { useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Dialog, DialogOverlay, DialogPortal } from "@scopify/ui/shadcn/components/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UPDATES, UPDATES_PAGE_SIZE } from "@/constants/updates";
import { useUpdates } from "@/hooks/updates/useUpdates";
import { useI18n } from "@/store/module/i18n";
import { UpdateReleaseContent } from "./UpdateReleaseContent";
import { UpdatesHeader } from "./UpdatesHeader";
import { UpdatesFooter } from "./UpdatesFooter";
import styles from "./WhatsNewModal.module.css";

export function WhatsNewModal() {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { isOpen, close } = useUpdates();
  const { t } = useI18n();
  const [version, setVersion] = useState(UPDATES.currentVersion);
  const [page, setPage] = useState(0);
  const release = UPDATES.releases.find((item) => item.version === version);
  const total = Math.max(1, Math.ceil((release?.entries.length ?? 0) / UPDATES_PAGE_SIZE));
  const dismiss = () => {
    close();
    setVersion(UPDATES.currentVersion);
    setPage(0);
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
          <UpdatesHeader version={version} release={release} onClose={dismiss} />
          <ScrollArea
            key={`${version}:${page}`}
            className={styles.scrollArea}
            type="always"
            aria-label={t("updates.title")}
          >
            {release ? (
              <UpdateReleaseContent release={release} page={page} />
            ) : (
              <p className={styles.content}>{t("updates.empty")}</p>
            )}
          </ScrollArea>
          <UpdatesFooter
            version={version}
            page={page}
            total={total}
            onPageChange={setPage}
            onVersionChange={(nextVersion) => {
              setVersion(nextVersion);
              setPage(0);
            }}
          />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

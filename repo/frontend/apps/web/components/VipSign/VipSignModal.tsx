"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { VipSignModalProps } from "@/types/components/vipSign";
import { VipSignTicket } from "./VipSignTicket";
import styles from "./VipSignTicket.module.css";

export function VipSignModal({ open, onClose, todayRecord }: VipSignModalProps) {
  const { t } = useI18n();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.backdrop} />
        <Dialog.Content className={styles.dialog} aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{t("vipSign.ticketTitle")}</Dialog.Title>
          <Dialog.Close className={styles.close} aria-label={t("common.action.close")}>
            <X size={22} />
          </Dialog.Close>
          <VipSignTicket
            key={todayRecord?.recordId ?? "today"}
            todayRecord={todayRecord}
            onClose={onClose}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

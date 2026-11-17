"use client";

import { Radio } from "lucide-react";
import { useTranslation } from "react-i18next";

import { openQueueRadioWall } from "@/store/module/lattice";

export function QueueRadioWallButton() {
  const { t } = useTranslation();
  const label = t("playlist.view.radio");

  return (
    <button
      type="button"
      onClick={openQueueRadioWall}
      title={label}
      aria-label={label}
      className="rounded-full p-1.5 text-content-muted transition-colors hover:bg-content/10 hover:text-content focus-visible:outline-2 focus-visible:outline-brand"
    >
      <Radio className="size-4" />
    </button>
  );
}

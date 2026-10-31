"use client";

import { FoliaPopover } from "@scopify/ui/scopify/components/folia-panel/popover";
import { FoliaPictureChecks } from "@scopify/ui/scopify/components/folia-panel/picture-grid";
import { FoliaPickerMoreButton } from "@scopify/ui/scopify/components/folia-panel/mode-stepper-row";
import { drawPoolPicture } from "@/components/lyrics/FoliaPanelModePictures";
import { useTranslation } from "react-i18next";

import type { FoliaRandomPoolPopoverProps } from "@/types/lyrics/components";

export function FoliaRandomPoolPopover({
  anchorRef,
  open,
  onClose,
  onOpenMore,
  pool,
}: FoliaRandomPoolPopoverProps) {
  const { t } = useTranslation();
  return (
    <FoliaPopover
      anchorRef={anchorRef}
      open={open}
      onClose={onClose}
      fill
      aria-label={t("folia.options.randomPool")}
      className="flex flex-col rounded-[14px] pt-2 pb-1"
    >
      <div className="mb-1 flex min-h-7 shrink-0 items-center justify-between gap-3 pr-3 pl-4">
        <span className="text-[13px] leading-5 font-semibold text-[color:var(--st-t2)]">
          {t("folia.options.randomPool")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-[color:var(--st-t3)]">{pool.countLabel}</span>
          <button
            type="button"
            disabled={pool.allOn}
            onClick={pool.selectAll}
            className="st-t-fast h-7 rounded-lg px-2 text-xs text-[color:var(--st-t2)] transition-colors enabled:hover:bg-[var(--st-fill)] enabled:hover:text-[color:var(--st-t1)] disabled:opacity-40"
          >
            {t("folia.options.randomVisualizerSelectAll")}
          </button>
        </span>
      </div>
      <div className="flex min-h-0 flex-col">
        <FoliaPictureChecks
          value={pool.modes}
          options={pool.options}
          picture={drawPoolPicture}
          columns={4}
          compact
          onChange={pool.setModes}
          least={1}
          onRefuse={pool.refuse}
          label={t("folia.options.randomPool")}
          maxHeight={300}
        />
      </div>
      <FoliaPickerMoreButton
        label={t("folia.ui.moreSettings")}
        onClose={onClose}
        onOpenMore={onOpenMore}
      />
    </FoliaPopover>
  );
}

"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuTrigger,
} from "@scopify/ui/shadcn/components/context-menu";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useFoliaPlaybackControlsStore } from "@/store/module/foliaPlaybackControls";
import type {
  FoliaCapsuleAction,
  FoliaCapsuleActionBinding,
  FoliaCapsuleSlotControlProps,
} from "@/types/player/foliaControls";

export const FOLIA_CAPSULE_BUTTON_CLASS =
  "grid size-9 shrink-0 place-items-center rounded-full outline-none transition-colors hover:bg-current/10 focus-visible:ring-2 focus-visible:ring-current aria-disabled:opacity-35 pointer-coarse:size-11";

export function FoliaCapsuleActionContents({ Icon, pressed }: FoliaCapsuleActionBinding) {
  return <Icon className={cn("size-4.5", pressed && "text-(--text-accent)")} aria-hidden="true" />;
}

export function FoliaCapsuleSlotControl({
  actions,
  slot,
  onMenuOpenChange,
}: FoliaCapsuleSlotControlProps) {
  const { t } = useTranslation();
  const actionId = useFoliaPlaybackControlsStore((state) => state.capsuleSlots[slot]);
  const setCapsuleSlot = useFoliaPlaybackControlsStore((state) => state.setCapsuleSlot);
  const action = actions[actionId];
  return (
    <ContextMenu onOpenChange={onMenuOpenChange}>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          aria-label={action.label}
          aria-disabled={action.enabled === false}
          aria-pressed={action.pressed}
          title={action.label}
          className={FOLIA_CAPSULE_BUTTON_CLASS}
          onClick={(event) => {
            event.stopPropagation();
            if (action.enabled !== false) action.run(event);
          }}
        >
          <FoliaCapsuleActionContents {...action} />
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="z-160">
        <ContextMenuLabel>{t("folia.floatingControls.changeAction")}</ContextMenuLabel>
        <ContextMenuRadioGroup
          value={actionId}
          onValueChange={(value) => setCapsuleSlot(slot, value as FoliaCapsuleAction)}
        >
          {Object.entries(actions).map(([id, option]) => (
            <ContextMenuRadioItem key={id} value={id}>
              <option.Icon aria-hidden="true" />
              {option.label}
            </ContextMenuRadioItem>
          ))}
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

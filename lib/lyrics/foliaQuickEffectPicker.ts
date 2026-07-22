import type { FoliaQuickEffectPickerPosition } from "@/types/foliaStage";

const MENU_MAX_HEIGHT = 180;
const MENU_WIDTH = 116;
const MENU_GAP = 8;
const VIEWPORT_MARGIN = 12;

export function getFoliaQuickEffectPickerPosition(
  triggerRect: DOMRect,
  optionCount: number,
  viewportWidth: number,
  viewportHeight: number,
): FoliaQuickEffectPickerPosition {
  const idealHeight = Math.min(MENU_MAX_HEIGHT, Math.max(72, optionCount * 32 + 12));
  const spaceAbove = Math.max(0, triggerRect.top - VIEWPORT_MARGIN - MENU_GAP);
  const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom - VIEWPORT_MARGIN - MENU_GAP);
  const opensUpward = spaceBelow < idealHeight && spaceAbove > spaceBelow;
  const maxHeight = Math.min(idealHeight, opensUpward ? spaceAbove : spaceBelow);
  const top = opensUpward ? triggerRect.top - maxHeight - MENU_GAP : triggerRect.bottom + MENU_GAP;
  const width = Math.min(MENU_WIDTH, Math.max(0, viewportWidth - VIEWPORT_MARGIN * 2));
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(
      Math.max(VIEWPORT_MARGIN, triggerRect.right - width),
      viewportWidth - width - VIEWPORT_MARGIN,
    ),
  );

  return { left, maxHeight, opensUpward, top, width };
}

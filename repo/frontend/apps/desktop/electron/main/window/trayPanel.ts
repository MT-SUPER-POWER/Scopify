import type { Point, Rectangle } from "electron";
import type { TrayPanelOptions } from "@/types/tray";

const INPUT_SETTLE_MS = 250;
const MARGIN = 8;

/** 以点击点为锚点；空间不足时翻转，最后约束到当前屏幕工作区。坐标均为 DIP。 */
export function getTrayPanelPosition(point: Point, size: number[], area: Rectangle): Point {
  const [width, height] = size;
  const right = area.x + area.width;
  const bottom = area.y + area.height;
  const x =
    point.x + MARGIN + width <= right - MARGIN ? point.x + MARGIN : point.x - width - MARGIN;
  const y =
    point.y + MARGIN + height <= bottom - MARGIN ? point.y + MARGIN : point.y - height - MARGIN;
  // 极小工作区无法容纳整个窗口时至少保留左上角可见。
  const minX = area.x + Math.min(MARGIN, Math.max(0, (area.width - width) / 2));
  const minY = area.y + Math.min(MARGIN, Math.max(0, (area.height - height) / 2));
  return {
    x: Math.round(Math.max(minX, Math.min(x, right - width - MARGIN))),
    y: Math.round(Math.max(minY, Math.min(y, bottom - height - MARGIN))),
  };
}

/** 合并重复右键，并给系统托盘的焦点转移留出时间，避免 hide/show 闪烁。 */
export function createTrayPanelController({ window, getWorkArea }: TrayPanelOptions) {
  let ready = false;
  let pendingPoint: Point | null = null;
  let blurTimer: ReturnType<typeof setTimeout> | undefined;

  const cancelBlur = () => {
    clearTimeout(blurTimer);
    blurTimer = undefined;
  };
  const hide = () => {
    cancelBlur();
    pendingPoint = null;
    if (!window.isDestroyed()) window.hide();
  };
  const reveal = () => {
    if (!ready || !pendingPoint || window.isDestroyed()) return;
    const point = pendingPoint;
    pendingPoint = null;
    const position = getTrayPanelPosition(point, window.getSize(), getWorkArea(point));
    window.setPosition(position.x, position.y, true);
    window.show();
    window.focus();
  };

  return {
    requestOpen(point: Point) {
      if (window.isDestroyed()) return;
      cancelBlur();
      if (window.isVisible()) return;
      pendingPoint ??= { ...point };
      reveal();
    },
    markReady() {
      ready = true;
      reveal();
    },
    blur() {
      cancelBlur();
      blurTimer = setTimeout(() => {
        blurTimer = undefined;
        if (!window.isDestroyed() && !window.isFocused()) hide();
      }, INPUT_SETTLE_MS);
    },
    hide,
    dispose() {
      cancelBlur();
      pendingPoint = null;
    },
  };
}

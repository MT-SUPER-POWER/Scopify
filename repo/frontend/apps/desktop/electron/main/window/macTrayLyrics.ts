import type { MacTrayLyricBitmap } from "@/types/tray";

const HOLD_MS = 1200;
/** @2x 像素/毫秒，即每秒 24pt；每帧最多移动约半个逻辑像素。 */
const PIXELS_PER_MS = 0.048;
const FRAME_MS = 1000 / 60;

/** 固定宽度内按像素平移，首尾停留；由播放时钟驱动以支持暂停。 */
export function getMacTrayLyricFrame(distance: number, elapsedMs: number) {
  if (distance <= 0) return { offset: 0, nextUpdateMs: null };
  const travelMs = distance / PIXELS_PER_MS;
  const cycleMs = HOLD_MS * 2 + travelMs;
  const phase = Math.max(0, elapsedMs) % cycleMs;
  if (phase < HOLD_MS) return { offset: 0, nextUpdateMs: HOLD_MS - phase };
  if (phase >= HOLD_MS + travelMs) return { offset: distance, nextUpdateMs: cycleMs - phase };
  return { offset: (phase - HOLD_MS) * PIXELS_PER_MS, nextUpdateMs: FRAME_MS };
}

/** 从已排版的整行位图裁切固定视口，避免逐字替换造成宽度跳动。 */
export function cropMacTrayLyric(bitmap: MacTrayLyricBitmap, offset: number) {
  const left = Math.max(0, Math.min(bitmap.width - bitmap.viewportWidth, Math.round(offset)));
  const stride = bitmap.viewportWidth * 4;
  const pixels = Buffer.alloc(stride * bitmap.height);
  for (let row = 0; row < bitmap.height; row += 1) {
    const start = (row * bitmap.width + left) * 4;
    bitmap.pixels.copy(pixels, row * stride, start, start + stride);
  }
  return pixels;
}

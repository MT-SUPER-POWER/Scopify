import { LANDING_CHAPTERS } from "@/constants/marketing";
import { writePaletteRgb } from "@/lib/marketing/landing-palette";
import { createSoundFieldRenderer } from "@/lib/marketing/sound-field-renderer";

const COVER_SIZE = 768;
/** 定格的时间点：流动到这一秒时，丝带正好斜穿画面。 */
const COVER_TIME = 42;
const COVER_PALETTE = LANDING_CHAPTERS[0]!.palette;
const COVER_FILTER = "brightness(1.55) saturate(1.2) contrast(1.05)";

let cachedCover: string | null | undefined;

/**
 * 把落地页的声场着色器定格成一张方形封面，交给莫奈、凝彩、时计、群唱这些
 * 需要封面图的 Folia 动画，让舞台上的「画作」与整页背景同出一源。
 * 不支持 WebGL2 时返回 null，由调用方换成 Logo。
 */
export function renderSoundFieldCover(): string | null {
  if (cachedCover !== undefined) return cachedCover;
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  const renderer = createSoundFieldRenderer(canvas);
  if (!renderer) {
    cachedCover = null;
    return cachedCover;
  }

  const palette = new Float32Array(12);
  writePaletteRgb(COVER_PALETTE, palette);
  renderer.resize(COVER_SIZE, COVER_SIZE);
  renderer.render({
    drift: 0,
    intensity: 1,
    palette,
    pointer: [0, 0],
    spotlight: 0,
    time: COVER_TIME,
  });
  // 必须在同一个任务里读出像素，绘制缓冲区在合成后会被清空。
  // 作为背景它压得很暗，当作画作要提亮一些、颜色更饱满。
  const painting = document.createElement("canvas");
  painting.width = COVER_SIZE;
  painting.height = COVER_SIZE;
  const context = painting.getContext("2d");
  if (context) {
    context.filter = COVER_FILTER;
    context.drawImage(canvas, 0, 0);
  }
  cachedCover = (context ? painting : canvas).toDataURL("image/jpeg", 0.92);
  renderer.dispose();
  // 离屏画布用完即释放上下文，避免挤占页面上声场画布的 WebGL 名额。
  canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
  return cachedCover;
}

import { BrowserWindow, nativeImage } from "electron";
import type { MacTrayLyricBitmap } from "@/types/tray";

let renderer: BrowserWindow | null = null;
let ready: Promise<void> | null = null;

/** 仅在歌词变化时排版一次，滚动帧复用位图，不反复测量或创建窗口。 */
export async function renderMenuBarText(text: string): Promise<MacTrayLyricBitmap> {
  if (!renderer || renderer.isDestroyed()) {
    renderer = new BrowserWindow({
      show: false,
      width: 1,
      height: 1,
      skipTaskbar: true,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
    });
    renderer.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    ready = renderer.loadURL("data:text/html,<meta charset=utf-8>");
  }
  const window = renderer;
  await ready;
  if (window.isDestroyed()) throw new Error("Menu bar text renderer disposed");
  const dataUrl: string = await window.webContents.executeJavaScript(`(() => {
    const text = ${JSON.stringify(text)};
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
    context.font = font;
    const width = Math.min(16384, Math.ceil(context.measureText(text).width * 2) + 4);
    canvas.width = Math.max(2, width);
    canvas.height = 36;
    context.scale(2, 2);
    context.font = font;
    context.fillStyle = 'black';
    context.textBaseline = 'middle';
    context.fillText(text, 1, 9);
    return canvas.toDataURL('image/png');
  })()`);
  const image = nativeImage.createFromDataURL(dataUrl);
  if (image.isEmpty()) throw new Error("Menu bar text rasterization failed");
  const { width, height } = image.getSize();
  return { pixels: image.toBitmap(), width, height, viewportWidth: Math.min(width, 600) };
}

export function disposeMenuBarTextRenderer() {
  const window = renderer;
  renderer = null;
  ready = null;
  if (window && !window.isDestroyed()) window.destroy();
}

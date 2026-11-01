"use client";

import { domToCanvas } from "modern-screenshot";
import { useState, type RefObject } from "react";
import { toast } from "sonner";

const EXPORT_SCALE = 3;
const EXPORT_PADDING = 56;
const EXPORT_BACKGROUND = "#e8e4dc";

/** Draws the captured slip onto a warm counter backdrop with a soft drop shadow. */
function compose(receipt: HTMLCanvasElement) {
  const padding = EXPORT_PADDING * EXPORT_SCALE;
  const canvas = document.createElement("canvas");
  canvas.width = receipt.width + padding * 2;
  canvas.height = receipt.height + padding * 2;
  const context = canvas.getContext("2d");
  if (!context) return receipt;
  context.fillStyle = EXPORT_BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.shadowColor = "rgb(40 32 20 / 28%)";
  context.shadowBlur = 22 * EXPORT_SCALE;
  context.shadowOffsetY = 10 * EXPORT_SCALE;
  context.drawImage(receipt, padding, padding);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

/**
 * Turns the on-screen receipt into a shareable PNG. The capture ignores the live tilt,
 * print-in clip and glare, so the image is always the flat, fully printed slip.
 */
export function useReceiptImage(paper: RefObject<HTMLElement | null>, fileName: string) {
  const [isExporting, setIsExporting] = useState(false);

  async function render() {
    const node = paper.current;
    if (!node) throw new Error("Receipt is not mounted");
    // Layout size, not the on-screen box: the viewer may be zoomed or fitted to the window.
    const receipt = await domToCanvas(node, {
      height: node.offsetHeight,
      scale: EXPORT_SCALE,
      width: node.offsetWidth,
      style: { clipPath: "none", transform: "none" },
      filter: (child) =>
        !(child instanceof HTMLElement && "receiptCaptureExclude" in child.dataset),
    });
    return toBlob(compose(receipt));
  }

  async function run(task: () => Promise<void>) {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await task();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("[ListeningReport] receipt export failed", error);
      toast.error("小票图片生成失败，请稍后再试");
    } finally {
      setIsExporting(false);
    }
  }

  const save = () =>
    run(async () => {
      const url = URL.createObjectURL(await render());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  const share = () =>
    run(async () => {
      const blob = render();
      const file = new File([await blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      // Desktop browsers and Electron have no file share sheet: hand the image to the clipboard.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("小票图片已复制，粘贴即可发送给朋友");
    });

  return { isExporting, save, share };
}

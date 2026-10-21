let measureContext: CanvasRenderingContext2D | null = null;

/** 用 canvas 量文字宽度：伴随窗口要在渲染前就知道目标宽度，才能直接朝新宽度过渡或裁切命中区域。 */
export function measureTextWidth(text: string, font: string) {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext || !text) return 0;
  measureContext.font = font;
  return Math.ceil(measureContext.measureText(text).width);
}

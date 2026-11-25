// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import type { ScratchpadSection as ScratchpadTab } from "@/types/scratchpad/components";

// src/components/app/scratchpad/scratchpadLook.ts
// 速记簿 Bravais 样式的共用定义（设计稿：Claude Design 画布「速记簿 · Bravais 重设计」的 F 定稿）：
// 平面构成主义的纸与墨、点缀色，以及四页各自的几何体——速记簿圆、播放历史三角（尖朝上）、播放队列书名号「》」那样的双箭头、

// 几何体在边缘标签、面板、展开页的信息条装饰、设置页的小图里都用，形状只在这里算一次。纯函数，不碰 DOM。

/** 四页的先后：换页动画的方向、细纸带的上下、信息条上的编号（01–04）都按它。 */
export const SCRATCHPAD_TABS: readonly ScratchpadTab[] = ["notes", "history", "queue", "moments"];

export type ScratchpadShapeKind = "circle" | "tri" | "chev" | "bracket";

/** 信息条上一颗装饰：实心（点缀色）、线框、墨色、镂空（面板底下的黑）、或一张裁成这一页几何体的队列封面。 */
export type ScratchpadDecoStyle = "fill" | "wire" | "ink" | "hollow" | "image";

export type ScratchpadDeco = {
  /** 相对信息条左上角（px），可以探出条外，被条的边裁掉。 */
  x: number;
  y: number;
  size: number;
  style: ScratchpadDecoStyle;
  /** 转多少度。 */
  rotate: number;
};

const deco = (
  x: number,
  y: number,
  size: number,
  style: ScratchpadDecoStyle,
  rotate = 0,
): ScratchpadDeco => ({ x, y, size, style, rotate });

/** 固定种子的伪随机数（mulberry32）：装饰每次生成都一样。 */
const mulberry32 = (seed: number) => {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

const DECO_SEEDS: Record<ScratchpadTab, number> = {
  notes: 11,
  history: 23,
  queue: 37,
  moments: 53,
};
const SCATTER_STYLES: readonly ScratchpadDecoStyle[] = [
  "fill",
  "wire",
  "hollow",
  "image",
  "ink",
  "wire",
  "fill",
  "image",
  "hollow",
  "fill",
  "ink",
  "wire",
];
/** 信息条右端留给按钮的宽度（按钮宽度不同，装饰的右界跟着变；最右 220px 转出屏幕）。三行总览那一版右端只有短短一截。 */
const ACTION_ROOM: Record<"full" | "row", Record<ScratchpadTab, number>> = {
  full: { notes: 538, history: 488, queue: 448, moments: 448 },
  row: { notes: 538, history: 492, queue: 448, moments: 448 },
};
/** 信息条高度（含上下边）：展开整页 120px，三行总览 72px。 */
export const BAND_HEIGHTS = { full: 120, row: 72 } as const;

export const scatterBandDecos = (
  tab: ScratchpadTab,
  width: number,
  variant: "full" | "row" = "full",
): ScratchpadDeco[] => {
  const full = variant === "full";
  const random = mulberry32(DECO_SEEDS[tab] * (full ? 7 : 3));
  const inner = BAND_HEIGHTS[variant] - 7;
  const split = width - ACTION_ROOM[variant][tab];
  // 按钮上方那一截也不早于标题的右边（742px）：纸窄时（手机）按钮区的左沿会落到标题前面，装饰就压在标题与「‹ 三行总览」上。
  const zones: [number, number, number][] = full
    ? [
        [742, split, 99],
        [Math.max(split, 742), width - 220, 54],
      ]
    : [[650, split, 99]];
  const placed: ScratchpadDeco[] = [];
  for (let tries = 0; placed.length < (full ? 15 : 11) && tries < 600; tries += 1) {
    const style = SCATTER_STYLES[Math.floor(random() * SCATTER_STYLES.length)];
    const [x0, x1, yMax] = zones[random() < 0.82 || zones.length === 1 ? 0 : 1];
    const bottom = Math.min(yMax === 99 ? inner : yMax, inner);
    const inside = style === "wire" || style === "hollow";
    const maxSize = inside ? bottom - 8 : full ? 104 : 74;
    const minSize = style === "image" ? 34 : 12;
    const size = Math.round(
      minSize + Math.pow(random(), 1.7) * Math.max(0, Math.min(maxSize, full ? 96 : 66) - minSize),
    );
    if (size < minSize || x1 - x0 < size + 4) continue;
    const yLow = inside ? 4 : -Math.round(size * 0.45);
    const yHigh = inside
      ? bottom - 4 - size
      : yMax === 99
        ? Math.round(inner - size * 0.55)
        : bottom - size;
    if (yHigh < yLow) continue;
    const x = Math.round(x0 + random() * (x1 - x0 - size));
    const y = Math.round(yLow + random() * (yHigh - yLow));
    const hit = placed.some(
      (other) =>
        x < other.x + other.size + 6 &&
        x + size + 6 > other.x &&
        y < other.y + other.size + 6 &&
        y + size + 6 > other.y,
    );
    if (hit) continue;
    const rotate = tab === "notes" || tab === "moments" ? 0 : Math.round((random() - 0.5) * 56);
    // gen-f 在这里挑一张队列封面：照样取一个数，后面的位置才和设计稿一样。
    random();
    placed.push({ x, y, size, style, rotate });
  }
  return placed;
};

/** 收起的细纸带（36px 高）上的小装饰：随机撒几颗，大多在左半段（右半段转出屏幕、被播放胶囊挡住）。 */
export const scatterSlimDecos = (tab: ScratchpadTab): ScratchpadDeco[] => {
  const random = mulberry32(DECO_SEEDS[tab] * 13);
  const styles: ScratchpadDecoStyle[] = ["fill", "wire", "ink", "hollow"];
  const decos: ScratchpadDeco[] = [];
  let x = 500;
  while (x < 1300) {
    x += 30 + Math.round(random() * 70);
    const size = 10 + Math.round(random() * 12);
    const style = styles[Math.floor(random() * styles.length)];
    const y = Math.round(4 + random() * (29 - 8 - size));
    const rotate = tab === "notes" || tab === "moments" ? 0 : Math.round((random() - 0.5) * 40);
    decos.push({ x, y, size, style, rotate });
  }
  return decos;
};

export const SCRATCHPAD_PANEL_BAND_DECOS: Record<ScratchpadTab, readonly ScratchpadDeco[]> = {
  notes: [
    deco(240, -10, 26, "fill"),
    deco(270, 14, 30, "wire"),
    deco(308, -6, 40, "image"),
    deco(356, 22, 20, "hollow"),
    deco(376, -12, 30, "fill"),
    deco(326, 38, 14, "ink"),
  ],
  history: [
    deco(246, 8, 28, "wire", -14),
    deco(280, -12, 36, "image", 18),
    deco(322, 26, 18, "fill", -22),
    deco(346, -8, 30, "fill", 9),
    deco(382, 18, 22, "hollow", -6),
    deco(240, 40, 12, "ink", 25),
  ],
  queue: [
    deco(242, 12, 28, "fill", -8),
    deco(278, -10, 40, "image", 12),
    deco(326, 18, 24, "wire", -20),
    deco(356, -6, 22, "ink", 16),
    deco(380, 26, 18, "hollow"),
    deco(254, -12, 14, "fill", 24),
  ],
  moments: [
    deco(244, -8, 30, "fill"),
    deco(282, 16, 26, "wire"),
    deco(314, -10, 38, "image"),
    deco(358, 20, 22, "hollow"),
    deco(378, -12, 28, "ink"),
    deco(250, 34, 14, "fill"),
  ],
};

/** 每一页的几何体。 */
export const SCRATCHPAD_TAB_SHAPES: Record<ScratchpadTab, ScratchpadShapeKind> = {
  notes: "circle",
  history: "tri",
  queue: "chev",
  moments: "bracket",
};

type Point = readonly [number, number];

/** 几何体在 size × size 的方框里的多边形（圆用 36 边形近似）；「》」是两个分开的粗尖角；「」是左上、右下两个直角。 */
export const scratchpadShapePolygons = (kind: ScratchpadShapeKind, size: number): Point[][] => {
  if (kind === "circle") {
    const r = size / 2;
    return [
      Array.from({ length: 36 }, (_, k): Point => {
        const angle = (k / 36) * Math.PI * 2;
        return [r + r * Math.cos(angle), r + r * Math.sin(angle)];
      }),
    ];
  }
  if (kind === "tri")
    return [
      [
        [size / 2, 0],
        [size, size],
        [0, size],
      ],
    ];
  if (kind === "bracket") {
    // 两笔粗 0.2、长 0.56 / 0.72（设计稿 G 组的 bracket）。
    const stroke = size * 0.2;
    const arm = size * 0.56;
    const leg = size * 0.72;
    return [
      [
        [0, 0],
        [arm, 0],
        [arm, stroke],
        [stroke, stroke],
        [stroke, leg],
        [0, leg],
      ],
      [
        [size, size],
        [size - arm, size],
        [size - arm, size - stroke],
        [size - stroke, size - stroke],
        [size - stroke, size - leg],
        [size, size - leg],
      ],
    ];
  }
  const thickness = size * 0.22;
  const width = size * 0.56;
  const chevron = (dx: number): Point[] => [
    [dx, 0],
    [dx + thickness, 0],
    [dx + width, size / 2],
    [dx + thickness, size],
    [dx, size],
    [dx + width - thickness, size / 2],
  ];
  return [chevron(0), chevron(size - width)];
};

const fixed = (value: number) => Number(value.toFixed(2));

/** 同一组多边形写成一条 SVG path（M … Z M … Z）。 */
export const scratchpadShapePath = (kind: ScratchpadShapeKind, size: number): string =>
  scratchpadShapePolygons(kind, size)
    .map((polygon) => `M${polygon.map(([x, y]) => `${fixed(x)} ${fixed(y)}`).join(" L")} Z`)
    .join(" ");

/** 把一张封面裁成这个几何体的 CSS clip-path（size 是元素的边长，px）。 */
export const scratchpadShapeClipPath = (kind: ScratchpadShapeKind, size: number): string =>
  kind === "circle" ? "circle(50%)" : `path('${scratchpadShapePath(kind, size)}')`;

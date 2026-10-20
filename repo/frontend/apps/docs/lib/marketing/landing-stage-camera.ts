/** 歌词舞台的镜头语言：推镜头的放大曲线，以及对焦环的档位。 */

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** 起止都放缓的 smoothstep。 */
export const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * 镜头匀速推向画面时的放大倍数：到画面的距离线性缩短，画面按 1 / 距离 放大，
 * 所以越靠近放大得越快，像真的往前走，而不是把图片均匀拉大。
 */
export function approachScale(progress: number, from: number, to: number) {
  const distance = 1 / from + (1 / to - 1 / from) * clamp01(progress);
  return 1 / distance;
}

/** 档位的「手感」：越大越黏在档位上，跨档时转得越快。 */
const DETENT_SHARPNESS = 2.4;

/**
 * 对焦环的阻尼档位：输入是节目单上的连续位置（整数即对准某一档），
 * 输出仍在相邻两档之间连续变化，但会在每一档附近停留，跨档时快速转过。
 */
export function focusRingDetent(position: number) {
  const nearest = Math.round(position);
  const offset = position - nearest;
  return nearest + Math.sign(offset) * 0.5 * Math.abs(offset * 2) ** DETENT_SHARPNESS;
}

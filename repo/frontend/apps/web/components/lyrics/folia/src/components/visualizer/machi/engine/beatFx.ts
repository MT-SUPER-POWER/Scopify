// src/components/visualizer/machi/engine/beatFx.ts
// 町景在智能动感模式里的三个效果（纯函数，不碰 three）：
//   霓虹随拍 machi.neonPulse   <- beat_this 的整张节拍表：招牌霓虹分成三组，每拍轮到下一组，那组慢慢亮起、再慢慢暗下，
//                                别的组同时暗一点，此起彼伏，整条街的亮度不跟着一跳一跳；近白的灯箱只跟一小份（不然冲成白块）。
//                                店里的灯、亮窗（连同地上的光斑）只在小节第一拍慢慢涨落一点；bloom 跟三组的平均走。
//                                偏中高频的拍多亮霓虹、偏低频的小节第一拍多亮暖色的灯（按那拍的三段占比；没有重音数据时一样）。
//   鼓点涟漪 machi.drumRipple  <- htdemucs 分出的底鼓：每下底鼓从歌词屏脚下在湿地面上荡开一圈涟漪（扰动倒影、带一道亮环），
//                                最多同时四圈；地面干的时候改成地上的光斑跟着跳一下。
//   大屏闪拍 machi.screenFlash <- htdemucs 分出的军鼓：每下够响的军鼓在歌词屏的一处慢慢亮起、再慢慢暗下，先后几下落在不同的
//                                位置；军鼓再密也只是亮着起伏（叠起来有上限），不频闪。
// @note Scopify: 上游的三个效果读 beat_this 的节拍表与 htdemucs 分离出的鼓点（services/beatFx、services/analysis），
// Scopify 没有这两套数据，所以这里只留下一帧的量（常态值）、调好的参数与曲线；场景照常按它取值，画面就是效果关着的样子。

/** 霓虹分几组轮流。 */
export const MACHI_NEON_GROUPS = 3;

/** 一帧里三个效果交给场景、地面、歌词屏的量；常态见 createMachiBeatFrame。 */
export interface MachiBeatFrame {
  /** 每组霓虹的亮度倍数（1 是常态）；场景按招牌分组取（machiNeonGroup / machiLightboxGroup）。 */
  neonGroups: Float32Array;
  /** 三组霓虹的平均倍数：照到四周的霓虹光、雾里的霓虹灯晕这类分不开组的。 */
  neon: number;
  /** 店里的灯、亮窗（连同它们投在地上的光斑）的亮度倍数（1 是常态）。 */
  warm: number;
  /** bloom 强度的倍数（1 是常态）。 */
  bloom: number;
  /** 地面干时地上的光斑多亮的量（0 是常态；城寨的环境光跟着光斑走，也一起跳）。 */
  thump: number;
  /** 歌词屏上几处亮起的位置（0..1，屏幕左到右）与亮度（0 是没有）。 */
  swellAt: Float32Array;
  swellAmp: Float32Array;
}

/** 调好的样子（各效果强度 1 时）。 */
export const MACHI_BEAT = {
  /**
   * 霓虹随拍：每组亮起多久、暗下多久（秒）、亮起时涨多少、别的组跟着暗多少（按与平均的差）；小节第一拍再乘 downbeat。
   */
  neon: { attack: 0.4, fall: 1.5, lift: 0.2, contrast: 0.2, downbeat: 1.2 },
  /** 灯箱跟霓虹那一路的几成。 */
  lightbox: 0.3,
  /** 店里的灯：小节第一拍亮起多久、暗下多久、涨多少。 */
  warm: { attack: 0.6, fall: 2.2, lift: 0.08 },
  /** bloom 跟三组平均涨多少。 */
  bloom: 0.1,
  /**
   * 鼓点涟漪：环走多快（米 / 秒）、活多久（秒）、最多几圈；弱于 floor 的底鼓不算，两圈至少隔 gap 秒（max 圈正好排满 life，
   * 底鼓再密也没有哪圈没走完就被挤掉）。路面湿度在 wet 两个值之间时，环渐渐出来、光斑的一跳渐渐退掉（地面着色器用同一对值）。
   */
  ripple: {
    speed: 6.5,
    life: 1.3,
    max: 4,
    floor: 0.3,
    gap: 0.33,
    thump: 0.55,
    thumpDecay: 0.14,
    wet: [0.1, 0.6],
  },
  /**
   * 大屏闪拍：每处亮起多久、暗下多久（秒）；弱于 floor 的军鼓不算，两处至少隔 gap 秒（max 处正好排满 attack + fall）。
   */
  screen: { attack: 0.25, fall: 1.15, max: 4, floor: 0.4, gap: 0.35 },
} as const;

export const createMachiBeatFrame = (): MachiBeatFrame => ({
  neonGroups: new Float32Array(MACHI_NEON_GROUPS).fill(1),
  neon: 1,
  warm: 1,
  bloom: 1,
  thump: 0,
  swellAt: new Float32Array(MACHI_BEAT.screen.max).fill(0.5),
  swellAmp: new Float32Array(MACHI_BEAT.screen.max),
});

/** 改回常态（就地，每帧复用）。 */
export const resetMachiBeatFrame = (out: MachiBeatFrame) => {
  out.neonGroups.fill(1);
  out.neon = 1;
  out.warm = 1;
  out.bloom = 1;
  out.thump = 0;
  out.swellAt.fill(0.5);
  out.swellAmp.fill(0);
  return out;
};

/** 第 group 组招牌霓虹的亮度倍数。 */
export const machiNeonGroup = (beat: MachiBeatFrame, group: number) =>
  beat.neonGroups[group % MACHI_NEON_GROUPS]!;

/** 第 group 组近白的招牌灯箱（店招、价格立柱）：霓虹那一路的一小份。 */
export const machiLightboxGroup = (beat: MachiBeatFrame, group: number) =>
  1 + MACHI_BEAT.lightbox * (machiNeonGroup(beat, group) - 1);

/** 慢慢亮起、再慢慢暗下的一下（0..1）：前 attack 秒升上去，后 fall 秒落回来，两头都是缓的。 */
export const machiSwell = (age: number, attack: number, fall: number) => {
  if (age < 0 || age >= attack + fall) return 0;
  if (age < attack) {
    const u = age / attack;
    return u * u * (3 - 2 * u);
  }
  const u = (age - attack) / fall;
  return 1 - u * u * (3 - 2 * u);
};

/** 路面有多湿就有多少涟漪（0..1，与地面着色器里的 smoothstep 一样）；剩下的给光斑的一跳。 */
export const machiRippleWetness = (wetness: number) => {
  const [from, to] = MACHI_BEAT.ripple.wet;
  const t = Math.min(1, Math.max(0, (wetness - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

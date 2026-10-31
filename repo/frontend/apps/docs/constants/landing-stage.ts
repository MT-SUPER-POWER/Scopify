import type { LandingStageScene } from "@/types/marketing";

/**
 * 歌词舞台上每种动画的「这一场」：唱的两句词与这一场的灯光主色，按动画的 `value` 索引。
 * 按节目单顺序连起来是一整段主歌，往下滚就是往下唱，而不是一遍遍重复同一段词；
 * 节目单由静到闹，越往下灯越满，最绚烂的花火压轴。
 *
 * 这些字由 Folia 用它自己的字体渲染，不经过落地页的标题子集字体，
 * 所以单独放在这里，不放进标题字体会扫描的 marketing.ts。
 */
export const LANDING_STAGE_SCENES: Readonly<Record<string, LandingStageScene>> = {
  still: { accent: "#d6dbe6", verse: ["什么都不动，", "只有声音经过这里。"] },
  classic: { accent: "#7fd8ff", verse: ["光从这一句流过，", "照亮下一个字。"] },
  partita: { accent: "#dfe6ff", verse: ["一个音一级台阶，", "走到云的上面。"] },
  tilt: { accent: "#ff9cbc", verse: ["靠近一点，", "这句只说给你听。"] },
  cadenza: { accent: "#b69cff", verse: ["闭上眼睛，", "旋律有了形状。"] },
  fume: { accent: "#f2c38b", verse: ["名字像烟，", "升起来又散开。"] },
  claddagh: { accent: "#79eec0", verse: ["副歌绕回来，", "像一枚戒指扣上。"] },
  archive: { accent: "#d8c39d", verse: ["听过的每一首，", "都整齐地归档。"] },
  cappella: { accent: "#ffb08a", verse: ["你一句，我一句，", "整间屋子都在唱。"] },
  pendolo: { accent: "#e8c77a", verse: ["钟摆来回，", "每一拍都算数。"] },
  monet: { accent: "#8fb0ff", verse: ["把这一秒，", "画成睡莲的颜色。"] },
  nebbia: { accent: "#9fd4e8", verse: ["车窗起了雾，", "指尖写下这一句。"] },
  diorama: { accent: "#6fdfd6", verse: ["灯一层层亮起，", "字走上了舞台。"] },
  machi: { accent: "#ffa86b", verse: ["街角的招牌亮了，", "替我把这句唱完。"] },
  sonnet: { accent: "#ff8f8f", verse: ["十四行诗，", "写给今晚的耳朵。"] },
  tempera: { accent: "#ff7fd6", verse: ["再添一笔，", "颜色凝在纸上。"] },
  hanabi: { accent: "#ffcf4a", verse: ["夜空炸开的一瞬，", "整条河都亮了。"] },
};

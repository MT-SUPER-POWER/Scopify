import { Noto_Serif_SC } from "next/font/google";

/** 落地页标题用的中文衬线体；按 Google Fonts 的 unicode-range 分片按需加载。 */
export const landingSerifFont = Noto_Serif_SC({
  display: "swap",
  preload: false,
  variable: "--font-landing-serif",
  weight: ["400", "500", "600", "700"],
});

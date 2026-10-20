import localFont from "next/font/local";

/**
 * 落地页标题用的中文衬线体：只含落地页文案字符的 Noto Serif SC 可变字重子集，
 * 由 `pnpm --filter @scopify/docs generate:landing-font` 生成并随仓库提交，
 * 构建时不再依赖 Google Fonts。
 */
export const landingSerifFont = localFont({
  display: "swap",
  src: "../../assets/fonts/noto-serif-sc-landing.woff2",
  variable: "--font-landing-serif",
  weight: "400 700",
});

/**
 * 生成落地页标题用的 Noto Serif SC 子集字体。
 *
 * 从落地页组件与文案常量里收集用到的中文字符，通过 Google Fonts 的 `text=` 子集接口
 * 下载一份只含这些字形的可变字重（400–700）woff2，并写入对应字符表，
 * 测试会据此检查文案改动后是否需要重新生成。
 *
 * 之所以不用 `next/font/google`：中文字体会被拆成上百个分片，构建时全部下载且
 * 在样式表里生成大量 @font-face；Google 对中文偶尔返回无扩展名的 `/l/font?kit=` 地址，
 * 会让 next/font 在生产构建中直接报错。
 *
 * Noto Serif SC 以 SIL OFL 1.1 授权，许可证随字体放在 assets/fonts/OFL.txt。
 *
 * 用法：pnpm --filter @scopify/docs generate:landing-font
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  LANDING_FONT_FILE,
  LANDING_GLYPHS_FILE,
  LANDING_GLYPH_SOURCES,
  collectLandingGlyphs,
} from "../lib/marketing/landing-font-glyphs";

const APP_DIR = path.resolve(import.meta.dir, "..");
/** 让 Google 返回 woff2。 */
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function readLandingSources() {
  const componentDir = path.join(APP_DIR, LANDING_GLYPH_SOURCES.componentDir);
  const components = (await readdir(componentDir))
    .filter((name) => name.startsWith(LANDING_GLYPH_SOURCES.componentPrefix))
    .map((name) => path.join(componentDir, name));
  const files = [
    ...components,
    ...LANDING_GLYPH_SOURCES.files.map((file) => path.join(APP_DIR, file)),
  ];
  return Promise.all(files.map((file) => readFile(file, "utf8")));
}

const glyphs = collectLandingGlyphs(await readLandingSources());
const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400..700&display=swap&text=${encodeURIComponent(glyphs)}`;
const css = await (await fetch(cssUrl, { headers: { "User-Agent": USER_AGENT } })).text();
const fontUrl = /src: url\((.+?)\) format\('woff2'\)/.exec(css)?.[1];
if (!fontUrl) throw new Error(`Google Fonts 没有返回 woff2 地址：\n${css.slice(0, 400)}`);

const font = Buffer.from(await (await fetch(fontUrl)).arrayBuffer());
await mkdir(path.join(APP_DIR, path.dirname(LANDING_FONT_FILE)), { recursive: true });
await writeFile(path.join(APP_DIR, LANDING_FONT_FILE), font);
await writeFile(path.join(APP_DIR, LANDING_GLYPHS_FILE), `${glyphs}\n`);
console.log(
  `已写入 ${LANDING_FONT_FILE}（${glyphs.length} 个字符，${Math.round(font.length / 1024)} KB）`,
);

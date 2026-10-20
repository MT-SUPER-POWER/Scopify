import ts from "typescript";

/** 需要由标题字体覆盖的字符：中日韩标点、统一表意文字与全角符号。 */
const CJK_PATTERN = /[　-〿一-鿿＀-￯]/u;

/** 落地页文案所在的源码：所有 `landing-*` 组件与文案常量（相对文档应用根目录）。 */
export const LANDING_GLYPH_SOURCES = {
  componentDir: "components/marketing",
  componentPrefix: "landing-",
  files: ["constants/marketing.ts"],
} as const;

/** 子集字体与对应字符表的位置（相对文档应用根目录）。 */
export const LANDING_FONT_FILE = "assets/fonts/noto-serif-sc-landing.woff2";
export const LANDING_GLYPHS_FILE = "assets/fonts/noto-serif-sc-landing.txt";

/** 去掉注释：注释里的字不会出现在页面上，不该让子集字体为它们变大，也不该逼着重新生成。 */
const stripComments = (source: string) =>
  ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      removeComments: true,
      target: ts.ScriptTarget.ESNext,
    },
    fileName: "landing.tsx",
  }).outputText;

/** 从源码文本（不含注释）里收集字体需要的字符，并补上全部可打印 ASCII；结果排序去重，便于比对。 */
export function collectLandingGlyphs(sources: readonly string[]) {
  const glyphs = new Set<string>();
  for (let code = 0x20; code < 0x7f; code += 1) glyphs.add(String.fromCharCode(code));
  for (const source of sources) {
    for (const char of stripComments(source)) {
      if (CJK_PATTERN.test(char)) glyphs.add(char);
    }
  }
  return [...glyphs].sort().join("");
}

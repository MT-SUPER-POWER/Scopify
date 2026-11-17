// Determines the base direction from the first letter, ignoring punctuation, whitespace and digits.
export type LyricTextDirection = "ltr" | "rtl";

const RTL_LETTER_RE =
  /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}\p{Script=Yezidi}]/u;
const LETTER_RE = /\p{L}/u;

/** Resolves the base direction of a line. Embedded runs keep their own direction. */
export function resolveLyricTextDirection(text: string): LyricTextDirection {
  for (const char of text) {
    if (LETTER_RE.test(char)) {
      return RTL_LETTER_RE.test(char) ? "rtl" : "ltr";
    }
  }
  return "ltr";
}

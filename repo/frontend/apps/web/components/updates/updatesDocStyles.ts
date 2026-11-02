import type { CSSProperties } from "react";

// Reading style follows the "claude-like" Typora themes: warm paper, serif text.
// The palette is bespoke (it intentionally differs from the app theme), so it lives in
// --doc-* variables; the shadcn tokens are remapped so the Select inside the dialog
// (and its portalled menu) picks up the same palette.
export const UPDATES_DOC_THEME_CLASS = [
  "[--doc-bg:#f0e5d6] [--doc-text:#2b2621] [--doc-heading:#1c1815] [--doc-muted:#72695e]",
  "[--doc-border:#ddd5ca] [--doc-accent:#bc6a3a] [--doc-accent-hover:#a65a2e]",
  "[--doc-hover:rgb(194_113_62/8%)] [--doc-code:#b14a40] [--doc-code-bg:#f2eeea]",
  "[--doc-code-border:#d7cec5]",
  "dark:scheme-dark dark:[--doc-bg:#2b2824] dark:[--doc-text:#ddd6ce] dark:[--doc-heading:#f2e9df]",
  "dark:[--doc-muted:#aaa096] dark:[--doc-border:#48423b] dark:[--doc-accent:#d59567]",
  "dark:[--doc-accent-hover:#efb892] dark:[--doc-hover:rgb(213_149_103/10%)]",
  "dark:[--doc-code:#e1a092] dark:[--doc-code-bg:#3a332d] dark:[--doc-code-border:#594d43]",
  "[--popover:var(--doc-bg)] [--popover-foreground:var(--doc-text)] [--accent:var(--doc-hover)]",
  "[--accent-foreground:var(--doc-heading)] [--border:var(--doc-border)] [--input:var(--doc-border)]",
  "[--muted-foreground:var(--doc-muted)] [--ring:var(--doc-accent)]",
].join(" ");

export const UPDATES_DOC_FONTS_STYLE = {
  "--doc-font-body":
    '"Anthropic Serif", "Source Serif 4", Georgia, "Noto Serif SC", "Songti SC", "Source Han Serif SC", serif',
  "--doc-font-ui":
    '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", "Segoe UI", sans-serif',
  "--doc-font-mono": 'Menlo, Monaco, "SF Mono", Consolas, "Cascadia Code", monospace',
} as CSSProperties;

export const UPDATES_FOCUS_CLASS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--doc-accent)";

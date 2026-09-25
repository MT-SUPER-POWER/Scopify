import { cn } from "@/lib/utils";

/**
 * 社交模块响应式与布局样式
 * 采用纯 Tailwind 语法，集中在 styles/ 维护，避免直接散落写原生 CSS Module
 */
export const socialStyles = {
  /** 动态流/个人页面主容器 */
  page: cn("[container-type:inline-size] min-h-full", "px-7 pt-22 pb-12 text-foreground"),

  /** 双栏信息流网格布局 */
  feedLayout: "mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)_250px] gap-7",

  /** 主内容列 */
  main: "min-w-0",

  /** 右侧边栏 */
  rail: "ml-7 border-l border-foreground/10 pt-3 pl-7",

  /** 边栏分节 */
  railSection: "border-b border-foreground/10 pt-3 pb-6",
} as const;

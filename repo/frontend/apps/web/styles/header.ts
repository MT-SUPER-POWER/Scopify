import { cn } from "@/lib/utils";

/**
 * Header 组件的响应式与容器查询样式定义
 * 采用 Tailwind 语法，集中收敛在 styles/ 模块下统一维护
 */
export const headerStyles = {
  /** 根容器：声明容器查询上下文 (container-type: inline-size) */
  root: "@container",

  /** 全局返回始终保留，二级页面不再重复提供返回按钮。 */
  history: "shrink-0",

  /** 前进按钮：较小容器宽度下隐藏 */
  forward: "@max-[560px]:hidden",

  /** 搜索区域及其输入框嵌套层级样式收敛 */
  search: cn(
    "min-w-0",
    "[&>div]:min-w-0",
    "[&_input]:w-full [&_input]:min-w-0",
    "@max-[560px]:mx-0",
    "[&>div>div:first-child]:@max-[560px]:px-2.5",
    "[&>div>div:first-child]:@max-[560px]:gap-2",
  ),
} as const;

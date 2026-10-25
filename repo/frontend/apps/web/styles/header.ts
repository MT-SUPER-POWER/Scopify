import { cn } from "@/lib/utils";

/**
 * Header 组件的响应式与容器查询样式定义
 * 采用 Tailwind 语法，集中收敛在 styles/ 模块下统一维护
 */
export const headerStyles = {
  /**
   * 根容器：声明容器查询上下文，并为桌面端叠加在顶栏上的系统窗口按钮让位。
   * titlebar-area-* 由 Electron 的 Window Controls Overlay 提供（macOS 红绿灯在左、Windows 按钮在右）；
   * Web 端没有这些变量，回落为普通内边距。
   */
  root: cn(
    "@container",
    "pl-[max(0.5rem,calc(env(titlebar-area-x,0px)_-_0.5rem))]",
    "pr-[max(0.5rem,calc(100vw_-_env(titlebar-area-x,0px)_-_env(titlebar-area-width,100vw)))]",
  ),

  /**
   * 中间区域：绝对定位到顶栏边框盒中线（顶栏在窗口内左右对称），因而始终位于窗口正中；
   * 宽度上限留出两侧品牌与操作区的空间，最窄窗口下也不重叠。
   */
  center:
    "absolute top-1/2 left-1/2 flex w-[min(36rem,38cqw)] min-w-0 -translate-1/2 items-center justify-center gap-2",

  /** 顶栏整体是窗口拖拽区，可交互的分组需显式取消拖拽 */
  noDrag: "[-webkit-app-region:no-drag]",

  /** 全局返回始终保留，二级页面不再重复提供返回按钮。 */
  history: "shrink-0",

  /** 品牌字标：顶栏较窄时只保留圆标，把空间让给搜索框 */
  wordmark: "@max-[1080px]:hidden",

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

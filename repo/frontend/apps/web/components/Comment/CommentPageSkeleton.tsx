import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import type { CommentHeaderSkeletonProps } from "@/types/comment/components";

/** 每条评论的正文行数，错开长短。 */
const ROWS = [1, 2, 1, 3, 2, 1];
const LINE_WIDTHS = ["w-full", "w-11/12", "w-3/5"];

/** 行内骨架条：高度随所在文字字号走，行高仍由和真实组件相同的文字类决定。 */
function Bar({ className }: { className: string }) {
  return <Skeleton className={`inline-block h-[0.8em] bg-skeleton align-middle ${className}`} />;
}

/**
 * 评论页头部骨架：外层类与 CommentHeader 逐项一致。资源类型标签在请求前就已知，
 * 直接显示；封面、标题、歌手才是要等请求回来的内容。
 */
export function CommentHeaderSkeleton({ tagLabel }: CommentHeaderSkeletonProps) {
  return (
    <div
      aria-busy="true"
      className="relative z-10 flex flex-col items-start gap-6 px-6 pt-8 pb-6 md:flex-row md:px-8 lg:px-10 xl:px-12"
    >
      <Skeleton className="size-48 shrink-0 rounded-md bg-skeleton lg:size-56" />
      <div className="flex min-w-0 flex-1 flex-col pt-1 text-content md:pt-2">
        <div className="mb-3 flex flex-row flex-wrap items-center gap-2 md:mb-4">
          <span className="rounded-sm bg-content/10 px-3 py-1 text-sm tracking-wider uppercase">
            {tagLabel}
          </span>
        </div>
        <div className="leading-1.1 m-0 mb-4 text-4xl font-black tracking-tighter md:mb-6 md:text-5xl lg:text-6xl">
          <Bar className="w-2/3 max-w-xl" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-content/80">
          <div className="mr-1 flex items-center gap-3 text-content">
            <Skeleton className="size-7 rounded-full bg-skeleton" />
            <span className="text-[15px] font-bold">
              <Bar className="w-32" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 「N 条评论」标题的占位，h2 的字号和真实标题一致。 */
export function CommentCountSkeleton() {
  return (
    <h2 aria-busy="true" className="text-xl font-bold text-content">
      <Bar className="w-28" />
    </h2>
  );
}

/** 评论列表首次加载骨架：每行沿用 MvCommentItem 的结构与字号，行高与真实评论一致。 */
export function CommentListSkeleton() {
  return (
    <div aria-busy="true" className="mt-8 flex flex-col gap-6">
      {ROWS.map((lines, row) => (
        <div key={row} className="flex gap-4">
          <Skeleton className="size-10 shrink-0 rounded-full bg-skeleton" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 text-xs">
              <span className="text-[13px] font-medium">
                <Bar className="w-24" />
              </span>
              <span>
                <Bar className="w-14" />
              </span>
            </div>
            <div className="mt-1 text-sm leading-5">
              {LINE_WIDTHS.slice(0, lines).map((width, index) => (
                <span key={index}>
                  {index > 0 && <br />}
                  <Bar className={index === lines - 1 && lines > 1 ? "w-2/5" : width} />
                </span>
              ))}
            </div>
            <div className="mt-1 -ml-2 flex h-8 items-center">
              <Skeleton className="mx-2 size-4 rounded-full bg-skeleton" />
              <Skeleton className="ml-1 h-4 w-10 rounded-md bg-skeleton" />
            </div>
          </div>
          <div className="size-9 shrink-0" />
        </div>
      ))}
    </div>
  );
}

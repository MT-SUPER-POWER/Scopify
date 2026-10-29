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

/** 评论列表首次加载骨架：标签栏 / 排序按钮与评论行沿用 CommentItem 的类。 */
export function CommentListSkeleton() {
  return (
    <div aria-busy="true" className="w-full">
      <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
        <Skeleton className="h-9 w-56 rounded-md bg-skeleton" />
        <Skeleton className="h-[30px] w-24 rounded-lg bg-skeleton" />
      </div>
      <div className="space-y-6">
        {ROWS.map((lines, row) => (
          <div key={row} className="group flex gap-4">
            <Skeleton className="mt-1 size-10 shrink-0 rounded-full bg-skeleton" />
            <div className="flex-1 border-b border-content/5 pb-6 group-last:border-0">
              <div className="mb-1 flex items-baseline gap-2">
                {/* 真实名字是 button 包 span，行高由 button 的 24px 撑起，这里保持同样的嵌套 */}
                <span>
                  <span className="text-sm font-bold">
                    <Bar className="w-24" />
                  </span>
                </span>
              </div>
              <div className="text-sm leading-relaxed">
                {LINE_WIDTHS.slice(0, lines).map((width, index) => (
                  <span key={index}>
                    {index > 0 && <br />}
                    <Bar className={index === lines - 1 && lines > 1 ? "w-2/5" : width} />
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs">
                  <Bar className="w-20" />
                </span>
                <div className="flex items-center gap-5">
                  {[0, 1, 2].map((icon) => (
                    <Skeleton key={icon} className="size-4 rounded-full bg-skeleton" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

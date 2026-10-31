import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";

/** 每条评论的正文行数，错开长短。 */
const ROWS = [1, 2, 1, 3, 2, 1];
const LINE_WIDTHS = ["w-full", "w-11/12", "w-3/5"];

/** 行内骨架条：高度随所在文字字号走，行高仍由和真实组件相同的文字类决定。 */
export function SkeletonTextBar({ className }: { className: string }) {
  return <Skeleton className={`inline-block h-[0.8em] bg-skeleton align-middle ${className}`} />;
}

/** 「N 条评论」标题的占位，h2 的字号和真实标题一致。 */
export function CommentCountSkeleton() {
  return (
    <h2 aria-busy="true" className="text-xl font-bold text-content">
      <SkeletonTextBar className="w-28" />
    </h2>
  );
}

/** 评论列表首次加载骨架：每行沿用 CommentRow 的结构与字号，行高与真实评论一致。 */
export function CommentListSkeleton() {
  return (
    <div aria-busy="true" className="mt-8 flex flex-col gap-6">
      {ROWS.map((lines, row) => (
        <div key={row} className="flex gap-4">
          <Skeleton className="size-10 shrink-0 rounded-full bg-skeleton" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5 text-xs">
              <span className="text-[13px] font-medium">
                <SkeletonTextBar className="w-24" />
              </span>
              <span>
                <SkeletonTextBar className="w-14" />
              </span>
            </div>
            <div className="mt-1 text-sm leading-5">
              {LINE_WIDTHS.slice(0, lines).map((width, index) => (
                <span key={index}>
                  {index > 0 && <br />}
                  <SkeletonTextBar className={index === lines - 1 && lines > 1 ? "w-2/5" : width} />
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

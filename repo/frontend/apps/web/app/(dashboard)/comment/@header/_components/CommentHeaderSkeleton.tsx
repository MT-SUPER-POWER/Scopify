import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { SkeletonTextBar } from "@/components/Comment/CommentPageSkeleton";
import type { CommentHeaderSkeletonProps } from "@/types/comment/components";

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
          <SkeletonTextBar className="w-2/3 max-w-xl" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 text-sm text-content/80">
          <div className="mr-1 flex items-center gap-3 text-content">
            <Skeleton className="size-7 rounded-full bg-skeleton" />
            <span className="text-[15px] font-bold">
              <SkeletonTextBar className="w-32" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

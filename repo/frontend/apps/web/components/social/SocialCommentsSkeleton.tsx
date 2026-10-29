import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import type { SocialCommentsSkeletonProps } from "@/types/social/components";
import s from "./Social.module.css";

/** 每条评论的正文行宽，错开长短，避免整齐得像一块砖。 */
const TEXT_ROWS = [["w-11/12"], ["w-full", "w-2/5"], ["w-3/5"], ["w-full", "w-4/5"]];

/** 行内骨架条：高度随所在文字的字号走，行高仍由真实的评论样式类决定。 */
function Bar({ className }: { className: string }) {
  return <Skeleton className={`inline-block h-[0.8em] bg-skeleton align-middle ${className}`} />;
}

function Lines({ widths }: { widths: string[] }) {
  return widths.map((width, index) => (
    <span key={index}>
      {index > 0 && <br />}
      <Bar className={width} />
    </span>
  ));
}

/**
 * 评论首次加载时的骨架：沿用真实评论行的布局类，头像、名字、正文、时间与操作行
 * 的位置一一对应。modal 对应动态浮层，page 对应动态详情页。
 */
export function SocialCommentsSkeleton({ variant }: SocialCommentsSkeletonProps) {
  return (
    <div aria-busy="true">
      {TEXT_ROWS.map((widths, row) =>
        variant === "modal" ? (
          <div key={row} className={s.postComment}>
            <Skeleton className="size-9 shrink-0 rounded-full bg-skeleton" />
            <div className="min-w-0 flex-1">
              <span className={s.author}>
                <Bar className="w-24" />
              </span>
              <div className={s.postCommentText}>
                <Lines widths={widths} />
              </div>
              <div className={s.postCommentTime}>
                <Bar className="w-14" />
              </div>
              <div className={s.postCommentMeta}>
                <span>
                  <Bar className="w-10" />
                </span>
                <span>
                  <Bar className="w-10" />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div key={row} className={s.comment}>
            <Skeleton className="size-9 shrink-0 rounded-full bg-skeleton" />
            <div className={s.eventBody}>
              <div className={s.eventHeader}>
                <span>
                  <Bar className="w-24" />
                </span>
                <span>
                  <Bar className="w-16" />
                </span>
              </div>
              <div className={s.postText}>
                <Lines widths={widths} />
              </div>
              <div className={s.actions}>
                {[0, 1].map((index) => (
                  <span key={index} className="flex h-9 min-w-9 items-center">
                    <Bar className="w-8" />
                  </span>
                ))}
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import s from "@/components/social/Social.module.css";

const bar = "bg-skeleton";

/** 与真实主页同一套布局类，头像、数据带、标签、栏目位置一一对应，加载完成时不跳动。 */
export function ProfileSkeletonContent() {
  return (
    <div aria-busy="true">
      <section className={s.profileHero}>
        <div className={s.profileIdentityRow}>
          <Skeleton className={`${s.avatar} ${bar}`} />
          <div className={s.profileIdentityText}>
            <Skeleton className={`${bar} mb-3 h-12 w-2/5 max-w-md`} />
            <Skeleton className={`${bar} h-4 w-3/5 max-w-sm`} />
            <Skeleton className={`${bar} mt-2 h-3 w-24`} />
          </div>
        </div>
        <div className={s.profileStats}>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className={s.profileStat}>
              <Skeleton className={`${bar} h-6 w-14`} />
              <Skeleton className={`${bar} mt-1 h-3 w-10`} />
            </div>
          ))}
          <div className={s.profileHeroActions}>
            <Skeleton className={`${bar} h-9 w-24 rounded-full`} />
          </div>
        </div>
      </section>
      <div className={s.profileMain}>
        <div className={s.tabs}>
          {Array.from({ length: 3 }, (_, index) => (
            <span key={index} className={s.tab}>
              <Skeleton className={`${bar} h-4 w-10`} />
            </span>
          ))}
        </div>
        <div className={s.profileOverview}>
          <section className={s.profileSection}>
            <div className={s.sectionTitle}>
              <Skeleton className={`${bar} h-6 w-28`} />
              <Skeleton className={`${bar} h-8 w-36 rounded-full`} />
            </div>
            <div className={s.rankList}>
              {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className={s.rankRow}>
                  <Skeleton className={`${bar} h-4 w-5`} />
                  <Skeleton className={`${s.rankCover} ${bar}`} />
                  <div className={s.rankText}>
                    <Skeleton className={`${bar} h-4 w-2/3`} />
                    <Skeleton className={`${bar} mt-2 h-3 w-1/3`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className={s.profileSection}>
            <div className={s.sectionTitle}>
              <Skeleton className={`${bar} h-6 w-28`} />
            </div>
            <div className={s.profileShelf}>
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className={s.playlistTile}>
                  <Skeleton className={`${bar} mb-3 aspect-square w-full rounded-[9px]`} />
                  <Skeleton className={`${bar} h-4 w-3/4`} />
                  <Skeleton className={`${bar} mt-2 h-3 w-1/2`} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className={`${s.page} ${s.profilePage}`}>
      <div className={s.profileGlow} aria-hidden="true" />
      <div className={s.profileShell}>
        <ProfileSkeletonContent />
      </div>
    </div>
  );
}

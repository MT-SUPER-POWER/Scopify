import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { cn } from "@/lib/utils";
import {
  profileHeroActionsClass,
  profileHeroAvatarClass,
  profileHeroClass,
  profileIdentityRowClass,
  profileIdentityTextClass,
  profileMainClass,
  profileNameSizeClass,
  profileOverviewClass,
  profilePlaylistCoverClass,
  profilePlaylistTileClass,
  profileRankCoverClass,
  profileRankListClass,
  profileRankRowClass,
  profileRankTextClass,
  profileSectionClass,
  profileSectionTitleClass,
  profileShelfClass,
  profileShellClass,
  profileTabsClass,
  profileTitleRowClass,
  socialAvatarClass,
  socialPageClass,
  socialProfilePageClass,
  socialUnderlineTabClass,
} from "@/components/social/socialClasses";

const bar = "bg-skeleton";
/** 头像与封面占位沿用真实元素的底色（bg-secondary 覆盖 bar）。 */

/** 与真实主页同一套布局类，头像、名字行、标签、栏目位置一一对应，加载完成时不跳动。 */
export function ProfileSkeletonContent() {
  return (
    <div aria-busy="true">
      <section className={profileHeroClass}>
        <div className={profileIdentityRowClass}>
          <Skeleton className={cn(bar, socialAvatarClass, profileHeroAvatarClass)} />
          <div className={profileIdentityTextClass}>
            <div className={profileTitleRowClass}>
              <div
                className={cn("flex h-[1.1em] w-2/5 max-w-md items-center", profileNameSizeClass)}
              >
                <Skeleton className={`${bar} h-[0.7em] w-full`} />
              </div>
              <div className={profileHeroActionsClass}>
                <Skeleton className={`${bar} h-9 w-24 rounded-full`} />
              </div>
            </div>
            <div className="flex h-[21px] items-center">
              <Skeleton className={`${bar} h-3.5 w-3/5 max-w-sm`} />
            </div>
            <div className="mt-2.5 flex h-[21px] items-center">
              <Skeleton className={`${bar} h-3.5 w-2/5 max-w-xs`} />
            </div>
          </div>
        </div>
      </section>
      <div className={profileMainClass}>
        <div className={profileTabsClass}>
          {Array.from({ length: 3 }, (_, index) => (
            <span key={index} className={socialUnderlineTabClass}>
              <Skeleton className={`${bar} h-4 w-10`} />
            </span>
          ))}
        </div>
        <div className={profileOverviewClass}>
          <section className={profileSectionClass}>
            <div className={profileSectionTitleClass}>
              <Skeleton className={`${bar} h-6 w-28`} />
              <Skeleton className={`${bar} h-8 w-36 rounded-full`} />
            </div>
            <div className={profileRankListClass}>
              {Array.from({ length: 10 }, (_, index) => (
                <div key={index} className={profileRankRowClass}>
                  <Skeleton className={`${bar} h-4 w-5`} />
                  <Skeleton className={cn(bar, profileRankCoverClass)} />
                  <div className={profileRankTextClass}>
                    <Skeleton className={`${bar} h-4 w-2/3`} />
                    <Skeleton className={`${bar} mt-2 h-3 w-1/3`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className={profileSectionClass}>
            <div className={profileSectionTitleClass}>
              <Skeleton className={`${bar} h-6 w-28`} />
            </div>
            <div className={profileShelfClass}>
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className={profilePlaylistTileClass}>
                  <Skeleton className={cn(bar, profilePlaylistCoverClass)} />
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

/** 加载占位不带背景光，光晕等真实主页数据到达后再出现。 */
export function ProfilePageSkeleton() {
  return (
    <div className={cn(socialPageClass, socialProfilePageClass)}>
      <div className={profileShellClass}>
        <ProfileSkeletonContent />
      </div>
    </div>
  );
}

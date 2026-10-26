import type { HomeSectionLoadState } from "@/types/home";

/** 后台刷新失败不抹去已有内容；只把没有可用数据的失败栏目列为缺失。 */
export function getHomeLoadState(sections: HomeSectionLoadState[], hasOtherContent = false) {
  const hasContent = hasOtherContent || sections.some((section) => section.hasContent);
  const isFetching = sections.some((section) => section.isFetching);
  const failedSections = sections.filter((section) => section.isError && !section.hasContent);
  return {
    isLoading: !hasContent && isFetching,
    isUnavailable: !hasContent && !isFetching && failedSections.length > 0,
    failedSections,
  };
}

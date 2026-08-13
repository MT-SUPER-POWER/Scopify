import type { VoiceListSearchItem, VoiceListSearchResponse } from "@/types/api/voicelist";
import type { Podcast } from "@/types/search";

function getResourceTitle(title: string | undefined) {
  return title?.replace(/^播客\s*[:：]\s*/, "");
}

export function getVoiceListSearchItems(response: VoiceListSearchResponse | undefined) {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;

  return (
    payload?.resources ??
    payload?.data ??
    payload?.list ??
    payload?.voiceList ??
    payload?.voiceLists ??
    response?.resources ??
    response?.list ??
    response?.voiceList ??
    response?.voiceLists ??
    []
  );
}

export function mapVoiceListSearchItem(
  voiceList: VoiceListSearchItem,
  unknownPodcastName: string,
): Podcast | null {
  const baseInfo = voiceList.baseInfo ?? voiceList;
  const id = Number(baseInfo.voiceListId ?? baseInfo.id ?? voiceList.resourceId);
  if (!Number.isFinite(id)) return null;

  const category = [
    baseInfo.categoryName ?? baseInfo.category,
    baseInfo.secondCategoryName ?? baseInfo.secondCategory,
  ]
    .filter((item): item is string => Boolean(item))
    .join(" · ");
  const score = Number(
    voiceList.extInfo?.scoreDto?.score ??
      voiceList.extInfo?.rightLabelText ??
      baseInfo.score ??
      voiceList.score,
  );

  return {
    category: category || undefined,
    coverUrl: baseInfo.coverUrl ?? baseInfo.picUrl ?? voiceList.uiElement?.image?.imageUrl ?? "",
    description: baseInfo.desc ?? baseInfo.description,
    hostName: baseInfo.userName ?? baseInfo.creator?.nickname ?? baseInfo.dj?.nickname,
    id,
    name:
      baseInfo.voiceListName ??
      baseInfo.name ??
      getResourceTitle(voiceList.uiElement?.mainTitle?.title) ??
      unknownPodcastName,
    programCount: baseInfo.voiceCount ?? baseInfo.programCount ?? 0,
    score: Number.isFinite(score) ? score : undefined,
    source: "voice-list",
    subscriberCount: baseInfo.subCount ?? baseInfo.subscriberCount ?? 0,
  };
}

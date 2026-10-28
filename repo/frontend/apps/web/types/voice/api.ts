export interface SubscribedVoiceList {
  categoryName?: string;
  coverUrl?: string;
  createTime?: number;
  desc?: string;
  lastProgramCreateTime?: number;
  newVoiceCount?: number;
  pinned?: boolean;
  playCount?: number;
  secondCategoryName?: string;
  subCount?: number;
  userId?: number;
  userName?: string;
  voiceCount?: number;
  voiceId?: number;
  voiceListId: number;
  voiceListName: string;
  voiceName?: string;
}

export interface VoiceListSearchBaseInfo {
  category?: string;
  categoryName?: string;
  coverUrl?: string;
  creator?: {
    nickname?: string;
  };
  desc?: string;
  description?: string;
  dj?: {
    nickname?: string;
  };
  id?: number | string;
  name?: string;
  picUrl?: string;
  programCount?: number;
  score?: number | string;
  secondCategory?: string;
  secondCategoryName?: string;
  subCount?: number;
  subscriberCount?: number;
  userName?: string;
  voiceCount?: number;
  voiceListId?: number | string;
  voiceListName?: string;
}

export interface VoiceListSearchUiElement {
  image?: {
    imageUrl?: string;
  };
  mainTitle?: {
    title?: string;
  };
}

export interface VoiceListSearchScoreInfo {
  recommendWord?: string;
  score?: number | string;
}

export interface VoiceListSearchExtInfo {
  rightLabelText?: string;
  scoreDto?: VoiceListSearchScoreInfo;
}

export interface VoiceListSearchItem extends VoiceListSearchBaseInfo {
  baseInfo?: VoiceListSearchBaseInfo;
  extInfo?: VoiceListSearchExtInfo;
  resourceId?: number | string;
  uiElement?: VoiceListSearchUiElement;
}

export interface VoiceListSearchPayload {
  data?: VoiceListSearchItem[];
  hasMore?: boolean;
  list?: VoiceListSearchItem[];
  more?: boolean;
  resources?: VoiceListSearchItem[];
  voiceList?: VoiceListSearchItem[];
  voiceLists?: VoiceListSearchItem[];
}

export interface VoiceListSearchResponse {
  code: number;
  data?: VoiceListSearchItem[] | VoiceListSearchPayload;
  hasMore?: boolean;
  list?: VoiceListSearchItem[];
  message?: string | null;
  more?: boolean;
  resources?: VoiceListSearchItem[];
  voiceList?: VoiceListSearchItem[];
  voiceLists?: VoiceListSearchItem[];
}

export interface SubscribedVoiceListsResponse {
  code: number;
  data?: {
    count?: number;
    data?: SubscribedVoiceList[];
    hasMore?: boolean;
  };
  message?: string | null;
}

export interface CreatedVoiceList {
  coverUrl?: string;
  creator?: {
    nickname?: string;
  };
  id: number;
  name: string;
  picUrl?: string;
  voiceCount?: number;
}

export interface CreatedVoiceListsResponse {
  code: number;
  data?: CreatedVoiceList[] | { data?: CreatedVoiceList[]; list?: CreatedVoiceList[] };
  list?: CreatedVoiceList[];
}

export interface RecommendedPodcast {
  category?: string;
  coverUrl?: string;
  dj?: {
    nickname?: string;
  };
  id: number;
  name: string;
  picUrl?: string;
  playCount?: number;
  programCount?: number;
  subCount?: number;
}

export interface RecommendedPodcastsResponse {
  code: number;
  data?:
    | RecommendedPodcast[]
    | {
        data?: RecommendedPodcast[];
        djRadios?: RecommendedPodcast[];
        radios?: RecommendedPodcast[];
        recommend?: RecommendedPodcast[];
      };
  djRadios?: RecommendedPodcast[];
  message?: string | null;
}

export interface RecommendedVoiceArtist {
  id?: number;
  name?: string;
  picUrl?: string;
}

export interface RecommendedVoiceAlbum {
  blurPicUrl?: string;
  id?: number;
  name?: string;
  picUrl?: string;
}

export interface RecommendedVoiceSong {
  al?: RecommendedVoiceAlbum;
  album?: RecommendedVoiceAlbum;
  ar?: RecommendedVoiceArtist[];
  artists?: RecommendedVoiceArtist[];
  dt?: number;
  duration?: number;
  id?: number;
  name?: string;
}

export interface RecommendedVoice {
  duration?: number;
  djProgram?: {
    dj?: {
      nickname?: string;
    };
    mainSong?: RecommendedVoiceSong;
  };
  id?: number;
  name?: string;
  picUrl?: string;
  radioName?: string;
}

export interface RecommendedVoiceListsResponse {
  code: number;
  data?: {
    recommendVoiceVOS?: RecommendedVoice[];
  };
}

export interface LikedVoice {
  auditStatus?: null | string;
  contentCoverUrl?: string;
  contentId?: number | string;
  contentName?: string;
  coverUrl?: string;
  dj?: {
    nickname?: string;
  };
  djProgram?: {
    dj?: {
      nickname?: string;
    };
    mainSong?: RecommendedVoiceSong;
  };
  duration?: number;
  disPlayStatus?: null | string;
  displayStatus?: null | string;
  id?: number | string;
  lastPlayTime?: number;
  likeTime?: number;
  mainSong?: RecommendedVoiceSong;
  name?: string;
  picUrl?: string;
  playCount?: number;
  publishTime?: number;
  radioName?: string;
  userName?: string;
  voiceId?: number | string;
  voiceDesc?: string;
  voiceListName?: string;
  voiceName?: string;
}

export interface LikedVoicesResponse {
  code: number;
  contentVOList?: LikedVoice[];
  data?:
    | LikedVoice[]
    | {
        contentList?: LikedVoice[];
        contentVOList?: LikedVoice[];
        data?: LikedVoice[];
        list?: LikedVoice[];
      };
  message?: string | null;
}

export interface VoiceDetail {
  commentCount?: number;
  coverUrl?: string;
  description?: string;
  duration?: number;
  id?: number;
  likedCount?: number;
  name?: string;
  voiceListId?: number;
}

export interface VoiceDetailResponse {
  code: number;
  data?: VoiceDetail | null;
  message?: string;
}

export interface VoiceLyricResponse {
  code: number;
  data?: {
    lyricUrl?: string;
    source?: string | null;
  };
}

export interface VoiceLyricSentence {
  beg: number;
  end: number;
  name: string;
  speaker?: string;
  sylls?: VoiceLyricSyllable[] | null;
}

export interface VoiceLyricSyllable {
  beg: number;
  end: number;
  name: string;
  speaker?: string | null;
  sylls?: VoiceLyricSyllable[] | null;
}

export interface VoiceLyricDocument {
  duration?: number;
  sents?: VoiceLyricSentence[];
}

export interface VoiceListDetail {
  category?: string;
  coverUrl?: string;
  description?: string;
  id?: number;
  name?: string;
  picUrl?: string;
}

export interface VoiceLikeResponse {
  code: number;
  message?: string | null;
}

export interface VoiceListDetailResponse {
  code: number;
  data?: VoiceListDetail | null;
  message?: string;
}

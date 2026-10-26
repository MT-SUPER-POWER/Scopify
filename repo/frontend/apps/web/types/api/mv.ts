export type MvArea = "全部" | "内地" | "港台" | "欧美" | "日本" | "韩国";
export type MvCategory = "全部" | "官方版" | "原生" | "现场版" | "网易出品";
export type MvOrder = "上升最快" | "最热" | "最新";

export interface MvPaginationParams {
  limit?: number;
  offset?: number;
}

export interface MvListParams extends MvPaginationParams {
  area?: MvArea;
  type?: MvCategory;
  order?: MvOrder;
}

export interface MvFirstParams {
  area?: MvArea;
  limit?: number;
}

export interface MvTopParams extends MvPaginationParams {
  area?: Exclude<MvArea, "全部">;
}

export interface MvArtist {
  id: number;
  name: string;
  img1v1Url?: string;
}

/** 列表接口的 MV 摘要；不同来源的封面字段有所不同。 */
export interface MvSummary {
  id: number;
  name: string;
  artistId?: number;
  artistName?: string;
  artists?: MvArtist[];
  cover?: string;
  imgurl?: string;
  imgurl16v9?: string;
  picUrl?: string;
  playCount?: number;
  duration?: number;
  publishTime?: string;
  briefDesc?: string | null;
  desc?: string | null;
  subed?: boolean;
}

export interface MvListResponse {
  code: number;
  data: MvSummary[];
  hasMore?: boolean;
  count?: number;
}

export interface MvTopItem extends MvSummary {
  lastRank?: number;
  score?: number;
}

export interface MvTopResponse {
  code: number;
  data: MvTopItem[];
  hasMore?: boolean;
  updateTime?: number;
}

export interface RecommendedMvsResponse {
  code: number;
  result: MvSummary[];
  category?: number;
}

export interface SimilarMvsResponse {
  code: number;
  mvs: MvSummary[];
}

export interface ArtistMvsResponse {
  code: number;
  mvs: MvSummary[];
  hasMore?: boolean;
  time?: number;
}

export interface MvResolution {
  br: number;
  size: number;
  point?: number;
}

export interface MvDetail extends MvSummary {
  brs?: MvResolution[];
  commentCount?: number;
  shareCount?: number;
  subCount?: number;
  videoGroup?: { id: number; name: string }[];
}

export interface MvDetailResponse {
  code: number;
  data: MvDetail;
  loadingPic?: string;
  subed?: boolean;
}

export interface MvDetailInfoResponse {
  code: number;
  liked: boolean;
  likedCount: number;
  shareCount: number;
  commentCount: number;
}

export interface MvUrlResponse {
  code: number;
  data: {
    id: number;
    url: string | null;
    r: number;
    size?: number;
    md5?: string;
    expi?: number;
    fee?: number;
    msg?: string;
  };
}

/** /mv/sublist 实际返回收藏的 MV 和视频混合列表，标识为 vid。 */
export interface SubscribedMvItem {
  vid: number | string;
  title: string;
  coverUrl: string;
  creator?: { userId: number; userName: string }[];
  durationms?: number;
  playTime?: number;
  type?: number;
}

export interface SubscribedMvsResponse {
  code: number;
  data: SubscribedMvItem[];
  count?: number;
  hasMore?: boolean;
}

export interface MvOperationResponse {
  code: number;
  message?: string;
  msg?: string;
}

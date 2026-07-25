// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ VIP SIGN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** 签到歌曲信息 */
export interface VipSignSongInfo {
  songId: number;
  songName: string;
  artistName: string;
  album: string;
  cover: string;
  artistIds: number[];
  seq: number;
}

/** 活动时间段 */
export interface VipSignPeriodDto {
  periodType: number;
  startTime: string;
  endTime: string;
}

/** 月签奖励 */
export interface VipSignPrize {
  prizeId: number;
  vipType: number;
  prizeType: number;
  day: number;
  prizeShowName: string;
  showSubTitle: string;
  unitNum: number;
  userPrizeRecordId: number;
  time: number;
}

/** 乐签月历或详情记录；today 仅标识这是当天的月历条目 */
export interface VipSignDetail {
  recordId: number;
  userId: number;
  time: number;
  timeStr?: string;
  songId?: number;
  songCover?: string | null;
  score?: number;
  today?: boolean;
  songSrc?: number;
  showTag?: string | null;
  songInfo?: VipSignSongInfo;
  wishWords?: string;
  wishWordType?: number;
  wishUserNickname?: string;
  periodDto?: VipSignPeriodDto;
  monthCheckInTotalDay?: number;
  surprisePkgVo?: unknown;
  monthCheckInPrizList?: VipSignPrize[];
  sceneId?: number;
  jumpUrl?: string;
}

/** 签到信息响应 */
export interface VipSignInfoResponse {
  code: number;
  data: VipSignDetail[];
  message: string;
}

/** 签到详情响应 */
export interface VipSignDetailResponse {
  code: number;
  data: VipSignDetail;
  message: string;
}

/** 乐签日历中的单日状态 */
export interface VipSignHistoryItem {
  dayText: string;
  sign: boolean;
  songCoverUrl: string | null;
  signTime: number;
  today: boolean;
}

/** 乐签日历状态 */
export interface VipSignHistory {
  text: string | null;
  subText: string;
  redPrize: boolean;
  redDay: boolean;
  btnText: string;
  bgTexture: string;
  signInfoList: VipSignHistoryItem[];
}

/** 乐签日历响应 */
export interface VipSignHistoryResponse {
  code: number;
  data: VipSignHistory;
  message: string;
}

/** 签到操作响应 - POST /vip/sign（Modal 数据的唯一来源） */
export interface VipSignResponse {
  code: number;
  taskSign?: {
    code: number;
    data: boolean;
    message: string;
  };
  checkinDetail?: {
    code: number;
    data: VipSignDetail;
    message: string;
  };
  signed: boolean;
  message: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ LEGACY TYPE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** @deprecated 使用 VipSignDetail 代替 */
export type VipSignRecord = VipSignDetail;

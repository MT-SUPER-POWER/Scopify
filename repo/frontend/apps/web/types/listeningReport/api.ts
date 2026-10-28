export type ListeningReportPeriod = "month" | "week" | "year";

export type RealtimeListeningReportPeriod = Exclude<ListeningReportPeriod, "year">;

export interface ListeningReportRequest {
  endTime?: number;
  type: ListeningReportPeriod;
}

export interface CircleTimePeriodDuration {
  duration: number;
  period: "afternoon" | "deep_night" | "early_morning" | "morning" | "night" | "noon" | string;
}

export interface ListeningReportSection {
  field?: string;
  textB?: string;
  type?: string;
  valueA?: string;
}

export interface DurationDetail {
  audiobookDuration?: number;
  duration: number;
  period: string;
  podcastDuration?: number;
  reachLimit?: boolean;
}

export interface WallpaperItem {
  artists: ListeningReportArtist[];
  picId?: number;
  picUrl: string;
  songId: number;
  songName: string;
}

export interface TopSongSectionItem {
  field?: string;
  picUrl?: string;
  songId: number;
  songName: string;
  text: string;
  type?: string;
}

export interface TopArtistSectionItem {
  artistId: number;
  artistName: string;
  field?: string;
  picUrl?: string;
  text: string;
  type?: string;
}

export interface TopStyleSectionItem {
  genreId: number;
  genreName: string;
  percent: string;
}

export interface TopAgeSectionItem {
  age: string;
  playSongNum: number;
}

export interface TopAgeSongItem {
  picUrl?: string;
  songId: number;
  songName: string;
  text: string;
}

export interface TopLanguageSectionItem {
  language: string;
  percent: string;
  playSongNum: number;
  songName?: string;
}

export interface TopLanguageSongItem {
  picUrl?: string;
  songId: number;
  songName: string;
  text: string;
}

/**
 * 网易云音乐听歌足迹接口完整响应字段模型。
 */
export interface ListeningReportData {
  endTime?: number;
  listenTimeBlock?: {
    blockType?: string;
    circleTimePeriodDurations?: CircleTimePeriodDuration[];
    playDuration?: number;
    playDurationText?: string;
    sections?: ListeningReportSection[];
  };
  listenTimeDistributionBlock?: {
    achievementTitle?: {
      mainTitle?: string;
      subTitle?: string;
    };
    blockType?: string;
    durationDetails?: DurationDetail[];
    listenDays?: number;
    sections?: Array<{ type: string; value: string }>;
  };
  startTime?: number;
  topAgeBlock?: {
    blockType?: string;
    sections?: TopAgeSectionItem[];
    songItems?: TopAgeSongItem[];
  };
  topArtistBlock?: {
    artistName?: string;
    avatarUrl?: string;
    blockType?: string;
    items?: ListeningReportInsightItem[];
    sections?: TopArtistSectionItem[];
  };
  topLanguageBlock?: {
    blockType?: string;
    sections?: TopLanguageSectionItem[];
    songItems?: TopLanguageSongItem[];
  };
  topSongBlock?: {
    artists?: ListeningReportArtist[];
    blockType?: string;
    items?: ListeningReportInsightItem[];
    picUrl?: string;
    sections?: TopSongSectionItem[];
    songId?: number;
    songName?: string;
  };
  topStyleBlock?: {
    blockType?: string;
    genreEnglishName?: string;
    genreId?: number;
    genreName?: string;
    picUrl?: string;
    sections?: TopStyleSectionItem[];
    songId?: number;
    songName?: string;
  };
  type?: ListeningReportPeriod;
  wallpaperBlock?: {
    blockType?: string;
    items?: WallpaperItem[];
    picUrls?: string[];
    songCount?: number;
  };
  [field: string]: unknown;
}

export interface ListeningReportArtist {
  artistId?: number;
  artistName?: string;
}

export interface ListeningReportInsightItem {
  field?: string;
  mainText?: string;
  subText?: string;
}

export interface ListeningReportResponse {
  code: number;
  data?: ListeningReportData | null;
  message?: string;
}

export interface TodayListeningSongDTO {
  aliasName?: string | null;
  artists: Array<{ artistId: number; artistName: string }>;
  lastPlayTime: number;
  picId?: number;
  picUrl?: string;
  redStar?: boolean;
  songId: number;
  songName: string;
}

export interface TodayListeningSongsResponse {
  code: number;
  data?: {
    songDTOs?: TodayListeningSongDTO[];
  } | null;
  message?: string;
}

export interface SongPlayRankItem {
  artists: ListeningReportArtist[];
  picUrl?: string;
  playCount: number;
  rank?: number;
  songId: number;
  songName: string;
}

export interface SongPlayRankResponse {
  code: number;
  data?:
    | {
        list?: SongPlayRankItem[];
        total?: number;
      }
    | SongPlayRankItem[]
    | null;
  message?: string;
}

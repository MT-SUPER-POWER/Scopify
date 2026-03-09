export interface SongDetail {
  id: number;
  name: string;
  dt: number; // 时长 (ms)
  ar: Array<{ id: number; name: string }>; // 歌手
  al: {
    id: number;
    name: string;
    picUrl: string;
  }; // 专辑
  publishTime: number;
}

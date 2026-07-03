export interface VipSignRecord {
  recordId: number;
  userId: number;
  time: number;
  timeStr: string; // "2026-07-01"
  songId: number;
  songCover: string | null;
  score: number;
  today: boolean;
}

export interface VipSignInfoResponse {
  code: number;
  data: VipSignRecord[];
  message: string;
}

export interface VipSignResponse {
  code: number;
  data: boolean;
  message: string;
}

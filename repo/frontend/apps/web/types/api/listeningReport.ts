export type ListeningReportPeriod = "month" | "week" | "year";

export type RealtimeListeningReportPeriod = Exclude<ListeningReportPeriod, "year">;

export interface ListeningReportRequest {
  endTime?: number;
  type: ListeningReportPeriod;
}

/**
 * 网易云的听歌足迹接口会按报告类型返回不同的字段。
 * 保留原始数据，并由展示层只读取稳定的时长字段，避免丢失后端后续新增的报告内容。
 */
export interface ListeningReportData {
  [field: string]: unknown;
}

export interface ListeningReportResponse {
  code: number;
  data?: ListeningReportData | null;
  message?: string;
}

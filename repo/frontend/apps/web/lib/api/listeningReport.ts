import type {
  ListeningReportRequest,
  ListeningReportResponse,
  RealtimeListeningReportPeriod,
} from "@/types/api/listeningReport";
import request, { requestConfig } from "../web/request";

/** 获取累计听歌时长。 */
export function getTotalListeningDuration() {
  return request.get<ListeningReportResponse>("/listen/data/total");
}

/** 获取正在进行的周/月听歌时长报告。 */
export function getRealtimeListeningReport(type: RealtimeListeningReportPeriod) {
  return request.get<ListeningReportResponse>(
    "/listen/data/realtime/report",
    requestConfig({ params: { type } }),
  );
}

/** 获取已结算的周、月或年度听歌报告。 */
export function getListeningReport({ endTime, type }: ListeningReportRequest) {
  return request.get<ListeningReportResponse>(
    "/listen/data/report",
    requestConfig({ params: { endTime, type } }),
  );
}

/** 获取年度听歌足迹。 */
export function getYearListeningReport() {
  return request.get<ListeningReportResponse>("/listen/data/year/report");
}

/** 获取今日收听歌曲排行。 */
export function getTodayListeningSongs() {
  return request.get<ListeningReportResponse>("/listen/data/today/song");
}

/** 获取周/月歌曲播放排行。 */
export function getListeningSongPlayRank({
  endTime,
  type,
}: Omit<ListeningReportRequest, "type"> & {
  type: RealtimeListeningReportPeriod;
}) {
  return request.get<ListeningReportResponse>(
    "/listen/data/song/play/rank",
    requestConfig({ params: { endTime, type } }),
  );
}

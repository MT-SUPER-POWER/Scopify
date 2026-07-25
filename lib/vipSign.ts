import type { VipSignHistoryItem } from "@/types/api/vipSign";

export function getVipSignTodayRecord(records: VipSignHistoryItem[]) {
  return records.find((record) => record.today === true);
}

export function hasVipSignedToday(records: VipSignHistoryItem[]) {
  return getVipSignTodayRecord(records)?.sign === true;
}

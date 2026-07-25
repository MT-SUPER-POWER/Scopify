import { expect, test } from "bun:test";
import { getVipSignTodayRecord, hasVipSignedToday } from "@/lib/vipSign";
import type { VipSignHistoryItem } from "@/types/api/vipSign";

const unsignedTodayRecord: VipSignHistoryItem = {
  dayText: "25日",
  sign: false,
  signTime: 0,
  songCoverUrl: null,
  today: true,
};

test("does not treat today's unsigned calendar entry as a completed VIP sign-in", () => {
  expect(hasVipSignedToday([unsignedTodayRecord])).toBeFalse();
});

test("recognizes a persisted record for today as a completed VIP sign-in", () => {
  const signedTodayRecord: VipSignHistoryItem = {
    ...unsignedTodayRecord,
    sign: true,
    signTime: 1784760523000,
  };

  expect(hasVipSignedToday([signedTodayRecord])).toBeTrue();
  expect(getVipSignTodayRecord([signedTodayRecord])).toBe(signedTodayRecord);
});

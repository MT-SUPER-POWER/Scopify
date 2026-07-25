import { expect, test } from "bun:test";
import { hasVipMembership, isVipSong } from "@/lib/vip";
import { pruneUser } from "@/types/api/user";

test("identifies only VIP-gated songs from NetEase fee values", () => {
  expect(isVipSong(undefined)).toBe(false);
  expect(isVipSong(null)).toBe(false);
  expect(isVipSong(0)).toBe(false);
  expect(isVipSong(1)).toBe(true);
  expect(isVipSong(4)).toBe(false);
  expect(isVipSong(8)).toBe(false);
});

test("identifies a VIP membership without depending on a tier", () => {
  expect(hasVipMembership(undefined)).toBe(false);
  expect(hasVipMembership(null)).toBe(false);
  expect(hasVipMembership(0)).toBe(false);
  expect(hasVipMembership(1)).toBe(true);
  expect(hasVipMembership(11)).toBe(true);
});

test("preserves VIP membership status in the normalized user model", () => {
  expect(pruneUser({ vipType: 11 }).vipType).toBe(11);
  expect(pruneUser(null).vipType).toBe(0);
});

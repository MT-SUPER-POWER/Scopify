import { expect, test } from "bun:test";
import { hasVipMembership, isPaidSong } from "@/lib/vip";
import { pruneUser } from "@/types/api/user";

test("identifies paid songs from NetEase fee values", () => {
  expect(isPaidSong(undefined)).toBe(false);
  expect(isPaidSong(null)).toBe(false);
  expect(isPaidSong(0)).toBe(false);
  expect(isPaidSong(1)).toBe(true);
  expect(isPaidSong(4)).toBe(true);
  expect(isPaidSong(8)).toBe(true);
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

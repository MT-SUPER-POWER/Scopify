import { expect, test } from "bun:test";
import { accountTrackStateKey } from "@scopify/music-domain/library";
import type { MusicAccountRef, MusicResourceRef } from "@scopify/music-domain/identity";
import { toggleDemoTrackLike } from "../lib/provider-demo";

const netease: MusicAccountRef = { provider: "netease", accountId: "same-id" };
const qq: MusicAccountRef = { provider: "qq", accountId: "same-id" };
const track: MusicResourceRef<"track"> = { provider: "netease", kind: "track", id: "101" };

test("switching to another provider cannot mutate an existing account's collection", () => {
  const states = toggleDemoTrackLike({}, netease, track);
  const result = toggleDemoTrackLike(states, qq, track);
  expect(result).toBe(states);
  expect(result[accountTrackStateKey(netease, track)].liked).toBe(true);
  expect(result[accountTrackStateKey(qq, track)]).toBeUndefined();
});

test("different accounts of the same provider keep independent collection states", () => {
  const other: MusicAccountRef = { provider: "netease", accountId: "another-account" };
  const first = toggleDemoTrackLike({}, netease, track);
  const both = toggleDemoTrackLike(first, other, track);
  const toggled = toggleDemoTrackLike(both, other, track);
  expect(toggled[accountTrackStateKey(netease, track)].liked).toBe(true);
  expect(toggled[accountTrackStateKey(other, track)].liked).toBe(false);
  expect(first[accountTrackStateKey(other, track)]).toBeUndefined();
});

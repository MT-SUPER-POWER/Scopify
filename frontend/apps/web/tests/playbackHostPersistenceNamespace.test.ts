import { expect, test } from "bun:test";
import {
  getPlayerPersistenceStorageKey,
  getTimePersistenceStorageKey,
  isPlaybackHostRenderer,
  PLAYER_PERSISTENCE_STORAGE_KEY,
  PLAYBACK_HOST_PLAYER_PERSISTENCE_STORAGE_KEY,
  PLAYBACK_HOST_TIME_PERSISTENCE_STORAGE_KEY,
  TIME_PERSISTENCE_STORAGE_KEY,
} from "@/lib/playbackHost/persistenceNamespace";

test("the hidden playback host receives independent player and time namespaces", () => {
  const hostWindow = { playbackHostAPI: {} };

  expect(isPlaybackHostRenderer(hostWindow)).toBe(true);
  expect(getPlayerPersistenceStorageKey(hostWindow)).toBe(
    PLAYBACK_HOST_PLAYER_PERSISTENCE_STORAGE_KEY,
  );
  expect(getTimePersistenceStorageKey(hostWindow)).toBe(PLAYBACK_HOST_TIME_PERSISTENCE_STORAGE_KEY);
});

test("main, browser, and SSR-safe null renderers retain the existing namespaces", () => {
  expect(isPlaybackHostRenderer({})).toBe(false);
  expect(isPlaybackHostRenderer(null)).toBe(false);
  expect(getPlayerPersistenceStorageKey({})).toBe(PLAYER_PERSISTENCE_STORAGE_KEY);
  expect(getTimePersistenceStorageKey(null)).toBe(TIME_PERSISTENCE_STORAGE_KEY);
});

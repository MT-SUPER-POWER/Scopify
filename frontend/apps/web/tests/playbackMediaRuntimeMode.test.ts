import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveMainWindowPlaybackMediaRuntimeMode } from "@/lib/player/playbackMediaRuntimeMode";

const mainLayoutSource = readFileSync(
  join(import.meta.dir, "../components/MainLayout.tsx"),
  "utf8",
);
const hostRootSource = readFileSync(
  join(import.meta.dir, "../components/player/PlaybackHostRoot.tsx"),
  "utf8",
);
const hostSessionRuntimeSource = readFileSync(
  join(import.meta.dir, "../components/player/PlaybackHostSessionRuntime.tsx"),
  "utf8",
);
const mediaRuntimeSource = readFileSync(
  join(import.meta.dir, "../components/player/PlaybackMediaRuntimeProvider.tsx"),
  "utf8",
);

test("the dashboard chooses exactly one playback owner for each runtime", () => {
  expect(resolveMainWindowPlaybackMediaRuntimeMode({ isDesktop: false })).toBe("in-page-authority");
  expect(resolveMainWindowPlaybackMediaRuntimeMode({ isDesktop: true })).toBe(
    "desktop-main-replica",
  );
  expect(mainLayoutSource).toContain("<PlaybackMediaRuntimeProvider>");
  expect(mainLayoutSource).toContain("<DesktopMainPlaybackReplicaProvider>");
  expect(mainLayoutSource).not.toContain("<audio");
});

test("only the reusable media runtime mounts an audio element and the Host runtime becomes its Authority", () => {
  expect(mediaRuntimeSource).toContain("<audio");
  expect(hostRootSource).toContain("<PlaybackHostSessionRuntime");
  expect(hostRootSource).not.toContain("<PlaybackMediaRuntimeProvider");
  expect(hostSessionRuntimeSource).toContain("PLAYBACK_HOST_AUTHORITY_CONNECTION_ID");
  expect(hostSessionRuntimeSource).toContain("<PlaybackMediaRuntimeProvider");
  expect(hostSessionRuntimeSource).toContain(
    "authorityConnectionId={PLAYBACK_HOST_AUTHORITY_CONNECTION_ID}",
  );
  expect(hostRootSource).not.toContain("DesktopMainPlaybackReplicaProvider");
});

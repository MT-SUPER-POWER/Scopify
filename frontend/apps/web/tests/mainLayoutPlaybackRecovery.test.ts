import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const mainLayoutSource = readFileSync(
  join(import.meta.dir, "../components/MainLayout.tsx"),
  "utf8",
);

test("the production audio element warms and observes restored playback URLs", () => {
  expect(mainLayoutSource).toContain("if (hasWarmedPlaybackUrlRef.current) return;");
  expect(mainLayoutSource).toContain("hasWarmedPlaybackUrlRef.current = true;");
  expect(mainLayoutSource).toContain("void refreshCurrentTrackUrl();");
  expect(mainLayoutSource).toContain("onError={(event) => {");
  expect(mainLayoutSource).toContain('console.error("[player] Media playback failed"');
  expect(mainLayoutSource).toContain('console.error("[player] Audio play() rejected"');
});

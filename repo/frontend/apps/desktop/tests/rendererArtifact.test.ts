import { afterEach, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DESKTOP_BRIDGE_PROTOCOL_VERSION } from "@mt-super-power/desktop-contract";

import { createRendererArtifactManifest, verifyRendererArtifact } from "@/lib/rendererArtifact";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { force: true, recursive: true });
});

function createRendererFixture() {
  const root = mkdtempSync(join(tmpdir(), "scopify-renderer-"));
  tempDirs.push(root);
  mkdirSync(join(root, "_next"), { recursive: true });
  writeFileSync(join(root, "index.html"), "<main>Scopify</main>");
  writeFileSync(join(root, "_next", "app.js"), "console.log('renderer')");
  writeFileSync(join(root, "_next", "app.js.map"), '{"version":3}');
  const manifest = createRendererArtifactManifest(root, {
    rendererVersion: "1.1.0",
    sourceRevision: "test-revision",
  });
  writeFileSync(join(root, "renderer.manifest.json"), JSON.stringify(manifest));
  return { manifest, root };
}

test("accepts an intact renderer artifact with the current bridge protocol", () => {
  const { manifest, root } = createRendererFixture();

  expect(verifyRendererArtifact(root)).toEqual({ manifest, ok: true });
});

test("rejects renderer files changed after the manifest was created", () => {
  const { root } = createRendererFixture();
  writeFileSync(join(root, "_next", "app.js"), "console.log('tampered')");

  expect(verifyRendererArtifact(root)).toMatchObject({
    message: expect.stringContaining("checksum mismatch"),
    ok: false,
  });
});

test("accepts an artifact after package-only source maps are removed", () => {
  const { manifest, root } = createRendererFixture();
  rmSync(join(root, "_next", "app.js.map"));

  expect(verifyRendererArtifact(root)).toEqual({ manifest, ok: true });
});

test("rejects a renderer built for a different bridge protocol", () => {
  const { manifest, root } = createRendererFixture();
  writeFileSync(
    join(root, "renderer.manifest.json"),
    JSON.stringify({
      ...manifest,
      bridgeProtocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION + 1,
    }),
  );

  expect(verifyRendererArtifact(root)).toMatchObject({
    message: expect.stringContaining("does not match Desktop protocol"),
    ok: false,
  });
});

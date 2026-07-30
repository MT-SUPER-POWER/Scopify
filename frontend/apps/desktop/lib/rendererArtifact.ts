import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

import {
  DESKTOP_BRIDGE_PROTOCOL_VERSION,
  type RendererArtifactManifest,
  RENDERER_ARTIFACT_MANIFEST_VERSION,
} from "@scopify/desktop-contract";

const MANIFEST_FILE = "renderer.manifest.json";

export type RendererArtifactVerification =
  { manifest: RendererArtifactManifest; ok: true } | { message: string; ok: false };

function collectArtifactFiles(root: string, current = root): string[] {
  return readdirSync(current, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = resolve(current, entry.name);
      if (entry.isDirectory()) return collectArtifactFiles(root, entryPath);
      if (!entry.isFile()) return [];
      if (relative(root, entryPath).split(sep).join("/") === MANIFEST_FILE) return [];
      return [entryPath];
    })
    .sort((left, right) => left.localeCompare(right));
}

export function calculateRendererArtifactHash(rendererRoot: string): string {
  const hash = createHash("sha256");

  for (const filePath of collectArtifactFiles(rendererRoot)) {
    const artifactPath = relative(rendererRoot, filePath).split(sep).join("/");
    hash.update(artifactPath);
    hash.update("\0");
    hash.update(readFileSync(filePath));
    hash.update("\0");
  }

  return hash.digest("hex");
}

export function createRendererArtifactManifest(
  rendererRoot: string,
  metadata: Pick<RendererArtifactManifest, "rendererVersion" | "sourceRevision">,
): RendererArtifactManifest {
  return {
    artifactSha256: calculateRendererArtifactHash(rendererRoot),
    bridgeProtocolVersion: DESKTOP_BRIDGE_PROTOCOL_VERSION,
    buildTarget: "desktop",
    manifestVersion: RENDERER_ARTIFACT_MANIFEST_VERSION,
    rendererVersion: metadata.rendererVersion,
    sourceRevision: metadata.sourceRevision,
  };
}

function isRendererArtifactManifest(value: unknown): value is RendererArtifactManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<RendererArtifactManifest>;
  return (
    typeof manifest.artifactSha256 === "string" &&
    typeof manifest.bridgeProtocolVersion === "number" &&
    manifest.buildTarget === "desktop" &&
    manifest.manifestVersion === RENDERER_ARTIFACT_MANIFEST_VERSION &&
    typeof manifest.rendererVersion === "string" &&
    typeof manifest.sourceRevision === "string"
  );
}

export function verifyRendererArtifact(rendererRoot: string): RendererArtifactVerification {
  const indexPath = resolve(rendererRoot, "index.html");
  const manifestPath = resolve(rendererRoot, MANIFEST_FILE);

  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
    return { message: `Renderer entry is missing: ${indexPath}`, ok: false };
  }
  if (!existsSync(manifestPath) || !statSync(manifestPath).isFile()) {
    return { message: `Renderer manifest is missing: ${manifestPath}`, ok: false };
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
  } catch (error) {
    return { message: `Renderer manifest is invalid JSON: ${String(error)}`, ok: false };
  }

  if (!isRendererArtifactManifest(manifest)) {
    return { message: "Renderer manifest does not match the supported schema", ok: false };
  }
  if (manifest.bridgeProtocolVersion !== DESKTOP_BRIDGE_PROTOCOL_VERSION) {
    return {
      message: `Renderer bridge protocol ${manifest.bridgeProtocolVersion} does not match Desktop protocol ${DESKTOP_BRIDGE_PROTOCOL_VERSION}`,
      ok: false,
    };
  }

  const actualHash = calculateRendererArtifactHash(rendererRoot);
  if (manifest.artifactSha256 !== actualHash) {
    return {
      message: `Renderer artifact checksum mismatch: expected ${manifest.artifactSha256}, received ${actualHash}`,
      ok: false,
    };
  }

  return { manifest, ok: true };
}

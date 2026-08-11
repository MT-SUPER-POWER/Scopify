import { existsSync, rmSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, "..");
const workspacePrefix = `${workspaceRoot}${sep}`;
const legacyArtifactDirs = [
  "frontend/apps/web/out",
  "frontend/apps/desktop/out",
  "frontend/apps/desktop/renderer",
  "frontend/apps/desktop/dist",
  "frontend/apps/desktop/dist-retry",
].map((relativePath) => resolve(workspaceRoot, relativePath));

for (const artifactDir of legacyArtifactDirs) {
  if (!artifactDir.startsWith(workspacePrefix)) {
    throw new Error(`Refusing to remove a path outside the workspace: ${artifactDir}`);
  }
  if (!existsSync(artifactDir)) continue;

  rmSync(artifactDir, { force: true, maxRetries: 3, recursive: true, retryDelay: 200 });
  console.log(`Removed legacy build artifact: ${artifactDir}`);
}

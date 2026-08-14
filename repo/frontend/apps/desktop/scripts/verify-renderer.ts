import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyRendererArtifact } from "../lib/rendererArtifact";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rendererRoot = resolve(scriptDir, "../build/desktop/app/renderer");
const expectedSourceRevision = process.argv
  .find((argument) => argument.startsWith("--source-revision="))
  ?.slice("--source-revision=".length);
const result = verifyRendererArtifact(rendererRoot);

if (!result.ok) throw new Error(result.message);
if (expectedSourceRevision && result.manifest.sourceRevision !== expectedSourceRevision) {
  throw new Error(
    `Renderer source revision ${result.manifest.sourceRevision} does not match expected revision ${expectedSourceRevision}`,
  );
}

console.log(
  `Verified Desktop renderer: protocol=${result.manifest.bridgeProtocolVersion} revision=${result.manifest.sourceRevision} sha256=${result.manifest.artifactSha256}`,
);

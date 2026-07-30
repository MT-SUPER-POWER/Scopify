import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [archiveArgument, checksumArgument, destinationArgument] = process.argv.slice(2);
if (!archiveArgument || !checksumArgument || !destinationArgument) {
  throw new Error(
    "Usage: bun .github/scripts/unpack-renderer-artifact.ts <archive> <checksum> <destination>",
  );
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const archivePath = resolve(repositoryRoot, archiveArgument);
const checksumPath = resolve(repositoryRoot, checksumArgument);
const destinationPath = resolve(repositoryRoot, destinationArgument);

if (!existsSync(archivePath) || !existsSync(checksumPath)) {
  throw new Error(`Renderer archive or checksum is missing: ${archivePath}`);
}

const expectedSha256 = readFileSync(checksumPath, "utf8").trim().split(/\s+/)[0]?.toLowerCase();
const actualSha256 = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
if (!expectedSha256 || actualSha256 !== expectedSha256) {
  throw new Error(
    `Renderer archive SHA-256 mismatch: expected ${expectedSha256 ?? "missing"}, received ${actualSha256}`,
  );
}

rmSync(destinationPath, { force: true, recursive: true });
mkdirSync(destinationPath, { recursive: true });

const extraction = Bun.spawnSync({
  cmd: ["tar", "-xzf", archivePath, "-C", destinationPath],
  stderr: "inherit",
  stdout: "inherit",
});
if (extraction.exitCode !== 0) {
  throw new Error(`Failed to extract Renderer archive (exit code ${extraction.exitCode})`);
}

console.log(`Verified and extracted Renderer archive sha256=${actualSha256}`);

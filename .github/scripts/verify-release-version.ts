import { readFileSync } from "node:fs";

function readVersion(path: string): string {
  return (JSON.parse(readFileSync(path, "utf8")) as { version: string }).version;
}

const tag = process.argv[2] || process.env.GITHUB_REF_NAME;
if (!tag) throw new Error("A release tag argument or GITHUB_REF_NAME is required");

const versions = {
  desktop: readVersion("repo/frontend/apps/desktop/package.json"),
  docs: readVersion("repo/frontend/apps/docs/package.json"),
  root: readVersion("package.json"),
  web: readVersion("repo/frontend/apps/web/package.json"),
};
const expectedTag = `v${versions.desktop}`;

if (tag !== expectedTag) {
  throw new Error(`Release tag ${tag} does not match Desktop version ${expectedTag}`);
}
if (Object.values(versions).some((version) => version !== versions.desktop)) {
  throw new Error(`Workspace release versions are not aligned: ${JSON.stringify(versions)}`);
}

console.log(`Verified release version ${versions.desktop}`);

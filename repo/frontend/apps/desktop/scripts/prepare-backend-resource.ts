import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const desktopRoot = resolve(scriptDir, "..");
const backendRoot = resolve(desktopRoot, "../../../backend/api-enhanced");
const resourceRoot = resolve(desktopRoot, "build/backend");

const backendPackagePath = join(backendRoot, "package.json");
if (!existsSync(backendPackagePath)) {
  throw new Error(
    `The backend submodule is not available at ${backendRoot}. Initialize repo/backend/api-enhanced before packaging the desktop app.`,
  );
}

rmSync(resourceRoot, { force: true, recursive: true });
mkdirSync(resourceRoot, { recursive: true });

for (const file of [
  "app.js",
  "generateConfig.js",
  "interface.d.ts",
  "main.js",
  "package.json",
  "pnpm-lock.yaml",
  "server.js",
]) {
  cpSync(join(backendRoot, file), join(resourceRoot, file));
}
cpSync(join(desktopRoot, "resources/backend-entry.cjs"), join(resourceRoot, "entry.cjs"));

for (const directory of ["data", "module", "plugins", "public", "util"]) {
  cpSync(join(backendRoot, directory), join(resourceRoot, directory), {
    dereference: true,
    recursive: true,
  });
}

const packageManager = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
execFileSync(
  packageManager,
  ["install", "--prod", "--frozen-lockfile", "--ignore-scripts", "--config.node-linker=hoisted"],
  { cwd: resourceRoot, stdio: "inherit" },
);

cpSync(join(resourceRoot, "node_modules"), join(resourceRoot, "vendor"), {
  dereference: true,
  recursive: true,
});
rmSync(join(resourceRoot, "node_modules"), { force: true, recursive: true });

console.log(`Prepared self-contained local backend resource: ${resourceRoot}`);

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const desktopRoot = resolve(scriptDir, "..");
const backendRoot = resolve(desktopRoot, "../../../backend/api-enhanced");
const resourceRoot = resolve(desktopRoot, "build/backend");

function safeCleanDir(target: string) {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
    return;
  }
  try {
    rmSync(target, { force: true, recursive: true, maxRetries: 10, retryDelay: 300 });
  } catch {
    for (const entry of readdirSync(target)) {
      try {
        rmSync(join(target, entry), {
          force: true,
          recursive: true,
          maxRetries: 5,
          retryDelay: 200,
        });
      } catch {
        // Continue cleaning remaining entries
      }
    }
  }
  mkdirSync(target, { recursive: true });
}

const backendPackagePath = join(backendRoot, "package.json");
if (!existsSync(backendPackagePath)) {
  throw new Error(
    `The backend submodule is not available at ${backendRoot}. Initialize repo/backend/api-enhanced before packaging the desktop app.`,
  );
}

safeCleanDir(resourceRoot);

for (const file of [
  "app.js",
  "generateConfig.js",
  "interface.d.ts",
  "main.js",
  "package.json",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "server.js",
]) {
  const filePath = join(backendRoot, file);
  if (existsSync(filePath)) {
    cpSync(filePath, join(resourceRoot, file));
  }
}
cpSync(join(desktopRoot, "resources/backend-entry.cjs"), join(resourceRoot, "entry.cjs"));

for (const directory of ["data", "module", "plugins", "public", "util"]) {
  cpSync(join(backendRoot, directory), join(resourceRoot, directory), {
    dereference: true,
    recursive: true,
  });
}

const packageManager = process.platform === "win32" ? "corepack.cmd" : "corepack";
execFileSync(
  packageManager,
  [
    "pnpm",
    "install",
    "--prod",
    "--frozen-lockfile",
    "--ignore-scripts",
    "--config.node-linker=hoisted",
  ],
  {
    cwd: resourceRoot,
    stdio: "inherit",
  },
);

cpSync(join(resourceRoot, "node_modules"), join(resourceRoot, "vendor"), {
  dereference: true,
  recursive: true,
});
rmSync(join(resourceRoot, "node_modules"), {
  force: true,
  maxRetries: 10,
  recursive: true,
  retryDelay: 300,
});

console.log(`Prepared self-contained local backend resource: ${resourceRoot}`);

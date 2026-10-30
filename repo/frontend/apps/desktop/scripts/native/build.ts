import process from "node:process";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

interface NativeModuleDefinition {
  name: string;
  script: string;
  enabled: boolean;
}

const modules: NativeModuleDefinition[] = [
  {
    name: "audio-engine",
    script: "scripts/native/audio-engine.ts",
    enabled: process.platform === "win32",
  },
  {
    name: "taskbar-lyric",
    script: "scripts/native/taskbar-lyric.ts",
    enabled: process.platform === "win32",
  },
  {
    name: "wallpaper-helper",
    script: "scripts/native/wallpaper-helper.ts",
    enabled: process.platform === "win32" || process.platform === "darwin",
  },
];

const desktopRoot = join(import.meta.dir, "..", "..");
const forwardArgs = process.argv.slice(2);

console.log(`[build:native] Platform: ${process.platform}, Arch: ${process.arch}`);

for (const mod of modules) {
  if (!mod.enabled) {
    console.log(`[build:native] Skipping ${mod.name} (not supported on ${process.platform})`);
    continue;
  }

  console.log(`[build:native] Compiling ${mod.name}...`);
  const result = spawnSync("bun", [mod.script, ...forwardArgs], {
    cwd: desktopRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`[build:native] Failed to execute ${mod.name}:`, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[build:native] ${mod.name} build failed with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

console.log("[build:native] All native modules compiled successfully.");

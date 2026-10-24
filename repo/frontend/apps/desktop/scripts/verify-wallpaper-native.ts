import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

// Bundle only the smoke harness; no Web or application build is needed.
const root = resolve(import.meta.dir, "..");
const outputRoot = mkdtempSync(join(tmpdir(), "scopify-wallpaper-smoke-"));
mkdirSync(join(outputRoot, "profile"));
try {
  const result = await Bun.build({
    entrypoints: [join(root, "tests/nativeWallpaper.electron.ts")],
    outdir: outputRoot,
    target: "node",
    format: "esm",
    external: ["electron", "electron-log"],
    naming: "main.mjs",
  });
  if (!result.success)
    throw new AggregateError(result.logs, "Could not prepare the wallpaper smoke harness");
  symlinkSync(
    join(root, "node_modules"),
    join(outputRoot, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  writeFileSync(
    join(outputRoot, "preload.cjs"),
    'const {contextBridge,ipcRenderer}=require("electron");contextBridge.exposeInMainWorld("wallpaperSmoke",{configure:(update)=>ipcRenderer.invoke("desktop-playback-wallpaper:configure",update)});',
  );
  const suffix = `${process.platform}-${process.arch}${process.platform === "win32" ? "-msvc" : ""}`;
  const electronPath = createRequire(import.meta.url)("electron") as string;
  const code = await new Promise<number>((resolveCode, reject) => {
    const child = spawn(electronPath, [join(outputRoot, "main.mjs")], {
      cwd: outputRoot,
      env: {
        ...process.env,
        SCOPIFY_WALLPAPER_SMOKE_ROOT: outputRoot,
        SCOPIFY_WALLPAPER_MODULE_PATH: join(
          root,
          "native/wallpaper-helper",
          `scopify-wallpaper-helper.${suffix}.node`,
        ),
      },
      stdio: "inherit",
    });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Native wallpaper verification timed out"));
    }, 45_000);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (exitCode) => {
      clearTimeout(timer);
      resolveCode(exitCode ?? 1);
    });
  });
  if (code !== 0) process.exitCode = code;
} finally {
  rmSync(outputRoot, { recursive: true, force: true });
}

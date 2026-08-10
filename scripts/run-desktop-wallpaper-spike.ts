import { join } from "node:path";

const root = import.meta.dir.replace(/[\\/]scripts$/, "");
const rendererUrl = "http://127.0.0.1:3000/desktop-wallpaper-spike";
const rendererMarker = "SCOPIFY DESKTOP HOST SPIKE";
const staticRenderer = process.argv.includes("--static");
const transparent = process.argv.includes("--transparent");
const systemWallpaperFallback = process.argv.includes("--system-fallback");
if (transparent && systemWallpaperFallback) {
  throw new Error("--transparent and --system-fallback cannot be used together.");
}
const systemWallpaperStateDirectory = join(
  process.env.TEMP || root,
  "scopify-desktop-wallpaper-spike",
);
const children: Bun.Subprocess[] = [];
let stopPromise: Promise<void> | null = null;

async function isRendererReady() {
  try {
    const response = await fetch(rendererUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(1_500),
    });
    return response.ok && (await response.text()).includes(rendererMarker);
  } catch {
    return false;
  }
}

async function waitForRenderer(webProcess: Bun.Subprocess | undefined) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await isRendererReady()) return;
    if (webProcess?.exitCode !== null) {
      throw new Error(`Web renderer exited before it became ready (code ${webProcess.exitCode}).`);
    }
    await Bun.sleep(250);
  }
  throw new Error(`Timed out waiting for ${rendererUrl}.`);
}

async function stopProcessTree(child: Bun.Subprocess) {
  if (child.exitCode !== null) return;
  if (process.platform === "win32") {
    const taskkill = Bun.spawn(["taskkill", "/pid", String(child.pid), "/t", "/f"], {
      stderr: "ignore",
      stdout: "ignore",
    });
    await taskkill.exited;
    return;
  }
  child.kill("SIGTERM");
  await child.exited;
}

async function stopProcesses() {
  await Promise.all(children.map(stopProcessTree));
  if (!systemWallpaperFallback) return;

  const restore = Bun.spawn(
    [
      "powershell.exe",
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      join(
        root,
        "frontend",
        "apps",
        "desktop",
        "prototypes",
        "desktop-wallpaper-host-spike",
        "system-wallpaper.ps1",
      ),
      "-Action",
      "Restore",
      "-JournalPath",
      join(systemWallpaperStateDirectory, "system-wallpaper-journal.json"),
    ],
    { stderr: "inherit", stdout: "inherit" },
  );
  await restore.exited;
}

function stop() {
  stopPromise ??= stopProcesses();
  return stopPromise;
}

process.once("SIGINT", () => void stop());
process.once("SIGTERM", () => void stop());

let exitCode = 1;
try {
  let webProcess: Bun.Subprocess | undefined;
  if (staticRenderer) {
    console.log("[desktop-wallpaper-spike] using the built static renderer");
  } else if (!(await isRendererReady())) {
    console.log(`[desktop-wallpaper-spike] starting renderer at ${rendererUrl}`);
    webProcess = Bun.spawn(["bun", "run", "dev"], {
      cwd: join(root, "frontend", "apps", "web"),
      stderr: "inherit",
      stdin: "inherit",
      stdout: "inherit",
    });
    children.push(webProcess);
  } else {
    console.log(`[desktop-wallpaper-spike] reusing renderer at ${rendererUrl}`);
  }

  if (!staticRenderer) {
    await waitForRenderer(webProcess);
    console.log("[desktop-wallpaper-spike] renderer ready; starting Electron host");
  }

  const desktopProcess = Bun.spawn(["bun", "run", "dev"], {
    cwd: join(root, "frontend", "apps", "desktop"),
    env: {
      ...process.env,
      ...(staticRenderer ? { ELECTRON_RENDERER_MODE: "static" } : {}),
      SCOPIFY_DESKTOP_WALLPAPER_SPIKE: "1",
      SCOPIFY_DESKTOP_WALLPAPER_SPIKE_STATE_DIR: systemWallpaperStateDirectory,
      SCOPIFY_DESKTOP_WALLPAPER_SPIKE_SYSTEM_FALLBACK: systemWallpaperFallback ? "1" : "0",
      SCOPIFY_DESKTOP_WALLPAPER_SPIKE_TRANSPARENT: transparent ? "1" : "0",
    },
    stderr: "inherit",
    stdin: "inherit",
    stdout: "inherit",
  });
  children.push(desktopProcess);

  const firstExit = await Promise.race(
    children.map(async (child) => ({ child, code: await child.exited })),
  );
  exitCode = firstExit.code ?? 1;
} catch (error) {
  console.error(
    `[desktop-wallpaper-spike] ${error instanceof Error ? error.message : String(error)}`,
  );
} finally {
  await stop();
}

process.exit(exitCode);

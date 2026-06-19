# Desktop Delivery and Backend Decoupling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Scopify desktop delivery to an electron-vite based Electron runtime, remove bundled backend lifecycle management, add independent Docker Compose backend deployment, and prepare GitHub Release updater support.

**Architecture:** Keep Next.js as the renderer and continue exporting static files into `renderer/`. Electron owns only desktop runtime concerns and derives the backend URL from `backend.host` plus `backend.port`; Docker Compose owns backend startup. `electron-builder` remains the installer/publisher, while `electron-updater` adds stable GitHub Release update checks.

**Tech Stack:** Next.js 16 static export, Electron 40, electron-vite, electron-builder, electron-updater, Bun, TypeScript, Docker Compose, Biome.

---

## File Structure

- Modify `package.json`: dependency and script changes, remove desktop build dependency on `build:backend`, remove backend package resources from `build.extraResources`.
- Create `electron.vite.config.ts`: electron-vite build config for `main/main.ts` and `main/preload.ts`.
- Modify `main/main.ts`: remove managed backend startup gate, keep renderer load and splash flow, initialize updater module.
- Modify `main/constants.ts`: remove backend entry/resource constants, keep config/resources/logging constants.
- Modify `main/module/backend.ts`: replace process management with derived backend URL/status helper.
- Modify `main/module/ipc.ts`: keep backend URL/status IPC, update cookie origin handling, register updater IPC.
- Create `main/module/updater.ts`: encapsulate electron-updater state, events, and IPC-safe commands.
- Modify `main/preload.ts` and `types/electron.d.ts`: expose updater APIs to renderer.
- Modify `types/backend.ts`: keep status type if renderer still consumes it, but state should no longer represent local process startup.
- Modify `types/config.ts`: remove official `backend.autoStart`, keep `backend.host` and `backend.port`, tolerate old input while normalizing.
- Modify `config/app.config.default.yml` and `config/app.config.yml`: remove `backend.autoStart`, keep `backend.host` and `backend.port`.
- Modify `lib/web/env.ts` and `lib/web/request.ts`: derive request base URL by automatically prefixing `http://`.
- Modify `hooks/settings/useSettingsState.ts` and `components/settings/SettingsPage.tsx`: remove backend settings from restart checks and UI.
- Modify `lib/i18n.ts` and regenerate `types/i18n.generated.d.ts`: remove or stop using backend setting labels.
- Modify `components/MainLayout.tsx` and `lib/hooks/useBackendStartup.ts`: stop blocking UI on backend startup.
- Modify `.github/workflows/release.yml`: remove backend build step, use electron-vite build script.
- Modify `docker-compose.yml`: define independent backend service.
- Modify `README.md`: document independent backend deployment and yml endpoint config.
- Tests: update or add focused tests under `tests/` for config normalization and URL derivation if helper functions are introduced.

## Task 1: Add Build Dependencies and Script Skeleton

**Files:**
- Modify: `package.json`
- Modify: `bun.lock`

- [ ] **Step 1: Add required packages**

Run:

```powershell
bun add -d electron-vite
bun add electron-updater
```

Expected: `package.json` and `bun.lock` update successfully. If Bun cannot reach the registry because of sandboxed network access, rerun the same command with approval.

- [ ] **Step 2: Update desktop scripts**

In `package.json`, replace the Electron build scripts with this shape:

```json
{
  "predev": "bun run build:electron",
  "dev": "concurrently -n \"NEXT,ELECTRON\" -c \"yellow,blue\" --kill-others \"bun run script/dev-web.ts\" \"bunx electron-vite dev\"",
  "start": "bunx serve renderer -p 4545",
  "dev:backend": "bun run backend/api-enhanced/app.js",
  "dev:web": "concurrently -n \"NEXT,NETEASE\" -c \"yellow,red\" --kill-others \"bun run script/dev-web.ts\" \"bun run dev:backend\"",
  "build:web": "next build",
  "build:electron": "electron-vite build",
  "build:win": "bun run build:web && bun run build:electron && electron-builder -- win",
  "build:mac": "bun run build:web && bun run build:electron && electron-builder -- mac"
}
```

Remove these scripts from the desktop build path:

```json
{
  "backend": "bun run out/backend/app.js",
  "build:backend": "bun build backend/api-enhanced/app.js --target=node --outfile=out/backend/app.js"
}
```

Keep `dev:backend` because it is still useful for local backend development.

- [ ] **Step 3: Remove backend resources from packaging**

In `package.json`, remove the `extraResources` entry:

```json
{
  "from": "out/backend",
  "to": "backend",
  "filter": ["app.js"]
}
```

Keep the `config` and `resources` entries.

- [ ] **Step 4: Verify package JSON shape**

Run:

```powershell
bun pm pkg get scripts build.extraResources
```

Expected: scripts show `build:electron`, `build:win`, and `build:mac` without `build:backend`; `extraResources` does not include `out/backend`.

## Task 2: Configure electron-vite for Main and Preload

**Files:**
- Create: `electron.vite.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Create electron-vite config**

Create `electron.vite.config.ts`:

```ts
import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

const root = __dirname;

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@": root,
      },
    },
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: {
          main: resolve(root, "main/main.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          format: "es",
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@": root,
      },
    },
    build: {
      outDir: "out/main",
      rollupOptions: {
        input: {
          preload: resolve(root, "main/preload.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          format: "cjs",
        },
      },
    },
  },
});
```

- [ ] **Step 2: Keep Electron entry path stable**

Confirm `package.json` still has:

```json
{
  "main": "out/main/main.js"
}
```

Expected: `electron .` and `electron-builder` continue to use the same main entry path.

- [ ] **Step 3: Run the Electron build**

Run:

```powershell
bun run build:electron
```

Expected: `out/main/main.js` and `out/main/preload.js` are generated. If config import paths fail because relative `.js` imports are no longer valid under bundling, fix the affected imports in Task 3 while keeping this output contract.

## Task 3: Remove Managed Backend Lifecycle from Electron

**Files:**
- Modify: `main/module/backend.ts`
- Modify: `main/main.ts`
- Modify: `main/constants.ts`
- Modify: `types/backend.ts`

- [ ] **Step 1: Replace backend module with endpoint status helper**

Replace `main/module/backend.ts` process management with:

```ts
import type { BackendStartupStatus } from "@/types/backend";
import { appConfig } from "../constants.js";

export function ensureBackendUrl() {
  return `http://${appConfig.backend.host}:${appConfig.backend.port}`;
}

export function getBackendStartupStatus(): BackendStartupStatus {
  return {
    state: "ready",
    ready: true,
    url: ensureBackendUrl(),
  };
}
```

This keeps existing IPC consumers stable while removing process ownership.

- [ ] **Step 2: Remove backend constants**

In `main/constants.ts`, remove:

```ts
const __backendDir = app.isPackaged
  ? join(process.resourcesPath, "/backend")
  : join(__dirname, "../../backend/api-enhanced");
const __backendEntry = join(__backendDir, "app.js");
const __backendEnv = {
  ...process.env,
  PORT: `${appConfig.backend.port}`,
  HOST: appConfig.backend.host,
  APP_CONFIG_PATH: appConfigPath,
  NODE_ENV: "production",
  ELECTRON_RUN_AS_NODE: "1",
};
```

Also remove `Backend Entry` from the startup log and remove `__backendDir`, `__backendEntry`, and `__backendEnv` from the export list.

- [ ] **Step 3: Simplify main startup gate**

In `main/main.ts`, remove imports of `startManagedBackend` and `stopManagedBackend`. Remove the `sendBackendStatusToRenderer` and `maybeRevealMainWindow` backend gate. In `did-finish-load`, reveal the main window directly:

```ts
mainWindow.webContents.once("did-finish-load", () => {
  mainWindowLoaded = true;
  revealMainWindow();
});
```

Remove backend startup code from `app.whenReady()`. Remove `stopManagedBackend()` calls from `before-quit`, `uncaughtException`, and `unhandledRejection`.

- [ ] **Step 4: Run TypeScript check**

Run:

```powershell
bunx tsc --noEmit
```

Expected: no references remain to removed backend process exports.

## Task 4: Normalize Backend Config as host and port Only

**Files:**
- Modify: `types/config.ts`
- Modify: `config/app.config.default.yml`
- Modify: `config/app.config.yml`
- Modify: `lib/web/env.ts`
- Modify: `lib/web/request.ts`
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: Update config type**

In `types/config.ts`, change `AppConfig["backend"]` to:

```ts
backend: {
  port: number;
  host: string;
};
```

Keep `PartialAppConfig` as-is so old yml containing `autoStart` can still be parsed without runtime failure.

- [ ] **Step 2: Normalize backend values**

Add helpers in `types/config.ts`:

```ts
function normalizeBackendHost(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : DEFAULT_APP_CONFIG.backend.host;
}

function normalizeBackendPort(value: unknown): number {
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : DEFAULT_APP_CONFIG.backend.port;
}
```

Update `normalizeAppConfig` backend block:

```ts
backend: {
  host: normalizeBackendHost(input?.backend?.host),
  port: normalizeBackendPort(input?.backend?.port),
},
```

- [ ] **Step 3: Remove autoStart from default config files**

Update both yml files to:

```yaml
backend:
  port: 3838
  host: 127.0.0.1
```

Use each file's current port value if the repo intentionally differs between default and local config.

- [ ] **Step 4: Derive backend URL consistently**

In `lib/web/env.ts`, keep `host` and `port` only. In `lib/web/request.ts`, add:

```ts
function buildBackendBaseUrl(config: Pick<AppConfig, "backend">) {
  return `http://${config.backend.host}:${config.backend.port}`;
}
```

Replace direct template strings with:

```ts
const INITIAL_BASE_URL = buildBackendBaseUrl(appConfig);
```

and in `applyRuntimeConfig`:

```ts
baseURL = buildBackendBaseUrl(config);
```

- [ ] **Step 5: Update Sidebar readiness probe**

In `components/Sidebar.tsx`, keep the current readiness probe but build its URL with the same rule:

```ts
const backendReady = await waitForBackend(
  `http://${appConfig.backend.host}:${appConfig.backend.port}`,
  10000,
);
```

- [ ] **Step 6: Run config tests**

Run:

```powershell
bun test tests/yaml.test.ts
```

Expected: existing yaml/config tests pass. If the test asserts `autoStart`, update the assertion to expect only `host` and `port`.

## Task 5: Remove Backend Controls from Settings

**Files:**
- Modify: `hooks/settings/useSettingsState.ts`
- Modify: `components/settings/SettingsPage.tsx`
- Modify: `lib/i18n.ts`
- Modify: `types/i18n.generated.d.ts`

- [ ] **Step 1: Remove backend restart checks**

In `hooks/settings/useSettingsState.ts`, update `checkRequiresRestart` to remove backend comparisons:

```ts
function checkRequiresRestart(current: AppConfig, original: AppConfig): boolean {
  return (
    current.app.gpuAcceleration !== original.app.gpuAcceleration ||
    current.app.devTools !== original.app.devTools
  );
}
```

- [ ] **Step 2: Remove backend settings section**

In `components/settings/SettingsPage.tsx`, remove the Electron-only backend section containing the three setting rows for `settings.autoStartBackend.label`, `settings.backendHost.label`, and `settings.backendPort.label`:

```tsx
<SettingRow
  label={t("settings.autoStartBackend.label")}
  requiresRestart
  control={
    <Toggle
      enabled={config.backend.autoStart}
      onChange={() => handleLocalChange("backend", "autoStart", !config.backend.autoStart)}
    />
  }
/>
<SettingRow
  label={t("settings.backendHost.label")}
  requiresRestart
  control={
    <SettingInput
      value={config.backend.host}
      onChange={(value) => handleLocalChange("backend", "host", value)}
    />
  }
/>
<SettingRow
  label={t("settings.backendPort.label")}
  requiresRestart
  control={
    <SettingInput
      type="number"
      value={config.backend.port}
      onChange={(value) => handleLocalChange("backend", "port", Number(value))}
    />
  }
/>
```

Do not replace it with user-facing backend controls.

- [ ] **Step 3: Remove unused i18n labels**

In `lib/i18n.ts`, remove these unused keys for every locale block:

```ts
"settings.section.backend"
"settings.autoStartBackend.label"
"settings.backendHost.label"
"settings.backendPort.label"
```

If removing keys causes generated type drift, run:

```powershell
bun run i18n:types
```

Expected: `types/i18n.generated.d.ts` matches `lib/i18n.ts`.

- [ ] **Step 4: Run lint on settings files**

Run:

```powershell
bunx biome check hooks/settings/useSettingsState.ts components/settings/SettingsPage.tsx lib/i18n.ts types/i18n.generated.d.ts
```

Expected: no unused imports or formatting errors remain.

## Task 6: Add Independent Backend Docker Compose

**Files:**
- Modify: `docker-compose.yml`
- Create: `.env.example`
- Modify: `.gitignore` if `.env.example` is ignored accidentally

- [ ] **Step 1: Write compose service**

Set `docker-compose.yml` to:

```yaml
services:
  netease-api:
    container_name: ${BACKEND_CONTAINER_NAME:-scopify-netease-api}
    build:
      context: ./backend/api-enhanced
      dockerfile: Dockerfile
    environment:
      HOST: ${BACKEND_HOST:-0.0.0.0}
      PORT: ${BACKEND_PORT:-3838}
      NODE_ENV: production
    ports:
      - "${BACKEND_PORT:-3838}:${BACKEND_PORT:-3838}"
    restart: unless-stopped
```

- [ ] **Step 2: Add env example**

Create `.env.example`:

```env
BACKEND_CONTAINER_NAME=scopify-netease-api
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3838
```

Keep `.env` ignored and `.env.example` tracked.

- [ ] **Step 3: Validate compose config**

Run:

```powershell
docker compose config
```

Expected: Docker Compose resolves the service without yaml errors. If Docker is unavailable on the machine, record that verification could not be run.

## Task 7: Add Updater Module and IPC

**Files:**
- Create: `main/module/updater.ts`
- Modify: `main/module/ipc.ts`
- Modify: `main/preload.ts`
- Modify: `types/electron.d.ts`
- Modify: `main/main.ts`

- [ ] **Step 1: Create updater module**

Create `main/module/updater.ts`:

```ts
import type { BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import { logger } from "../constants.js";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
}

let mainWindow: BrowserWindow | null = null;
let state: UpdateState = { status: "idle" };

function setState(next: UpdateState) {
  state = next;
  mainWindow?.webContents.send("updater:status-changed", state);
}

export function getUpdateState() {
  return state;
}

export function initializeUpdater(window: BrowserWindow) {
  mainWindow = window;
  autoUpdater.autoDownload = false;

  autoUpdater.on("checking-for-update", () => setState({ status: "checking" }));
  autoUpdater.on("update-available", (info) =>
    setState({ status: "available", version: info.version }),
  );
  autoUpdater.on("update-not-available", (info) =>
    setState({ status: "not-available", version: info.version }),
  );
  autoUpdater.on("download-progress", (progress) =>
    setState({ status: "downloading", percent: progress.percent }),
  );
  autoUpdater.on("update-downloaded", (info) =>
    setState({ status: "downloaded", version: info.version }),
  );
  autoUpdater.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("[updater] update error:", message);
    setState({ status: "error", message });
  });
}

export async function checkForUpdates() {
  return autoUpdater.checkForUpdates();
}

export async function downloadUpdate() {
  return autoUpdater.downloadUpdate();
}

export function quitAndInstallUpdate() {
  autoUpdater.quitAndInstall(false, true);
}
```

- [ ] **Step 2: Register updater IPC**

In `main/module/ipc.ts`, import the updater functions and add handlers:

```ts
ipcMain.handle("updater:get-status", () => getUpdateState());
ipcMain.handle("updater:check", () => checkForUpdates());
ipcMain.handle("updater:download", () => downloadUpdate());
ipcMain.on("updater:quit-and-install", () => quitAndInstallUpdate());
```

- [ ] **Step 3: Expose updater preload API**

In `main/preload.ts`, add:

```ts
getUpdateStatus: () => ipcRenderer.invoke("updater:get-status"),
checkForUpdates: () => ipcRenderer.invoke("updater:check"),
downloadUpdate: () => ipcRenderer.invoke("updater:download"),
quitAndInstallUpdate: () => ipcRenderer.send("updater:quit-and-install"),
onUpdateStatusChanged: (callback) => {
  ipcRenderer.on("updater:status-changed", (_event, status) => {
    callback(status);
  });
},
```

- [ ] **Step 4: Update ElectronAPI type**

In `types/electron.d.ts`, import `UpdateState` as a type or duplicate the stable interface:

```ts
export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  percent?: number;
  message?: string;
}
```

Add methods to `ElectronAPI`:

```ts
getUpdateStatus: () => Promise<UpdateState>;
checkForUpdates: () => Promise<unknown>;
downloadUpdate: () => Promise<unknown>;
quitAndInstallUpdate: () => void;
onUpdateStatusChanged: (callback: (status: UpdateState) => void) => void;
```

- [ ] **Step 5: Initialize updater after window setup**

In `main/main.ts`, after `setupWindowModules(mainWindow)`, call:

```ts
initializeUpdater(mainWindow);
setTimeout(() => {
  checkForUpdates().catch((error) => {
    logger.warn("[updater] startup check failed:", error);
  });
}, 5000);
```

Import `initializeUpdater` and `checkForUpdates`.

- [ ] **Step 6: Type-check updater IPC**

Run:

```powershell
bunx tsc --noEmit
```

Expected: updater APIs are typed in preload and renderer globals.

## Task 8: Update Release Workflow

**Files:**
- Modify: `.github/workflows/release.yml`

- [ ] **Step 1: Remove backend build step**

Delete:

```yaml
- name: Build Backend
  run: bun run build:backend
```

- [ ] **Step 2: Replace compile step**

Replace the manual SWC compile step with:

```yaml
- name: Build Electron Runtime
  run: bun run build:electron
```

Keep `Build Next.js` before it and `Build & Publish Electron` after it.

- [ ] **Step 3: Validate workflow syntax**

Run:

```powershell
bunx prettier --check .github/workflows/release.yml
```

Expected: formatting check passes or reports only existing style differences. If prettier is unavailable, inspect the yaml indentation manually.

## Task 9: Update Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace bundled backend language**

Remove statements that say the program packages a backend by default. Add:

```md
The desktop app no longer bundles or starts the backend service. Deploy the backend independently, then point `config/app.config.yml` at the backend host and port.
```

- [ ] **Step 2: Document backend config**

Add:

```yaml
backend:
  host: 127.0.0.1
  port: 3838
```

Explain that the client automatically requests `http://host:port`.

- [ ] **Step 3: Document Docker Compose startup**

Add:

```bash
docker compose up -d
```

Explain that `BACKEND_PORT` can be set in `.env` and that no npm compose scripts are provided.

- [ ] **Step 4: Document release/update behavior**

Add:

```md
Tagged releases publish desktop installers to GitHub Releases. The desktop app checks stable GitHub Releases for updates and can download an update package before prompting for restart.
```

## Task 10: Final Verification

**Files:**
- All touched files

- [ ] **Step 1: Run static checks**

Run:

```powershell
bunx tsc --noEmit
bunx biome check .
```

Expected: no type errors and no lint/format errors.

- [ ] **Step 2: Run tests**

Run:

```powershell
bun test
```

Expected: all tests pass.

- [ ] **Step 3: Build renderer and Electron runtime**

Run:

```powershell
bun run build:web
bun run build:electron
```

Expected: `renderer/`, `out/main/main.js`, and `out/main/preload.js` exist.

- [ ] **Step 4: Validate package no longer includes backend**

Run:

```powershell
bunx electron-builder --dir --win
```

Expected: generated unpacked app does not contain `resources/backend` or `backend/api-enhanced`.

- [ ] **Step 5: Validate Docker Compose config**

Run:

```powershell
docker compose config
```

Expected: service `netease-api` resolves with the configured port.

- [ ] **Step 6: Check git diff before final response**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only intentional implementation files changed. Existing unrelated user changes remain unstaged unless explicitly needed.

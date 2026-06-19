# Desktop Delivery and Backend Decoupling Design

## Context

Scopify currently ships as a Next.js static renderer inside an Electron app. The Electron main process is compiled with a custom SWC script, the preload script is compiled separately, and `electron-builder` packages the compiled Electron files plus the exported `renderer/` directory.

The current desktop package also builds and ships `out/backend/app.js`, then starts that backend from the Electron main process. This makes the client package responsible for a server lifecycle that should be deployed independently. The new design separates those responsibilities while keeping the existing Next.js application architecture.

This design covers one implementation scope:

- Keep Next.js as the renderer architecture.
- Move Electron main/preload build management to `electron-vite`.
- Keep `electron-builder` as the installer and GitHub Release publisher.
- Add a standard Electron updater flow backed by GitHub Releases.
- Remove the bundled/managed backend from the desktop app.
- Provide `docker-compose.yml` as a backend deployment template.
- Keep backend endpoint configuration in yml, not in the user-facing settings page.

## Goals

- Desktop builds should have clear frontend, Electron runtime, and backend deployment boundaries.
- The desktop installer must not contain or start the backend service.
- The backend endpoint must remain configurable for local, LAN, public, HTTPS, and reverse-proxy deployments.
- The build and release pipeline should use conventional Electron tooling.
- The update flow should download and install updates from stable GitHub Releases.
- The existing Next.js renderer and business pages should stay in place.

## Non-Goals

- Do not migrate the renderer from Next.js to Vite React.
- Do not add npm scripts for `docker compose up` or `docker compose down`.
- Do not expose backend host or port controls in the settings UI.
- Do not introduce beta/prerelease update channels in this pass.
- Do not redesign frontend API modules beyond the minimum required to read the new backend endpoint.

## Architecture

The target architecture has three separate pipelines:

1. Frontend pipeline
   - Next.js remains the renderer framework.
   - `next build` continues to export static assets into `renderer/`.
   - Renderer code uses a single configured backend base URL for API calls.

2. Electron runtime pipeline
   - `electron-vite` builds `main` and `preload`.
   - Electron owns desktop concerns: windows, tray, login window, config, proxy, logs, and updates.
   - Electron no longer owns backend process startup, readiness, or shutdown.

3. Backend deployment pipeline
   - The backend is an independent service.
   - `docker-compose.yml` provides a local/private deployment template.
   - The desktop app connects to the configured backend over HTTP(S).

Runtime relationship:

```text
Next.js static renderer / Electron desktop shell
        |
        | HTTP(S), configured by backend.baseUrl
        v
Independent backend service
```

## Configuration Model

Backend configuration moves to one canonical field:

```yaml
backend:
  baseUrl: "http://127.0.0.1:3838"
```

`baseUrl` is a deployment setting, not a user preference. It supports:

- Local development: `http://127.0.0.1:3838`
- LAN deployment: `http://192.168.1.10:3838`
- Public deployment: `https://api.example.com`
- Reverse proxy with path: `https://example.com/netease-api`

The old configuration shape is no longer the official model:

```yaml
backend:
  host: 127.0.0.1
  port: 3838
  autoStart: true
```

For compatibility, `normalizeAppConfig` should accept old `host` and `port` values and synthesize `baseUrl` when `baseUrl` is missing. `autoStart` should be ignored by the new runtime. Default config files and saved config should only emit `backend.baseUrl`.

The settings page should remove the backend service section. Language, window behavior, logging, proxy, and other client preferences remain in the existing config/settings model.

## Backend Deployment

`docker-compose.yml` should start the backend independently from the desktop app. It should use the existing `backend/api-enhanced` project as the build context or image source, expose the backend on a configurable host port, and set the backend service environment consistently.

The compose file should support an optional `.env` with deployment-level variables such as:

```env
BACKEND_PORT=3838
BACKEND_HOST=0.0.0.0
```

These variables belong to the deployment layer. The client still points to the deployed backend through `config/app.config.yml`:

```yaml
backend:
  baseUrl: "http://127.0.0.1:3838"
```

No `compose:up` or `compose:down` scripts should be added to `package.json`; developers and deployers can run Docker Compose directly.

## Electron Runtime Changes

Remove backend process management from the Electron app:

- Delete or retire `startManagedBackend`.
- Remove child-process spawning of `out/backend/app.js`.
- Remove backend readiness as a splash-screen gate.
- Remove backend shutdown from `before-quit` and fatal error handlers.
- Keep a thin backend endpoint helper only if IPC still needs to expose the configured backend URL.

The main window should reveal after the renderer loads. If the configured backend is unavailable, the renderer should surface request failures through existing API error handling instead of Electron blocking startup.

Cookie logic that currently derives a URL from backend host should use `backend.baseUrl` and parse its origin.

## Build System

Introduce `electron-vite` for Electron runtime builds:

- `main` and `preload` are built through `electron-vite`.
- The custom SWC-based Electron build script is removed or replaced by a small wrapper only if project-specific pre/post work is required.
- TypeScript path aliases and ESM/CJS output requirements must be handled in the electron-vite config.

Keep Next.js static export:

- `build:web` continues to run `next build`.
- Production Electron loads the generated `renderer/` directory.
- Development starts Next dev and Electron together, with Electron loading the configured dev server URL.

Suggested script direction:

```json
{
  "dev:web": "bun script/dev-web.ts",
  "dev:electron": "electron-vite dev",
  "dev": "concurrently ...",
  "build:web": "next build",
  "build:electron": "electron-vite build",
  "build:win": "bun run build:web && bun run build:electron && electron-builder -- win",
  "build:mac": "bun run build:web && bun run build:electron && electron-builder -- mac"
}
```

Do not keep `build:backend` in desktop build scripts.

## Packaging

`electron-builder` should continue to package:

- Electron runtime output.
- `renderer/`.
- `public/` if still required.
- `resources/`.
- `config/`.
- `package.json`.

It should no longer package:

- `out/backend`.
- `backend/api-enhanced`.
- Any compiled backend entry.

`extraResources` should keep config and resources, but remove backend resources.

## Publish and Update Flow

Continue using GitHub Releases as the stable release channel:

- Tag pushes matching `v*` trigger CI.
- CI installs dependencies, builds the Next renderer, builds Electron runtime, and publishes installers to GitHub Releases through `electron-builder`.
- The existing changelog extraction can remain.

Add `electron-updater` in the main process:

- Check for updates after app startup, without blocking the first window.
- Log update check errors without interrupting app use.
- Notify renderer when an update is available.
- Download the update after user confirmation.
- Notify renderer when the update is downloaded.
- Restart and install after user confirmation.

Updater states exposed through IPC:

- `idle`
- `checking`
- `available`
- `not-available`
- `downloading`
- `downloaded`
- `error`

The first pass should follow stable GitHub Releases only. Prerelease/beta channels can be added later.

## UI and IPC

The settings UI should remove backend controls. It may later gain an update status surface, but this implementation can keep update prompts simple and focused:

- A toast/dialog when an update is available.
- A progress state while downloading if easy to expose.
- A restart/install prompt after download.

IPC should provide a small updater API, for example:

- `updater:check`
- `updater:download`
- `updater:quit-and-install`
- `updater:get-status`
- `updater:status-changed`

Exact names can follow existing preload conventions.

## Testing and Verification

Verification should cover:

- Config normalization accepts new `backend.baseUrl`.
- Old `backend.host` and `backend.port` synthesize `baseUrl`.
- Request base URL uses `backend.baseUrl`.
- Electron build output is generated by `electron-vite`.
- Desktop package no longer contains backend artifacts.
- `docker compose config` validates the backend compose file.
- Release workflow no longer runs `build:backend`.
- Updater IPC can be exercised in development without crashing when no release metadata is available.

## Migration Notes

Existing users with old yml config should not be broken immediately. On load:

1. If `backend.baseUrl` exists, use it.
2. If missing, synthesize it from old `backend.host` and `backend.port`.
3. Ignore `backend.autoStart`.
4. When config is saved, write only `backend.baseUrl`.

Documentation should explain:

- The desktop app no longer bundles the backend.
- Deploy the backend separately.
- Use Docker Compose for local/private backend startup.
- Set `backend.baseUrl` in yml to the backend endpoint.
- GitHub Releases provide desktop downloads and update metadata.

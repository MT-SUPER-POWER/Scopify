# Desktop Wallpaper Host Spike

> PROTOTYPE — throw this implementation away after it answers the host-feasibility question.

## Question

Can a real Electron `BrowserWindow` keep presenting Chromium frames after its Windows `HWND` is attached behind Explorer's desktop icon layer on the current Windows host, while desktop selection, context menus, `Win + D`, and the original wallpaper remain safe?

This spike deliberately stops before Folia, playback IPC, persistence, multi-monitor support, or production packaging. A failed host probe destroys the test window instead of falling back to an ordinary fullscreen window.

## Run

From the repository root:

```powershell
bun run prototype:desktop-wallpaper
```

To exercise transparent composition:

```powershell
bun run prototype:desktop-wallpaper -- --transparent
```

To opt into the temporary static Windows-wallpaper fallback used by taskbar and Mica surfaces:

```powershell
bun run prototype:desktop-wallpaper -- --system-fallback
```

The fallback command journals the current single-monitor static wallpaper, makes an ASCII-path recovery copy, applies a captured PNG only while the spike is running, and conditionally restores the original path on exit. It refuses slideshow and multi-monitor configurations. Do not combine `--system-fallback` with `--transparent`.

When the Web development server is unavailable, use the last verified desktop renderer artifact:

```powershell
bun run prototype:desktop-wallpaper -- --system-fallback --static
```

The command starts the normal Web and Electron development processes, then creates one non-focusable test window on the primary display. Stop it with `Ctrl+C` in the terminal.

The native host treats the Electron display bounds as a fail-closed invariant. If reparenting or Win32 non-client styles shrink the HWND to the Windows work area, the renderer is destroyed instead of accepting a partial desktop surface.

## Taskbar and Windows wallpaper

The live renderer covers the complete display bounds, including the pixels geometrically underneath the taskbar. The Windows 11 taskbar and Mica surfaces are separate Shell surfaces and may still render the registered static Windows wallpaper rather than continuously sampling this WorkerW child window.

The planned product architecture therefore combines this dynamic host with an opt-in static fallback generated from the active Folia background and applied through `IDesktopWallpaper`. This spike does not change the user's system wallpaper. See [the Windows hosting research](../../../../../docs/research/windows-live-wallpaper-hosting.md#35-系统壁纸任务栏与-windows-11-材质).

To probe the current Explorer topology without starting Electron:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File frontend/apps/desktop/prototypes/desktop-wallpaper-host-spike/host.ps1 -Action Probe
```

## Manual verdict

Record pass/fail for each item before any of this code is promoted:

- Chromium animation continues behind desktop icons.
- Desktop icons, drag selection, blank-area right-click, refresh, and `Win + D` still work.
- Transparent mode reveals the existing Windows wallpaper between the animated shapes.
- The spike window never appears in Alt+Tab or the taskbar and never takes focus.
- Stopping the process restores the desktop without leaving a visible ordinary window.
- Restarting Explorer either removes the spike safely or demonstrates that re-attachment is required.

This branch is evidence for a later implementation decision, not the implementation itself.

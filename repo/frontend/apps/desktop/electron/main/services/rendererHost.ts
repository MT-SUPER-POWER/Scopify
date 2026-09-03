import { join } from "node:path";

import { app, type BrowserWindow } from "electron";
import serve from "electron-serve";

import { verifyRendererArtifact } from "@/lib/rendererArtifact";
import type { DesktopRendererHost } from "@/types/electronWindow";
import { __rendererDir, desktopConfig, logger } from "@main/constants";

/** Owns the difference between the development server and the verified packaged Renderer. */
export function createDesktopRendererHost(): DesktopRendererHost {
  const useStaticRenderer = app.isPackaged || process.env.ELECTRON_RENDERER_MODE === "static";
  const developmentUrl = `http://${desktopConfig.frontend.host}:${desktopConfig.frontend.devPort}`;
  const serveStaticRenderer = useStaticRenderer ? serve({ directory: __rendererDir }) : null;

  return {
    baseUrl: useStaticRenderer ? "app://-/" : developmentUrl,
    async load(window) {
      if (!serveStaticRenderer) {
        window.webContents.on("did-fail-load", (_event, code, description) => {
          logger.error("[renderer] development page failed to load", { code, description });
          if (!window.isDestroyed()) window.webContents.reloadIgnoringCache();
        });
        await window.loadURL(developmentUrl);
        return;
      }

      try {
        await serveStaticRenderer(window);
      } catch (error) {
        logger.error("[renderer] app protocol failed; loading the static entry directly", error);
        if (!window.isDestroyed()) await window.loadFile(join(__rendererDir, "index.html"));
      }
    },
    verify: () => (useStaticRenderer ? verifyRendererArtifact(__rendererDir) : null),
  };
}

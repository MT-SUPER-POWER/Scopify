import { isAbsolute, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { app, shell } from "electron";
import { __rendererDir } from "@main/constants";
import { windowLog } from "@main/utils/logger";

/** Open external web links through the system browser. */
export async function openExternalLink(value: string): Promise<void> {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") return;
  await shell.openExternal(url.href);
}

/** Hand website navigation to the OS before Electron can create or replace an app window. */
export function registerExternalLinkHandling(rendererBaseUrl: string) {
  const rendererUrl = new URL(rendererBaseUrl);

  const isRendererUrl = (value: string) => {
    try {
      const url = new URL(value);
      if (url.protocol === "file:") {
        const rendererPath = relative(__rendererDir, fileURLToPath(url));
        return (
          rendererPath !== ".." &&
          !rendererPath.startsWith("../") &&
          !rendererPath.startsWith("..\\") &&
          !isAbsolute(rendererPath)
        );
      }
      return url.protocol === rendererUrl.protocol && url.host === rendererUrl.host;
    } catch {
      return false;
    }
  };

  const openInDefaultBrowser = (value: string) => {
    try {
      void openExternalLink(value).catch((error: unknown) => {
        windowLog.warn("[external-links] failed to open the default browser", error);
      });
    } catch {
      // Invalid URLs and non-web protocols must never create a renderer window.
    }
  };

  app.on("web-contents-created", (_event, contents) => {
    if (contents.getType() !== "window") return;

    // Covers target=_blank, middle clicks and window.open without creating a blank child window.
    contents.setWindowOpenHandler(({ url }) => {
      if (!isRendererUrl(url)) openInDefaultBrowser(url);
      return { action: "deny" };
    });

    // Covers target=_self and renderer-triggered location changes.
    contents.on("will-navigate", (event) => {
      if (isRendererUrl(event.url)) return;
      event.preventDefault();
      openInDefaultBrowser(event.url);
    });

    contents.on("will-redirect", (event) => {
      if (!event.isMainFrame || isRendererUrl(event.url)) return;
      event.preventDefault();
      openInDefaultBrowser(event.url);
    });
  });
}

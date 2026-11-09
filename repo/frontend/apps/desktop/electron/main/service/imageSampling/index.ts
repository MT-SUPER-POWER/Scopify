import { session } from "electron";

/**
 * Hosts of QQ Music artwork. Their CDN answers without CORS headers, so the renderer cannot
 * read the pixels it needs to pick a page's theme color from a cover; the header is added to
 * those image responses only.
 */
const QQ_IMAGE_HOST = /(^|\.)(gtimg\.cn|qpic\.cn|y\.qq\.com)$/i;

/** Lets the renderer sample the colors of QQ Music covers. Call once, before windows load. */
export function registerImageSampling() {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ["https://*.gtimg.cn/*", "https://*.qpic.cn/*", "https://*.y.qq.com/*"] },
    (details, callback) => {
      let host = "";
      try {
        host = new URL(details.url).hostname;
      } catch {
        callback({});
        return;
      }
      if (details.resourceType !== "image" || !QQ_IMAGE_HOST.test(host)) {
        callback({});
        return;
      }
      const headers = { ...details.responseHeaders };
      for (const name of Object.keys(headers)) {
        if (name.toLowerCase() === "access-control-allow-origin") delete headers[name];
      }
      headers["Access-Control-Allow-Origin"] = ["*"];
      callback({ responseHeaders: headers });
    },
  );
}

import { createBrowserRuntime } from "./adapters/browser";
import { createElectronRuntime } from "./adapters/electron";
import { installRendererConsoleBridge } from "./consoleBridge";

export type * from "./types";

/**
 * 供首帧前内联脚本（lib/layout/layoutBootScript.ts）判断是否运行在桌面端的表达式。
 * 桥接发现逻辑只允许出现在本文件，因此以字符串形式导出，而不是在其他模块里直接访问。
 */
export const DESKTOP_RUNTIME_PROBE_EXPRESSION = "Boolean(window.electronAPI)";

/** Composition root: the only Web module allowed to discover the preload bridge. */
export function createRuntimeForWindow(rendererWindow: Pick<Window, "electronAPI"> | undefined) {
  if (rendererWindow?.electronAPI) {
    const runtime = createElectronRuntime(rendererWindow.electronAPI);
    installRendererConsoleBridge(runtime.logging);
    return runtime;
  }
  return createBrowserRuntime();
}

const runtime = createRuntimeForWindow(typeof window === "undefined" ? undefined : window);

export { runtime };

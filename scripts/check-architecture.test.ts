import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { findForbiddenDesktopImports, findForbiddenWebRuntimeUsage } from "./check-architecture";

const repositoryRoot = resolve("D:/workspace/Scopify");

describe("Web Runtime boundary", () => {
  test("rejects direct Electron access from Web UI", () => {
    const violations = findForbiddenWebRuntimeUsage(
      "repo/frontend/apps/web/components/Header.tsx",
      "window.electronAPI?.minimize(); const desktop = IS_ELECTRON || isElectron(); const web = IS_WEB;",
    );

    expect(violations.map(({ message }) => message)).toEqual([
      "window.electronAPI is only allowed in the Web Runtime composition root",
      "IS_ELECTRON is only allowed in the Web Runtime composition root",
      "IS_WEB is only allowed in the Web Runtime composition root",
      "isElectron() is only allowed in the Web Runtime composition root",
    ]);
  });

  test("allows Electron discovery in the composition root", () => {
    expect(
      findForbiddenWebRuntimeUsage(
        "repo/frontend/apps/web/lib/runtime/index.ts",
        "const bridge = window.electronAPI;",
      ),
    ).toEqual([]);
  });
});

describe("Desktop ownership boundary", () => {
  test("rejects package and relative imports into Web", () => {
    const desktopFile = resolve(repositoryRoot, "repo/frontend/apps/desktop/main/main.ts");
    const violations = findForbiddenDesktopImports(
      repositoryRoot,
      desktopFile,
      [
        'import web from "@scopify/web";',
        'import page from "../../web/app/page";',
        'export { thing } from "../../../repo/frontend/apps/web/lib/thing";',
      ].join("\n"),
    );

    expect(violations).toHaveLength(3);
  });

  test("allows the versioned Desktop contract", () => {
    const desktopFile = resolve(repositoryRoot, "repo/frontend/apps/desktop/main/preload.ts");
    expect(
      findForbiddenDesktopImports(
        repositoryRoot,
        desktopFile,
        'import type { DesktopBridge } from "@scopifymusicplayer/desktop-contract";',
      ),
    ).toEqual([]);
  });
});

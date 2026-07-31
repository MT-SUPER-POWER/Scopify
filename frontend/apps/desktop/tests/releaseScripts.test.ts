import { expect, test } from "bun:test";

import desktopPackage from "../package.json";

test.each(["package:win", "package:mac"] as const)(
  "%s disables electron-builder implicit publishing",
  (scriptName) => {
    expect(desktopPackage.scripts[scriptName]).toContain("--publish never");
  },
);

test.each(["release:win", "release:mac"] as const)(
  "%s keeps explicit electron-builder publishing",
  (scriptName) => {
    expect(desktopPackage.scripts[scriptName]).toContain("--publish always");
  },
);

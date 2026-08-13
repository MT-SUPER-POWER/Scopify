import { expect, test } from "bun:test";

import desktopPackage from "../package.json";

test("desktop package declares the repository used for update metadata", () => {
  expect(desktopPackage).toMatchObject({
    repository: {
      directory: "repo/frontend/apps/desktop",
      type: "git",
      url: "https://github.com/MT-SUPER-POWER/Scopify.git",
    },
  });
});

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

test("desktop packaging includes the wallpaper PowerShell hosts as resources", () => {
  expect(desktopPackage.build.extraResources).toContainEqual({
    filter: ["**/*.ps1"],
    from: "prototypes/desktop-wallpaper-host-spike",
    to: "desktop-wallpaper-host-spike",
  });
});

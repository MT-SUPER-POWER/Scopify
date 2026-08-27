import { expect, test } from "bun:test";

import { isDesktopAuxiliaryRoute } from "@/lib/runtime/desktopRoute";

test("keeps global backend notifications out of narrow companion windows", () => {
  expect(isDesktopAuxiliaryRoute("/tray/")).toBeTrue();
  expect(isDesktopAuxiliaryRoute("/desktop-lyrics")).toBeTrue();
  expect(isDesktopAuxiliaryRoute("/desktop-playback-controller/")).toBeTrue();
  expect(isDesktopAuxiliaryRoute("/desktop-wallpaper")).toBeTrue();
  expect(isDesktopAuxiliaryRoute("/app-close")).toBeTrue();
  expect(isDesktopAuxiliaryRoute("/login")).toBeTrue();
  expect(isDesktopAuxiliaryRoute("/")).toBeFalse();
  expect(isDesktopAuxiliaryRoute("/setting")).toBeFalse();
});

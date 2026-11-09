import { expect, test } from "bun:test";

import { hrefCapability, routeCapability } from "@/lib/providers/routeCapability";

test("maps routes and their sub-paths to the capability they need", () => {
  expect(routeCapability("/")).toBe("home");
  expect(routeCapability("/cloud")).toBe("cloud");
  expect(routeCapability("/cloud/")).toBe("cloud");
  expect(routeCapability("/recent/report")).toBe("history");
  expect(routeCapability("/social/event")).toBe("social");
  expect(routeCapability("/setting/devices")).toBe("devices");
});

test("leaves routes every platform can show unrestricted", () => {
  expect(routeCapability("/setting")).toBeNull();
  expect(routeCapability("/me")).toBeNull();
  expect(routeCapability("/cloudy")).toBeNull();
});

test("ignores the query and hash of a link", () => {
  expect(hrefCapability("/playlist?id=1")).toBe("playlist.read");
  expect(hrefCapability("/setting?tab=network")).toBeNull();
  expect(hrefCapability("/#top")).toBe("home");
});

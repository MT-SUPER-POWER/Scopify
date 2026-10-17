import { describe, expect, it } from "bun:test";

import { isPersonalFmRoute } from "@/constants/personalFm";

describe("isPersonalFmRoute", () => {
  it("matches the web route and the desktop trailing-slash export route", () => {
    expect(isPersonalFmRoute("/personal-fm")).toBe(true);
    expect(isPersonalFmRoute("/personal-fm/")).toBe(true);
  });

  it("rejects other routes", () => {
    expect(isPersonalFmRoute("/")).toBe(false);
    expect(isPersonalFmRoute("/personal-fm-other")).toBe(false);
    expect(isPersonalFmRoute(null)).toBe(false);
  });
});

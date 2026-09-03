import { describe, expect, test } from "bun:test";

import { parseWindowsDesktopIconVisibilityResult } from "../main/capabilities/desktopIcons/result";

describe("Windows desktop icon visibility result", () => {
  test("accepts a confirmed Explorer visibility state", () => {
    expect(
      parseWindowsDesktopIconVisibilityResult(
        '{"Changed":false,"DefView":10,"ListView":11,"Message":"read","Ok":true,"Supported":true,"Visible":true}',
        "",
        0,
      ),
    ).toEqual({ supported: true, visible: true });
  });

  test("preserves the observed state when Explorer rejects an update", () => {
    expect(
      parseWindowsDesktopIconVisibilityResult(
        '{"Changed":false,"DefView":10,"ListView":11,"Message":"rejected","Ok":false,"Supported":true,"Visible":false}',
        "",
        2,
      ),
    ).toEqual({
      diagnostic: "rejected",
      supported: true,
      visible: false,
    });
  });

  test("reports malformed or missing shell output as unsupported", () => {
    expect(parseWindowsDesktopIconVisibilityResult("", "no output", 1)).toEqual({
      diagnostic: "no output",
      supported: false,
      visible: null,
    });
    expect(parseWindowsDesktopIconVisibilityResult("not-json", "", 1)).toEqual({
      diagnostic: expect.stringContaining("invalid JSON"),
      supported: false,
      visible: null,
    });
  });
});

import { describe, expect, test } from "bun:test";

describe("shared UI Tailwind sources", () => {
  test("scans shared shadcn and Scopify component classes", async () => {
    const globalStyles = await Bun.file("app/globals.css").text();

    expect(globalStyles).toContain('@source "../../../packages/ui/shadcn/components"');
    expect(globalStyles).toContain('@source "../../../packages/ui/scopify/components"');
  });
});

import { describe, expect, it } from "bun:test";
import { normalizeToolDirectory, validateToolDirectory } from "../skill-tool-targets";

describe("skill-tool-targets script", () => {
  it("normalizes tool directory paths", () => {
    expect(normalizeToolDirectory("./.my-ai/skills")).toBe(".my-ai/skills");
    expect(normalizeToolDirectory(".my-ai\\skills\\")).toBe(".my-ai/skills");
  });

  it("rejects root skills directory or invalid names", () => {
    expect(() => normalizeToolDirectory("skills")).toThrow();
    expect(() => normalizeToolDirectory("skills/nested")).toThrow();
    expect(() => normalizeToolDirectory(".git/skills")).toThrow();
  });

  it("detects overlapping tool directories", () => {
    const existing = [{ label: "Cursor", directory: ".cursor/skills" }];
    expect(() => validateToolDirectory(".cursor/skills", existing)).toThrow("重叠");
    expect(() => validateToolDirectory(".cursor/skills/sub", existing)).toThrow("重叠");
    expect(() => validateToolDirectory(".my-ai/skills", existing)).not.toThrow();
  });
});

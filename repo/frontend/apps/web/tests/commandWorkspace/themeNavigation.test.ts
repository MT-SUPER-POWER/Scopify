import { describe, expect, it } from "bun:test";
import { COMMAND_WORKSPACE_ROOT_PAGES } from "@/constants/commandWorkspaceRoot";

describe("command workspace theme navigation", () => {
  it("registers theme as a navigable workspace page", () => {
    const themeEntry = COMMAND_WORKSPACE_ROOT_PAGES.find((item) => item.page === "theme");
    expect(themeEntry).toBeDefined();
    expect(themeEntry?.id).toBe("theme");
    expect(themeEntry?.label).toBe("外观与主题");
  });

  it("does not contain the legacy hardcoded toggle action in root pages", () => {
    const pageIds: readonly string[] = COMMAND_WORKSPACE_ROOT_PAGES.map((item) => item.id);
    expect(pageIds.includes("toggle-app-theme")).toBe(false);
  });
});

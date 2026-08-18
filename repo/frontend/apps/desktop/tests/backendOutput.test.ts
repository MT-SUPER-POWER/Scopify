import { expect, test } from "bun:test";

import { formatBackendChildOutput, formatBackendLogEntry } from "@/main/module/backendOutput";

test("preserves multiline backend output while removing terminal controls", () => {
  expect(
    formatBackendChildOutput(Buffer.from("\u001b[31m\n    ███╗   ██╗\n    ████╗  ██║\n\u001b[0m")),
  ).toBe("███╗   ██╗\n████╗  ██║");
});

test("puts the backend scope on its own line for multiline output", () => {
  expect(formatBackendLogEntry("SCOPIFY\nBACKEND")).toBe("[backend]\nSCOPIFY\nBACKEND");
  expect(formatBackendLogEntry("ready")).toBe("[backend] ready");
});

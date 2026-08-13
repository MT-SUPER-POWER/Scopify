import type { DesktopIconVisibilityState } from "@mt-super-power/desktop-contract";
import { z } from "zod";

const WINDOWS_DESKTOP_ICON_RESULT_SCHEMA = z.object({
  Changed: z.boolean(),
  DefView: z.number(),
  ListView: z.number(),
  Message: z.string(),
  Ok: z.boolean(),
  Supported: z.boolean(),
  Visible: z.boolean().nullable(),
});

export function parseWindowsDesktopIconVisibilityResult(
  stdout: string,
  stderr: string,
  exitCode: number | null,
): DesktopIconVisibilityState {
  const lastOutputLine = stdout.trim().split(/\r?\n/).at(-1);
  if (!lastOutputLine) {
    return {
      diagnostic: stderr.trim() || "Windows desktop icon control returned no result.",
      supported: false,
      visible: null,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(lastOutputLine);
  } catch (error) {
    return {
      diagnostic: `Windows desktop icon control returned invalid JSON: ${String(error)}`,
      supported: false,
      visible: null,
    };
  }

  const result = WINDOWS_DESKTOP_ICON_RESULT_SCHEMA.safeParse(parsed);
  if (!result.success) {
    return {
      diagnostic: result.error.message,
      supported: false,
      visible: null,
    };
  }

  const { Message, Ok, Supported, Visible } = result.data;
  if (Ok && exitCode === 0 && Supported && Visible !== null) {
    return { supported: true, visible: Visible };
  }

  return {
    diagnostic: Message || stderr.trim() || "Windows desktop icon control failed.",
    supported: Supported,
    visible: Visible,
  };
}

import { afterAll, expect, test } from "bun:test";
import {
  getShortcutBindingFromEvent,
  getShortcutBindingLabel,
  getShortcutBindingParts,
  isShortcutBindingMatch,
} from "@/lib/shortcuts/bindings";

const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
afterAll(() => {
  if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
  else Reflect.deleteProperty(globalThis, "navigator");
});

function setPlatform(platform: string) {
  Object.defineProperty(globalThis, "navigator", { value: { platform }, configurable: true });
}

test("macOS displays key symbols while preserving existing bindings and physical key codes", () => {
  setPlatform("MacIntel");
  const binding = { key: "KeyL", primary: true, alt: true };
  expect(getShortcutBindingParts(binding)).toEqual(["⌘", "⌥", "L"]);
  expect(getShortcutBindingLabel(binding)).toBe("⌘ ⌥ L");
  expect(getShortcutBindingLabel({ key: "KeyD", primary: true, shift: true })).toBe("⌘ ⇧ D");
  expect(getShortcutBindingParts({ key: "ArrowLeft", primary: true })).toEqual(["⌘", "←"]);
  expect(getShortcutBindingLabel({ key: "Enter" })).toBe("↩");
  expect(getShortcutBindingLabel({ key: "Escape" })).toBe("⎋");
  expect(getShortcutBindingLabel({ key: "Space" })).toBe("␣");
  // Option can produce a different character; matching and recording use event.code.
  const event = {
    code: "KeyL",
    key: "¬",
    metaKey: true,
    ctrlKey: false,
    altKey: true,
    shiftKey: false,
  } as KeyboardEvent;
  expect(getShortcutBindingFromEvent(event)).toEqual(binding);
  expect(isShortcutBindingMatch(binding, event)).toBe(true);
  expect(isShortcutBindingMatch(binding, { ...event, altKey: false } as KeyboardEvent)).toBe(false);
  expect(getShortcutBindingFromEvent({ ...event, code: "AltLeft" } as KeyboardEvent)).toBeNull();
});

test.each(["Win32", "Linux x86_64"])(
  "%s keeps Ctrl and Alt labels and event handling",
  (platform) => {
    setPlatform(platform);
    const binding = { key: "Comma", primary: true, alt: true };
    expect(getShortcutBindingParts(binding)).toEqual(["Ctrl", "Alt", ","]);
    expect(getShortcutBindingLabel(binding)).toBe("Ctrl Alt ,");
    expect(getShortcutBindingLabel({ key: "KeyD", primary: true, shift: true })).toBe("Ctrl ⇧ D");
    expect(getShortcutBindingLabel({ key: "Enter" })).toBe("↵");
    expect(getShortcutBindingLabel({ key: "Escape" })).toBe("Esc");
    const event = {
      code: "Comma",
      metaKey: false,
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
    } as KeyboardEvent;
    expect(getShortcutBindingFromEvent(event)).toEqual(binding);
    expect(isShortcutBindingMatch(binding, event)).toBe(true);
  },
);

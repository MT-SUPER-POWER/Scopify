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
  "%s uses shared symbols while retaining Control as its primary modifier",
  (platform) => {
    setPlatform(platform);
    const binding = { key: "Comma", primary: true, alt: true };
    expect(getShortcutBindingParts(binding)).toEqual(["⌃", "⌥", ","]);
    expect(getShortcutBindingLabel(binding)).toBe("⌃ ⌥ ,");
    expect(getShortcutBindingLabel({ key: "KeyD", primary: true, shift: true })).toBe("⌃ ⇧ D");
    expect(getShortcutBindingLabel({ key: "Enter" })).toBe("↩");
    expect(getShortcutBindingLabel({ key: "Escape" })).toBe("⎋");
    const event = {
      code: "Comma",
      metaKey: false,
      ctrlKey: true,
      altKey: true,
      shiftKey: false,
    } as KeyboardEvent;
    expect(getShortcutBindingLabel({ key: "ControlLeft" })).toBe("⌃");
    expect(getShortcutBindingFromEvent(event)).toEqual(binding);
    expect(isShortcutBindingMatch(binding, event)).toBe(true);
    expect(
      isShortcutBindingMatch(binding, { ...event, ctrlKey: false, metaKey: true } as KeyboardEvent),
    ).toBe(false);
  },
);

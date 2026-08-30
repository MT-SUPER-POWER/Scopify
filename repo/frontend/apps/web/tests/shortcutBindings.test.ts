import { describe, expect, test } from "bun:test";
import {
  areShortcutBindingsEqual,
  findShortcutConflict,
  getEffectiveShortcutBinding,
  getShortcutBindingParts,
  isShortcutBindingMatch,
} from "@/lib/shortcuts/bindings";

describe("shortcut bindings", () => {
  test("uses the built-in binding when a command has no override", () => {
    expect(getEffectiveShortcutBinding("open-search", {})).toEqual({ key: "KeyK", primary: true });
  });

  test("honors a disabled command override", () => {
    expect(getEffectiveShortcutBinding("open-search", { "open-search": null })).toBeNull();
  });

  test("splits each modifier into an individual keycap", () => {
    expect(getShortcutBindingParts({ key: "KeyP", primary: true, shift: true })).toEqual([
      "Ctrl",
      "Shift",
      "P",
    ]);
  });

  test("finds conflicts against effective bindings", () => {
    expect(findShortcutConflict("toggle-sidebar", { key: "KeyK", primary: true }, {})).toBe(
      "open-search",
    );
  });

  test("compares bindings by key and every modifier", () => {
    expect(
      areShortcutBindingsEqual(
        { key: "KeyM", primary: true, shift: true },
        { key: "KeyM", primary: true, shift: true },
      ),
    ).toBeTrue();
    expect(
      areShortcutBindingsEqual(
        { key: "KeyM", primary: true, shift: true },
        { key: "KeyM", primary: true, alt: true },
      ),
    ).toBeFalse();
  });

  test("matches only the registered combination", () => {
    const binding = { key: "KeyK", primary: true };
    expect(
      isShortcutBindingMatch(binding, {
        code: "KeyK",
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
      } as KeyboardEvent),
    ).toBeTrue();
    expect(
      isShortcutBindingMatch(binding, {
        code: "KeyK",
        ctrlKey: true,
        metaKey: false,
        altKey: true,
        shiftKey: false,
      } as KeyboardEvent),
    ).toBeFalse();
  });
});

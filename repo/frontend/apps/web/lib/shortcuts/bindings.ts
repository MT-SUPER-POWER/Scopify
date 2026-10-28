import { SHORTCUT_KEY_LABELS } from "@/constants/shortcutKeys";
import { getCommandDefinition, SHORTCUT_COMMANDS } from "@/constants/shortcuts";
import type {
  ShortcutBinding,
  ShortcutCommandId,
  ShortcutOverrides,
} from "@/types/shortcuts/model";

export function getEffectiveShortcutBinding(
  commandId: ShortcutCommandId,
  overrides: ShortcutOverrides,
): ShortcutBinding | null {
  if (commandId in overrides) return overrides[commandId] ?? null;
  return getCommandDefinition(commandId)?.defaultBinding ?? null;
}

export function getShortcutBindingLabel(binding: ShortcutBinding | null): string {
  return getShortcutBindingParts(binding).join(isMacPlatform() ? " " : " + ");
}

export function getShortcutBindingParts(binding: ShortcutBinding | null): string[] {
  if (!binding) return [];

  const mac = isMacPlatform();
  return [
    binding.primary ? (mac ? "⌘" : "Ctrl") : null,
    binding.alt ? (mac ? "⌥" : "Alt") : null,
    binding.shift ? (mac ? "⇧" : "Shift") : null,
    getKeyLabel(binding.key),
  ].filter((part): part is string => Boolean(part));
}

export function getShortcutBindingFromEvent(event: KeyboardEvent): ShortcutBinding | null {
  if (isModifierKey(event.code)) return null;

  const primary = isMacPlatform() ? event.metaKey : event.ctrlKey;
  const binding: ShortcutBinding = {
    key: event.code,
    ...(primary ? { primary: true } : {}),
    ...(event.altKey ? { alt: true } : {}),
    ...(event.shiftKey ? { shift: true } : {}),
  };

  const isSingleKeyAllowed =
    binding.key === "Space" || binding.key === "Home" || binding.key.startsWith("Arrow");
  if (!binding.primary && !binding.alt && !binding.shift && !isSingleKeyAllowed) return null;
  return binding;
}

export function isShortcutBindingMatch(binding: ShortcutBinding, event: KeyboardEvent): boolean {
  const primary = isMacPlatform() ? event.metaKey : event.ctrlKey;

  return (
    binding.key === event.code &&
    Boolean(binding.primary) === primary &&
    Boolean(binding.alt) === event.altKey &&
    Boolean(binding.shift) === event.shiftKey
  );
}

export function areShortcutBindingsEqual(
  first: ShortcutBinding | null,
  second: ShortcutBinding | null,
): boolean {
  return (
    first?.key === second?.key &&
    Boolean(first?.primary) === Boolean(second?.primary) &&
    Boolean(first?.alt) === Boolean(second?.alt) &&
    Boolean(first?.shift) === Boolean(second?.shift)
  );
}

export function findShortcutConflict(
  commandId: ShortcutCommandId,
  binding: ShortcutBinding,
  overrides: ShortcutOverrides,
): ShortcutCommandId | null {
  return (
    SHORTCUT_COMMANDS.find(
      (command) =>
        command.id !== commandId &&
        areShortcutBindingsEqual(getEffectiveShortcutBinding(command.id, overrides), binding),
    )?.id ?? null
  );
}

function getKeyLabel(key: string) {
  if (!isMacPlatform()) {
    if (key === "Space") return "Space";
    if (key === "Enter" || key === "NumpadEnter") return "Enter";
    if (key === "Escape") return "Esc";
    if (key === "Backspace") return "Backspace";
    if (key === "Delete") return "Delete";
    if (key === "Tab") return "Tab";
    if (key === "ControlLeft" || key === "ControlRight") return "Ctrl";
    if (key === "MetaLeft" || key === "MetaRight") return "Win";
  }
  if (SHORTCUT_KEY_LABELS[key]) return SHORTCUT_KEY_LABELS[key];
  if (key === "Enter" || key === "NumpadEnter") return "↩";
  if (key === "Escape") return "⎋";
  if (key === "ControlLeft" || key === "ControlRight") return "⌃";
  if (key === "MetaLeft" || key === "MetaRight") return isMacPlatform() ? "⌘" : "⊞";
  if (key.startsWith("Key")) return key.slice(3);
  if (key.startsWith("Digit")) return key.slice(5);
  return key.replace(/^Numpad/, "Num ");
}

function isMacPlatform() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
}

function isModifierKey(code: string) {
  return [
    "ControlLeft",
    "ControlRight",
    "MetaLeft",
    "MetaRight",
    "AltLeft",
    "AltRight",
    "ShiftLeft",
    "ShiftRight",
  ].includes(code);
}

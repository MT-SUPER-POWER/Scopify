import { SHORTCUT_COMMANDS } from "@/constants/shortcuts";
import type { ShortcutBinding, ShortcutCommandId, ShortcutOverrides } from "@/types/shortcuts";

const KEY_LABELS: Record<string, string> = {
  Space: "Space",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Slash: "/",
  Comma: ",",
};

export function getEffectiveShortcutBinding(
  commandId: ShortcutCommandId,
  overrides: ShortcutOverrides,
): ShortcutBinding | null {
  if (commandId in overrides) return overrides[commandId] ?? null;
  return SHORTCUT_COMMANDS.find((command) => command.id === commandId)?.defaultBinding ?? null;
}

export function getShortcutBindingLabel(binding: ShortcutBinding | null): string {
  return getShortcutBindingParts(binding).join(" + ");
}

export function getShortcutBindingParts(binding: ShortcutBinding | null): string[] {
  if (!binding) return [];

  const modifier = isMacPlatform() ? "Cmd" : "Ctrl";
  return [
    binding.primary ? modifier : null,
    binding.alt ? "Alt" : null,
    binding.shift ? "Shift" : null,
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

  const isSingleKeyAllowed = binding.key === "Space" || binding.key.startsWith("Arrow");
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
  if (KEY_LABELS[key]) return KEY_LABELS[key];
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

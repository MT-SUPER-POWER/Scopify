import type { IconNode, LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";

// src/services/lucideIconResolver.ts
// Resolves a theme's lyricsIcons entry (a PascalCase lucide name) to an icon or its SVG node data.
// Folia loads each icon on demand through lucide's dynamicIconImports; Scopify's other stage
// modes (GeometricBackground, Monet, Pendolo, Sonnet) already import the whole set statically, so
// this keeps Folia's API with every icon present from the start: loadLucideIcons settles at once.

const isLucideIcon = (value: unknown): value is LucideIcon =>
  typeof value === "object" && value !== null && "$$typeof" in value && "render" in value;

const ICONS_BY_NAME = new Map<string, LucideIcon>();
const NAMES_BY_LOWERCASE = new Map<string, string>();
Object.entries(LucideIcons).forEach(([name, candidate]) => {
  if (!/^[A-Z]/.test(name) || !isLucideIcon(candidate)) return;
  ICONS_BY_NAME.set(name, candidate);
  if (!NAMES_BY_LOWERCASE.has(name.toLowerCase())) NAMES_BY_LOWERCASE.set(name.toLowerCase(), name);
});

const trimName = (name: unknown) => (typeof name === "string" ? name.trim() : "");

/** Kept for Folia's call sites: every icon is bundled, so there is nothing to wait for. */
export const loadLucideIcons = async (_names: readonly unknown[] | undefined): Promise<void> => {};

/** The icon component for an exact export name, or null when lucide has no such icon. */
export const resolveLucideIcon = (name: string | null | undefined): LucideIcon | null =>
  ICONS_BY_NAME.get(trimName(name)) ?? null;

/**
 * The icon's SVG node data (lucide's IconNode: [tag, attrs, children?][]) for an exact export
 * name, or null when it is unknown. For canvas / Pixi renderers that draw the shapes themselves
 * (花火's icon stickers). The component is a forwardRef whose render only calls createElement
 * with the node data (`iconNode`, or `icon.node` from 1.48 on) and runs no hooks, so calling it
 * directly yields the nodes without rendering an SVG.
 */
export const resolveLucideIconNode = (name: string | null | undefined): IconNode | null => {
  const icon = resolveLucideIcon(name) as unknown as {
    render?: (props: object, ref: null) => unknown;
  } | null;
  if (!icon || typeof icon.render !== "function") return null;
  try {
    const element = icon.render({}, null) as {
      props?: { iconNode?: unknown; icon?: { node?: unknown } };
    } | null;
    const node = element?.props?.iconNode ?? element?.props?.icon?.node;
    return Array.isArray(node) ? (node as IconNode) : null;
  } catch {
    return null;
  }
};

/**
 * Resolves a theme's lyricsIcons list to canonical lucide export names: case-insensitive,
 * deduplicated, unknown names dropped. No fallback - callers that want a default icon add it.
 */
export const resolveLucideIconNames = (names: readonly string[] | undefined): string[] => [
  ...new Set(
    (names ?? [])
      .map((name) => NAMES_BY_LOWERCASE.get(trimName(name).toLowerCase()))
      .filter((name): name is string => name !== undefined),
  ),
];

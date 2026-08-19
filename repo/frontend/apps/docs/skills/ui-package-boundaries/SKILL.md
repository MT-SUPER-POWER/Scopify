---
name: ui-package-boundaries
description: Apply when adding, updating, extracting, or consuming shared UI primitives in repo/frontend/packages/ui, especially shadcn CLI components, Scopify extensions, component exports, and UI theme tokens. Keeps upstream shadcn code native while making extensions explicit.
---

# UI Package Boundaries

## Purpose

`@scopify/ui` is the shared UI foundation. It has two intentionally different
layers:

- `shadcn/` is the vendored, upstream shadcn CLI layer. Treat every component
  here as generated source owned by the configured shadcn CLI version in
  `repo/frontend/packages/ui/package.json`.
- `scopify/` is the product extension layer. It owns behavior or structure
  that standard shadcn component props and shared CSS tokens cannot express.

The dependency direction is one-way:

```text
Web business UI  ->  @scopify/ui/scopify  ->  @scopify/ui/shadcn
                                      \->  shared theme tokens
```

`shadcn/` must never import from `scopify/` or an application. `scopify/` must
never import Web business code, stores, routes, APIs, or i18n resources.

## Required Placement Decision

Use this order before creating or changing a shared UI component.

1. **Use the native primitive unchanged.** If the need is met by documented
   shadcn props, `className`, composition, and the shared shadcn/Scopify CSS
   tokens, consume the primitive directly:

   ```ts
   import { Button } from "@scopify/ui/shadcn/components/button";
   ```

   Do not make a wrapper merely to rename a prop, preselect a token-backed
   variant, or apply a local layout class.

2. **Create a Scopify extension.** If product requirements need a changed DOM
   structure, changed interaction/accessibility behavior, a new semantic API,
   or styling that cannot be represented by native props plus shared tokens,
   copy the relevant native component implementation into
   `repo/frontend/packages/ui/scopify/components/` and extend that copy.
   The extension may import public shadcn primitives when useful, but it must
   not edit or reach into shadcn implementation internals.

3. **Keep business UI in the application.** A component coupled to Web routes,
   API responses, Zustand stores, app-specific permissions, or translations is
   business UI. Keep it under the Web application even when it composes shared
   primitives.

When uncertain, choose the narrowest layer that does not introduce an
application dependency. Record the choice in the PR/change description when
the distinction is non-obvious.

## Native shadcn Rules

- Add or refresh native components through the shadcn CLI from
  `repo/frontend/packages/ui`; `components.json` in that package is the CLI
  configuration source of truth.
- The `shadcn` dependency version in the UI package manifest is the selected
  CLI baseline. Upgrade it deliberately, regenerate or compare affected
  components, and review the upstream diff as vendored code.
- Do not manually customize files under `shadcn/components/`, `shadcn/lib/`,
  or other generated shadcn paths. If an upstream correction is required,
  refresh it through the CLI/version workflow.
- Export native components only through the package's explicit public export
  map. Consumers must use `@scopify/ui/shadcn/...`, never a relative path into
  the package.

## Scopify Extension Rules

- Put extensions in `scopify/components/` and export them from the UI package
  with the `@scopify/ui/scopify/components/...` public path.
- Name the extension for the product concept it introduces. Do not shadow a
  native export such as `Button`; prefer a distinct API such as
  `PlaybackButton` or `LibraryActionButton`.
- Begin an extension from a specific native source snapshot and preserve its
  Radix/accessibility semantics unless the requirement explicitly changes
  them. Note the source primitive in a short file comment when the copied
  origin is not obvious.
- Promote a style to shared `scopify/theme.css` only when multiple extensions
  need the same product semantic. Keep one-off layout styling at the caller.

## Theme Boundary

- `shadcn/theme.css` owns standard shadcn-compatible token names and the
  Tailwind bridge.
- `scopify/theme.css` owns product semantic tokens and maps them onto the
  shadcn token surface.
- Application global CSS loads the aggregate `theme.css`. Keep this import
  mechanism stable; due to the current PostCSS workspace-resolution issue,
  Web loads it with the established monorepo-relative stylesheet path rather
  than a bare package CSS specifier.
- Theme changes should first be expressed as tokens. Do not fork a native
  component only to change a color, radius, spacing, or other token-backed
  visual value.

## Change Checklist

Before completing a UI package change:

- State whether it is a native shadcn refresh, Scopify extension, or Web
  business UI, and why the lower layer is insufficient when creating an
  extension.
- Confirm the import uses a public `@scopify/ui/...` export path.
- Keep the package dependency declaration as `"@scopify/ui": "workspace:*"`.
- Run the relevant UI package tests/typecheck and the consuming application's
  typecheck or build.
- Update `docs/CHANGELOG.md` under the applicable category.

## Examples

| Need | Correct home |
| --- | --- |
| A normal button using the global accent color | Native `shadcn` Button plus tokens |
| A button with a loading icon that can be expressed by children/props | Native `shadcn` Button at the caller |
| A playback action with queue-aware semantics and a distinct interaction model | `scopify/components/PlaybackButton` |
| A like control connected to the current user's music library store | Web business component that composes shared UI |


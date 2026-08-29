# Theme Workbench Design QA

## Comparison target

- Source visual truth: `C:\Users\shuhe\AppData\Local\Temp\codex-clipboard-db8476e3-36a6-4c0a-ad3f-592f4ca50669.png`
- Final implementation: `C:\Users\shuhe\.codex\visualizations\2026\08\29\01a04b47-6da9-77a2-983f-25ad688610a4\theme-park-audit\07-theme-workbench-light-ready.png`
- Viewport: 1452 × 859 CSS pixels.
- Source pixels: 1452 × 859.
- Implementation pixels: 1452 × 859.
- Density normalization: 1:1 pixel dimensions at the matching desktop viewport.
- State: light theme, current saved theme selected, color editor open, live Tempera preview running.

## Full-view comparison

The implementation preserves the reference hierarchy: fixed top actions, a dominant live preview,
compact state chips over the preview, and a scrollable color editor on the right. Scopify's existing
theme library remains as an intentional additional left rail and can collapse to a 56px thumbnail
strip so the preview can reclaim the space.

## Focused-region comparison

A separate crop was not required because the source and implementation share the same full-size
1452 × 859 canvas and the preview toolbar, save action, theme rail, color cards, picker, and HEX input
are all legible in the original-resolution comparison. Those regions were also exercised directly in
the browser.

## Required fidelity surfaces

- Typography: keeps Scopify's existing product font and hierarchy; title, state chips, theme names,
  field labels, and control copy remain readable without source-image text recreation.
- Spacing and layout: preview fills the available height; outer and inner resizable panels maintain
  minimum widths; persistent header actions remain above the scroll regions.
- Colors and tokens: all surfaces continue to derive from the active Scopify/Folia theme. Light and
  dark variants were both rendered; palette chips expose the four live theme colors.
- Image and visual quality: uses the real Folia renderer and existing theme record component. No
  placeholder image, CSS illustration, or recreated artwork replaces the product visuals.
- Copy and content: adds explicit applied, editing, saved, unsaved, restart, collapse, discard, and
  save labels in Simplified Chinese, Traditional Chinese, and English.

## Interaction verification

- Theme rail collapsed from approximately 237px to 56px and expanded again.
- Preview paused, restarted, and resumed without console errors.
- Editing a HEX value enabled Save and Apply and showed editing/unsaved state.
- Switching themes with a dirty draft opened Save / Discard / Cancel protection.
- Browser console had no application errors and no Next.js error overlay appeared.

## Comparison history

1. Initial implementation (`03-theme-workbench-v1.png`): P1 preview occupied only the top portion of
   the work area. Fixed by making the real preview fill its resizable panel.
2. Second implementation (`04-theme-workbench-v2.png`): P2 collapsed rail kept the create action and
   pushed the expand action outside the 56px rail. Fixed by showing only expand in collapsed mode.
3. Final implementation (`07-theme-workbench-light-ready.png`): no actionable P0, P1, or P2 findings.
4. Collapsed-state feedback (`codex-clipboard-d6204aed-7e22-4c57-93cf-77dc5f1c2c8d.png`):
   P1 collapse retained the entire theme list in a narrow vertical rail. Fixed by rendering only
   the selected theme record as the expand control, removing the rail surface and resize handle.
5. Collapsed-state resize regression (`10-single-disc-collapsed-1463x860.png`): P2 panel expanded
   after its viewport changed. Fixed by treating collapse as explicit user state and reapplying the
   collapsed panel size after group resize. Post-fix evidence is
   `11-single-disc-sticky-1463x860.png`; the panel remains 64px and contains exactly one button.
6. Expand affordance feedback: P1 a plain single record did not explain how to reopen the library.
   Fixed by adding a persistent right-chevron badge inside the same record button while retaining the
   `展开主题库` accessible name and title.
7. Tooltip overflow (`12-single-disc-expand-affordance.png`): P2 custom hover copy caused horizontal
   overflow in the 64px panel. Removed the custom overlay and retained the persistent badge plus native
   title. Final evidence is `13-single-disc-final.png`; client and scroll dimensions match and the
   collapsed panel contains one button.
8. Compact-library clarification (`codex-clipboard-1ae01437-ab78-46bf-a808-646a75be664b.png`):
   P1 the single-record interpretation hid the rest of the theme library, and the fully collapsed
   resize handle was too subtle. Fixed by retaining every theme as an icon-only record, restoring a
   dedicated expand action, and enlarging the collapsed separator to a 4px rail with a 12 × 40px grip.
   Final evidence is `16-compact-all-themes-handle-final.png`; the 64px panel exposes all themes,
   remains draggable, has no horizontal overflow, and reports no browser errors.
9. Final compact-sidebar correction (`codex-clipboard-ce70ce0b-a8d1-48b5-90c5-03ccd438d143.png`):
   fixed each collapsed theme item to a complete 48px button, removed the applied-theme corner dot,
   restored the same standard resize handle used by the right panel, and removed the forced-collapse
   loop so dragging right naturally expands the library. Automated DOM/browser acceptance was omitted
   at the user's request; manual acceptance is pending.

## Follow-up polish

- P3: persist the user's panel sizes and collapsed state between sessions.
- P3: consider a fullscreen-preview action after the workbench interaction settles.
- Intentional difference: AI/content editing tabs from Folia are outside this version's scope.

final result: blocked

Blocker: the user requested manual acceptance instead of automated DOM/browser verification for the
latest compact-sidebar correction.

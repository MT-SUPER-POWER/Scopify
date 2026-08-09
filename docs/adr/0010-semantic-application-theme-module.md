---
status: accepted
---

# Establish a semantic application theme module

Scopify will govern Web and Electron appearance through one semantic-token Application Theme module in `@scopify/ui`, with preset selection kept separate from light/dark/system mode. The Default Application Theme preserves the current dark visual language and supplies a deliberately designed light companion; TweakCN is used to author and import token sets, while `next-themes` handles runtime mode switching rather than becoming the source of visual values. This gives shadcn primitives, Scopify wrappers, the product, and the documentation app one theme contract and turns legacy hard-coded styles into migration work instead of new sources of truth.

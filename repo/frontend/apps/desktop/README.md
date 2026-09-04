# Scopify Desktop

Electron host for Scopify. The application owns the main process, preload,
native resources, updater, and packaging configuration.

The `renderer/` directory is a generated artifact slot. Desktop code must not
import implementation files from `apps/web`; local and CI builds copy a verified
static Web build into this directory before packaging.

Main-process architecture, lifecycle, and contribution rules are documented in
[`electron/main/README.md`](./electron/main/README.md).

Playback-related maintenance notes:

- [`docs/architecture.md`](./docs/architecture.md) — Master architecture specification and UML topologies
- [`docs/playback.md`](./docs/playback.md) — Queue / Resolver / Session / Adapter boundaries
- [`docs/mcp.md`](./docs/mcp.md) — local MCP configuration, tools, and security model
- [`docs/native.md`](./docs/native.md) — Windows native audio build and Host boundary

# Scopify Desktop

Electron host for Scopify. The application owns the main process, preload,
native resources, updater, and packaging configuration.

The `renderer/` directory is a generated artifact slot. Desktop code must not
import implementation files from `apps/web`; local and CI builds copy a verified
static Web build into this directory before packaging.

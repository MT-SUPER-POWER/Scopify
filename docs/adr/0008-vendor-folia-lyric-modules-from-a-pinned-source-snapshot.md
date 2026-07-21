# Vendor Folia lyric modules from a pinned source snapshot

Scopify will adapt Folia lyric-presentation modules from Folia Source Snapshot `4f050885630183c04f7eda946300f6f96988ae0f`, rather than embed the Folia application or run it as a submodule. The migrated modules will be integrated into Scopify's Next.js and Electron boundaries with their Folia copyright, AGPL, and source-provenance notices preserved.

## Consequences

- Scopify retains its existing application shell, NetEase session, playback, and build systems.
- Only lyric parsing, visualizer, stage, and desktop-companion modules are adapted from Folia.
- Any later Folia update is an explicit, reviewable source-snapshot change rather than an implicit branch update.

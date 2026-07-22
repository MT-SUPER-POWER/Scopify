# Vendor the complete Folia Playback Stage from a pinned source snapshot

Scopify will source-preservingly vendor the complete Folia Playback Stage from Folia Source Snapshot `0a3d0980ae81002b291617c819b308a2e6207b14`, rather than embed the Folia application or run it as a submodule. Next.js compatibility adaptations are kept inside the vendored boundary and documented with the Folia copyright, AGPL, source revision, and provenance notices preserved.

## Consequences

- Scopify retains its existing application shell, NetEase session, playback, and build systems.
- The vendored scope includes the nine visualizers, six backgrounds, shared stage runtime, controls, settings panels, i18n, assets, and the direct utilities required by those modules.
- Scopify-specific data, playback, persistence, and Electron integration stay outside the vendored subtree in the Scopify Host Adapter.
- Interface Gaps are documented and implemented at the host boundary; they do not justify replacing Folia-owned behavior with an approximation.
- Every host adaptation to the pinned source is recorded in the vendored `SOURCE.md`.
- Any later Folia update is an explicit, reviewable source-snapshot change rather than an implicit branch update.

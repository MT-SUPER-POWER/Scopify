---
status: accepted
---

# Unify playback projection across renderers

Scopify will expose one versioned Playback Projection to PlayBar, Folia and every Electron companion Renderer. The main Renderer's real media element remains the initial Playback Authority, while reliable state and explicit timeline discontinuities flow through a Playback Broker and each Renderer advances a local Playback Replica from source-timestamped clock anchors; high-frequency audio spectrum remains a separate lossy stream.

## Considered Options

- Sending playback positions at a higher IPC frequency was rejected because transport frequency cannot distinguish a delayed state snapshot from a real seek.
- Keeping direct Zustand and DOM Event reads for the main Renderer was rejected because it would preserve two observable playback models and make a future dedicated Playback Host another UI migration.
- Moving audio ownership into a dedicated Playback Host during the protocol rewrite was deferred because it combines two independent high-risk changes; the new Authority seam makes that a later Adapter replacement.

## Consequences

- Ordinary clock calibration can never hard-rewind visible playback; only an explicit higher timeline revision can do so.
- Resume checkpoints are persistence data and cannot be used as a live clock source.
- Media source loads and their failures carry a Load Revision, so obsolete URL, media-event and retry results cannot mutate a newer Session.
- Session-scoped command epochs invalidate asynchronous work from an earlier track; Broker and Renderer pending receipts are time-bounded.
- Electron Main brokers and replays playback state but never becomes its owner or computes media time.
- A watchdog timeout is recoverable from the next ordered message, while a real transport reconnect still requires an atomic Bootstrap.
- Legacy BroadcastChannel, Desktop Lyrics and Wallpaper playback snapshots are removed as their consumers migrate to the unified Projection.

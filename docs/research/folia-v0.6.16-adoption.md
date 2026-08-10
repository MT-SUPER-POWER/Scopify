# Folia v0.6.16 adoption review

Date: 2026-08-10

## Source baseline

Scopify vendors Folia's playback-stage presentation runtime from commit
`0a3d0980ae81002b291617c819b308a2e6207b14`, then records reviewed upstream
updates in `frontend/apps/web/components/lyrics/folia/SOURCE.md`.

The newest official source tag reviewed here is
[`v0.6.16` (`7cf3900`)](https://github.com/chthollyphile/folia-major/commit/7cf390043adb3476d73be9d948d60325693d354d),
created on 2026-08-10. Folia's own release-card source lists four headline
features: QQ Music, a ten-band equalizer, a desktop lyric API, and local-song
covers ([source](https://github.com/chthollyphile/folia-major/blob/7cf390043adb3476d73be9d948d60325693d354d/src/components/modal/newFeaturesRelease.ts)).

## Screening

| Upstream capability       | Decision           | Reason                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sonnet global font weight | Adopt now          | It directly improves the vendored Folia renderer and reuses Scopify's existing Lyric Stage theme model. The upstream change is isolated and tested ([commit](https://github.com/chthollyphile/folia-major/commit/40d31e906af97e08cbeb113c80feb5c83b69fd05)).                                                    |
| Ten-band audio equalizer  | Adopt now          | High user value and portable Web Audio implementation. Scopify can insert it into the existing analyser chain without creating a second `MediaElementAudioSourceNode` ([commit](https://github.com/chthollyphile/folia-major/commit/acdc2b584696f601ce5eb12a74bc685ac6dabe8e)).                                 |
| QQ Music provider         | Defer              | It brings a separate provider backend, authentication persistence, capability routing, and thousands of lines of provider-specific code that conflict with Scopify's current NetEase backend boundary ([commit](https://github.com/chthollyphile/folia-major/commit/8458e9df2ec3f392c1f3a69216e35ffb43b165b4)). |
| Desktop lyric API         | Defer              | Scopify already has desktop lyric, remote-controller, and playback-wallpaper IPC channels under active development. A second localhost protocol should wait for one external-integration contract ([commit](https://github.com/chthollyphile/folia-major/commit/0d15073c41d8c3f0f7e5f3a8e7b6d2d9055c3451)).     |
| Local-song covers         | Not applicable yet | The feature depends on Folia's IndexedDB local-library catalog and content-addressed cover store, which Scopify does not currently ship ([commit](https://github.com/chthollyphile/folia-major/commit/1557a6e5f12a2c78d45431ee578afccadac56715)).                                                               |

## Adopted implementation

- Sonnet now uses the theme's manual font weight for layout measurement, Pixi
  text, metadata, and role rendering; automatic mode keeps 900/700/300 role
  hierarchy.
- Scopify now exposes Folia's six equalizer presets plus a retained custom slot.
  Settings are normalized before persistence and clamped to ten bands at
  ±12 dB.
- The equalizer filters are inserted between Scopify's existing media source and
  analyser, preserving Folia audio-band visualization and desktop-wallpaper
  audio publishing.
- The equalizer is opened from the existing audio-quality panel instead of
  adding another crowded Player Bar icon.

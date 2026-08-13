# Folia Attribution

This directory is Scopify's lyric-presentation boundary. The complete,
source-preserved Folia Playback Stage is vendored under `folia/`; Scopify-owned
components around it form the Scopify Host Adapter.

- Project: https://github.com/chthollyphile/folia-major
- Revision: `0a3d0980ae81002b291617c819b308a2e6207b14`
- License: GNU Affero General Public License v3.0

Scopify retains ownership of NetEase session, queue, audio, cache, and API
integration. The Scopify Host Adapter supplies Folia with lyrics, clocks, audio
bands, metadata, themes, settings, and playback commands without creating a
second player. Interface Gaps are tracked in the root README and must not be
filled with simplified renderers or substitute UI.

Any copied or further adapted Folia module must keep the provenance in
[`folia/SOURCE.md`](./folia/SOURCE.md) and the applicable AGPL notices.

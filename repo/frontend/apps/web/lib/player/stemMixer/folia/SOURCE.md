# Folia Stem Mixer

The HTDemucs WebGPU kernels and graph, GPU pacing, windowed stem assembly, player and AudioWorklet come from [Folia 71b59e802](https://github.com/chthollyphile/folia-major/tree/71b59e802a09db2075fc047784d9398f7f765f6f) under AGPL-3.0. The window, equalizer controls and four-stem layout are adapted from the same revision. The host adapters supply Scopify's media element, source bytes, ReplayGain graph, output volume, preset storage and modal focus handling.

The build downloads Folia's pinned [HTDemucs packed model](https://github.com/chthollyphile/folia-major/releases/tag/models-v1), verifies its byte length and SHA-256, and serves it alongside the worker and worklet. The model is based on [Meta's Demucs](https://github.com/facebookresearch/demucs) and ships with its [MIT license](./LICENSE.demucs).

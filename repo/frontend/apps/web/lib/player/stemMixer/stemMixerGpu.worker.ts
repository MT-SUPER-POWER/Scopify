import type { StemWorkerReply, StemWorkerRequest } from "@/types/audio/stemMixer";

import { createFrameClock, sliceMsForFrame } from "./folia/gpuSlices";
import { HtdemucsWgsl, type HtdemucsWgslManifest } from "./folia/htdemucsWgsl/runtime";
import { STEM_MODEL_BYTES, STEM_MODEL_FILE } from "./model";

const frames = createFrameClock(
  typeof self.requestAnimationFrame === "function"
    ? (callback) => self.requestAnimationFrame(callback)
    : undefined,
);
const inFlight = /Mac/.test(navigator.platform) ? 1 : 4;
let device: GPUDevice | undefined;
let model: HtdemucsWgsl | undefined;
let lost = false;

const reply = (data: StemWorkerReply, transfer: Transferable[] = []) =>
  self.postMessage(data, { transfer });

async function loadStemModel() {
  const response = await fetch(new URL(STEM_MODEL_FILE, self.location.href), {
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) throw new Error(`Stem model HTTP ${response.status}`);
  const packed = await response.arrayBuffer();
  if (packed.byteLength !== STEM_MODEL_BYTES) throw new Error("Unexpected stem model size");

  // Folia's packed export holds the tensor bytes and JSON in the same authenticated build asset.
  const decoder = new TextDecoder();
  const trailer = packed.byteLength - 16;
  const magic = decoder.decode(new Uint8Array(packed, trailer, 8));
  const offset = Number(new DataView(packed).getBigUint64(trailer + 8, true));
  if (magic !== "FOLIABTW" || offset <= 0 || offset >= trailer) {
    throw new Error("Invalid Folia model trailer");
  }
  const manifest: HtdemucsWgslManifest = JSON.parse(
    decoder.decode(new Uint8Array(packed, offset, trailer - offset)),
  );
  if (manifest.bytes !== offset) throw new Error("Invalid Folia model tensor size");
  return { weights: new Uint8Array(packed, 0, offset), manifest };
}

self.onmessage = async ({ data }: MessageEvent<StemWorkerRequest>) => {
  try {
    if (data.kind === "open") {
      const adapter = await navigator.gpu?.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) throw new Error("WebGPU adapter unavailable");
      device = await adapter.requestDevice({
        requiredFeatures: adapter.features.has("timestamp-query") ? ["timestamp-query"] : [],
      });
      void device.lost.then(() => {
        lost = true;
      });
      reply({ kind: "open" });
      return;
    }

    if (!device || lost) throw new Error("Stem mixer WebGPU device was lost");
    if (!model) {
      reply({ kind: "loadingModel" });
      const { weights, manifest } = await loadStemModel();
      // Same full-precision four-source graph as Folia's playback mixer.
      device.pushErrorScope("validation");
      let created: HtdemucsWgsl;
      try {
        created = await HtdemucsWgsl.create(device, weights, manifest, { sources: [0, 1, 2, 3] });
      } catch (error) {
        await device.popErrorScope().catch(() => undefined);
        throw error;
      }
      const validation = await device.popErrorScope();
      if (validation) {
        created.destroy();
        throw new Error(validation.message);
      }
      model = created;
    }
    const { stems, wallMs } = await model.run(data.left, data.right, {
      slice: "paced",
      pacing: { sliceMs: sliceMsForFrame(frames.frameMs), inFlight, frame: frames.next },
    });
    reply({ kind: "separated", stems, wallMs }, [stems[0].left.buffer]);
  } catch (error) {
    reply({
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
      unsupported: data.kind === "open",
    });
  }
};

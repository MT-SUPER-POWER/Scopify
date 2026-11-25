import { STEM_MIXER_ASSET_PATH, STEM_MIXER_RATE } from "@/constants/stemMixer";
import type { StemWorkerReply, StemWorkerRequest } from "@/types/audio/stemMixer";

import { HTDEMUCS_SEGMENT } from "./folia/htdemucsWgsl/runtime";

const SEGMENT_MS = (HTDEMUCS_SEGMENT * 0.75 * 1000) / STEM_MIXER_RATE;
const GPU_IDLE_MS = 120_000;

export class StemMixerUnsupportedError extends Error {}
export class StemMixerSlowGpuError extends Error {}

/** One persistent worker per active mixer. Seek generations share a strictly serial GPU queue. */
export function createStemGpu(onLoadingModel: () => void) {
  let worker: Worker | undefined;
  let rejectPending: ((cause: unknown) => void) | undefined;
  let queue = Promise.resolve();
  let slowSegments = 0;
  let disposed = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;

  const close = () => {
    clearTimeout(idleTimer);
    idleTimer = undefined;
    worker?.terminate();
    worker = undefined;
    rejectPending?.(new DOMException("Stem worker closed", "AbortError"));
  };

  const request = (
    worker: Worker,
    message: StemWorkerRequest,
    transfer: Transferable[] = [],
    onModel?: () => void,
  ) =>
    new Promise<StemWorkerReply>((resolve, reject) => {
      rejectPending = reject;
      worker.onmessage = ({ data }: MessageEvent<StemWorkerReply>) => {
        if (data.kind === "loadingModel") {
          onModel?.();
        } else if (data.kind === "error") {
          reject(
            data.unsupported
              ? new StemMixerUnsupportedError(data.message)
              : new Error(data.message),
          );
        } else {
          resolve(data);
        }
      };
      worker.onerror = (event) => reject(new Error(event.message || "Could not start stem worker"));
      worker.onmessageerror = () => reject(new Error("Could not read stem worker reply"));
      worker.postMessage(message, transfer);
    }).finally(() => {
      rejectPending = undefined;
    });

  return {
    separate(left: Float32Array, right: Float32Array, signal: AbortSignal) {
      const run = queue.then(async () => {
        signal.throwIfAborted();
        if (disposed) throw new DOMException("Stem worker disposed", "AbortError");
        clearTimeout(idleTimer);
        idleTimer = undefined;
        try {
          if (!worker) {
            worker = new Worker(`${STEM_MIXER_ASSET_PATH}/stemMixerGpu.worker.js`, {
              type: "module",
            });
            await request(worker, { kind: "open" });
            signal.throwIfAborted();
          }
          // Folia reuses the input arrays for each overlap-add segment.
          const l = left.slice();
          const r = right.slice();
          const result = await request(
            worker,
            { kind: "separate", left: l, right: r },
            [l.buffer, r.buffer],
            () => {
              if (!signal.aborted) onLoadingModel();
            },
          );
          signal.throwIfAborted();
          if (result.kind !== "separated") throw new Error("Unexpected stem worker reply");
          slowSegments = result.wallMs > SEGMENT_MS ? slowSegments + 1 : 0;
          if (slowSegments >= 3)
            throw new StemMixerSlowGpuError("Separation is slower than real time");
          return result.stems;
        } catch (error) {
          if (error !== signal.reason) close();
          throw error;
        } finally {
          if (worker) idleTimer = setTimeout(close, GPU_IDLE_MS);
        }
      });
      queue = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
    dispose() {
      disposed = true;
      close();
    },
  };
}

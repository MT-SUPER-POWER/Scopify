import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { STEM_MIXER_ASSET_PATH } from "../constants/stemMixer";
import {
  STEM_MODEL_BYTES,
  STEM_MODEL_FILE,
  STEM_MODEL_MIRRORS,
  STEM_MODEL_SHA256,
} from "../lib/player/stemMixer/model";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, "public", STEM_MIXER_ASSET_PATH);
await mkdir(output, { recursive: true });

const mixerRoot = join(root, "lib/player/stemMixer");
const artifacts = await Bun.build({
  entrypoints: [
    join(mixerRoot, "folia/stemMixer.worklet.ts"),
    join(mixerRoot, "stemMixerGpu.worker.ts"),
  ],
  outdir: output,
  naming: "[name].js",
  target: "browser",
});
if (!artifacts.success) throw new AggregateError(artifacts.logs, "Stem mixer asset build failed");
await copyFile(join(mixerRoot, "folia/LICENSE.demucs"), join(output, "LICENSE.demucs.txt"));

const path = join(output, STEM_MODEL_FILE);
const verified = (bytes: ArrayBuffer) =>
  bytes.byteLength === STEM_MODEL_BYTES &&
  createHash("sha256").update(new Uint8Array(bytes)).digest("hex") === STEM_MODEL_SHA256;

const existing = Bun.file(path);
if (!(await existing.exists()) || !verified(await existing.arrayBuffer())) {
  const errors: unknown[] = [];
  for (const url of STEM_MODEL_MIRRORS) {
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      const headers = new AbortController();
      const timer = setTimeout(() => headers.abort(), 30_000);
      const response = await fetch(url, {
        signal: AbortSignal.any([headers.signal, AbortSignal.timeout(300_000)]),
      }).finally(() => clearTimeout(timer));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const weights = await response.arrayBuffer();
      if (!verified(weights)) throw new Error("Model checksum did not match Folia's manifest");
      await Bun.write(temporary, weights);
      await rename(temporary, path);
      console.info(`[StemMixer] Verified ${STEM_MODEL_FILE}`);
      break;
    } catch (error) {
      errors.push(error);
      console.warn(
        `[StemMixer] Could not fetch verified weights from ${new URL(url).hostname}`,
        error,
      );
    } finally {
      await rm(temporary, { force: true });
    }
  }
  if (errors.length === STEM_MODEL_MIRRORS.length) {
    throw new AggregateError(errors, "Could not obtain the Folia stem mixer model");
  }
}

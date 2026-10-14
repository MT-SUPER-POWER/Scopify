import { beforeEach, describe, expect, it, mock } from "bun:test";
import { strToU8, zipSync } from "fflate";
import type { StoredTemperaLayerImage } from "@/lib/lyrics/foliaAssetStorage";

// 凝彩图片池 zip 备份测试：资源仓库替换为内存 Map，验证导出导入往返、回滚与清单校验
const store = new Map<string, StoredTemperaLayerImage>();
let failSaveAfter = Number.POSITIVE_INFINITY;

mock.module("@/lib/lyrics/foliaAssetStorage", () => ({
  clearTemperaLayerImage: async (id: string) => {
    store.delete(id);
  },
  getTemperaLayerImage: async (id: string) => store.get(id),
  loadTemperaLayerImageBlobs: async () => new Map(),
  saveTemperaLayerImage: async (image: StoredTemperaLayerImage) => {
    if (store.size >= failSaveAfter) throw new Error("quota exceeded");
    store.set(image.id, image);
  },
}));

const { createTemperaImageArchive, readTemperaImageArchiveFile, TemperaArchiveTooLargeError } =
  await import("@/components/lyrics/folia/src/services/temperaImageArchive");
const { buildTemperaArchiveEntryPath, collectTemperaArchiveEntries } =
  await import("@/components/lyrics/folia/src/services/temperaImageArchiveFormat");

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

const placement = (id: string, name = `${id}.png`) => ({
  id,
  name,
  align: "left" as const,
  verticalAlign: "top" as const,
  scale: 0.5,
  opacity: 0.8,
});

const seed = (id: string) => {
  store.set(id, {
    blob: new Blob([PNG_BYTES], { type: "image/png" }),
    id,
    mimeType: "image/png",
    name: `${id}.png`,
  });
};

const toFile = (blob: Blob, name = "pool.zip") =>
  new File([blob], name, { type: "application/zip" });

beforeEach(() => {
  store.clear();
  failSaveAfter = Number.POSITIVE_INFINITY;
});

describe("Tempera image archive format", () => {
  it("names entries with a decoder-safe extension", () => {
    expect(buildTemperaArchiveEntryPath({ id: "a", name: "art" }, "image/webp")).toBe(
      "images/a.webp",
    );
    expect(buildTemperaArchiveEntryPath({ id: "b", name: "logo.svg" }, "")).toBe("images/b.svg");
    expect(() => buildTemperaArchiveEntryPath({ id: "c", name: "notes" }, "text/plain")).toThrow();
  });

  it("drops manifest rows with unsafe ids or no image bytes and clamps placement", () => {
    const entries = collectTemperaArchiveEntries(
      { "images/ok.png": PNG_BYTES, "images/text.png": strToU8("hello") },
      [
        { ...placement("ok"), scale: 9, opacity: -1, align: "sideways" },
        placement("../escape"),
        placement("missing"),
        { ...placement("text"), name: "text" },
      ],
    );
    expect(entries.map((entry) => entry.image.id)).toEqual(["ok", "text"]);
    expect(entries[0].image).toMatchObject({ scale: 2, opacity: 0, align: "free" });
    expect(entries[0].mimeType).toBe("image/png");
  });
});

describe("Tempera image archive round trip", () => {
  it("exports the pool in order and skips placements whose file is gone", async () => {
    seed("a");
    seed("b");
    const result = await createTemperaImageArchive({
      layerImages: [placement("b"), placement("lost"), placement("a")],
    });
    expect(result.exported).toBe(2);
    expect(result.skipped).toBe(1);

    store.clear();
    const imported = await readTemperaImageArchiveFile(toFile(result.blob), { existing: [] });
    expect(imported.layerImages.map((image) => image.name)).toEqual(["b.png", "a.png"]);
    expect(imported.layerImages[0]).toMatchObject({ align: "left", verticalAlign: "top" });
    expect(store.size).toBe(2);
  });

  it("stops at the pool cap and counts the tail", async () => {
    ["a", "b", "c"].forEach(seed);
    const archive = await createTemperaImageArchive({
      layerImages: ["a", "b", "c"].map((id) => placement(id)),
    });
    store.clear();
    const existing = [placement("kept")];
    const imported = await readTemperaImageArchiveFile(toFile(archive.blob), {
      existing,
      maxImages: 3,
    });
    expect(imported.layerImages).toHaveLength(2);
    expect(imported.truncated).toBe(1);
  });

  it("rolls back every stored record when a later write fails", async () => {
    ["a", "b", "c"].forEach(seed);
    const archive = await createTemperaImageArchive({
      layerImages: ["a", "b", "c"].map((id) => placement(id)),
    });
    store.clear();
    failSaveAfter = 1;
    await expect(
      readTemperaImageArchiveFile(toFile(archive.blob), { existing: [] }),
    ).rejects.toThrow("quota exceeded");
    expect(store.size).toBe(0);
  });

  it("rejects zips that are not Folia pool backups", async () => {
    const foreign = zipSync({ "meta.json": strToU8(JSON.stringify({ kind: "other" })) });
    await expect(
      readTemperaImageArchiveFile(toFile(new Blob([foreign])), { existing: [] }),
    ).rejects.toThrow("Not a Folia canvas-image backup");
  });

  it("refuses a backup that declares more than 512 MB uncompressed", async () => {
    // Declare 600 MB in the central directory without allocating it: the size probe reads only
    // that field (offset 24 of each 0x02014b50 header), never inflating the entry.
    const bomb = zipSync({ "pool.bin": new Uint8Array(16) });
    const view = new DataView(bomb.buffer, bomb.byteOffset, bomb.byteLength);
    for (let offset = 0; offset + 46 <= bomb.length; offset += 1) {
      if (view.getUint32(offset, true) === 0x02014b50)
        view.setUint32(offset + 24, 600 * 1024 * 1024, true);
    }
    await expect(
      readTemperaImageArchiveFile(toFile(new Blob([bomb])), { existing: [] }),
    ).rejects.toBeInstanceOf(TemperaArchiveTooLargeError);
  });
});

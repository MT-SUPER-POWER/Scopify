import type { PlaybackQueueEntry } from "@scopify/desktop-contract";

import { UI_QUALITY_TO_LEVEL, getLyric, getSongUrlWithQuality } from "@/lib/api/music";
import {
  clearCachedPlayUrl,
  getCachedLyric,
  getCachedPlayUrl,
  getImportedLyricOverride,
  getLyricMatchOverride,
  getLyricSourceSelection,
  setCachedLyric,
  setCachedPlayUrl,
} from "@/lib/cache/playbackCache";
import { getVoiceNeteaseLyric } from "@/lib/lyrics/voiceLyric";
import type { PlaybackCatalogPort } from "@/lib/playbackHost/catalog";
import type { NeteaseLyric, MusicQualityLevel } from "@/types/api/music";
import type {
  PlaybackCatalogPortOptions,
  PlaybackSourceResolver,
  ResolvedPlaybackSource,
} from "@/types/playbackHostCatalog";
import type { MusicQuality } from "@/types/player";

interface NeteasePlaybackCache {
  clearCachedPlayUrl?(songId: number, quality: MusicQuality): Promise<void>;
  getCachedLyric(songId: number): Promise<NeteaseLyric | null>;
  getCachedPlayUrl(songId: number, quality: MusicQuality): Promise<string | null>;
  setCachedLyric(songId: number, lyric: NeteaseLyric): Promise<void>;
  setCachedPlayUrl(songId: number, quality: MusicQuality, url: string): Promise<void>;
}

interface NeteasePlaybackCatalogDependencies {
  cache: NeteasePlaybackCache;
  getLyric(songId: number): Promise<{ data: NeteaseLyric }>;
  getSongUrlWithQuality(
    songId: number,
    level: MusicQualityLevel,
  ): Promise<{ data: string | null | undefined }>;
  getStoredLyric(songId: number): Promise<NeteaseLyric | null>;
  getVoiceNeteaseLyric(voiceId: number): Promise<NeteaseLyric | null>;
}

export interface CreateNeteasePlaybackCatalogOptions {
  dependencies?: Partial<NeteasePlaybackCatalogDependencies>;
}

const defaultCache: NeteasePlaybackCache = {
  clearCachedPlayUrl,
  getCachedLyric,
  getCachedPlayUrl,
  setCachedLyric,
  setCachedPlayUrl,
};

const defaultDependencies: NeteasePlaybackCatalogDependencies = {
  cache: defaultCache,
  getLyric,
  getSongUrlWithQuality,
  getStoredLyric,
  getVoiceNeteaseLyric,
};

/**
 * Resolves NetEase media and lyrics for the hidden Host without accessing
 * Zustand. The Host keeps source-load revisions; this catalog only handles
 * the cache/API boundary and honours direct cancellation.
 */
export function createNeteasePlaybackCatalog(
  options: CreateNeteasePlaybackCatalogOptions = {},
): PlaybackSourceResolver {
  const dependencies = { ...defaultDependencies, ...options.dependencies };
  const writes = new CacheWriteSerialiser();

  return {
    async invalidate(entry, quality, signal) {
      throwIfAborted(signal);
      await dependencies.cache.clearCachedPlayUrl?.(entry.id, quality);
      throwIfAborted(signal);
    },
    async resolve(entry, quality, signal) {
      throwIfAborted(signal);

      const voiceId = entry.voiceId;
      const isVoice = voiceId !== undefined;
      const [cachedUrl, cachedLyric, storedLyric] = await Promise.all([
        dependencies.cache.getCachedPlayUrl(entry.id, quality),
        isVoice ? Promise.resolve(null) : dependencies.cache.getCachedLyric(entry.id),
        isVoice ? Promise.resolve(null) : dependencies.getStoredLyric(entry.id),
      ]);
      throwIfAborted(signal);

      const reusableLyric = storedLyric ?? cachedLyric;
      const urlPromise = cachedUrl
        ? Promise.resolve(cachedUrl)
        : dependencies
            .getSongUrlWithQuality(entry.id, UI_QUALITY_TO_LEVEL[quality] ?? "exhigh")
            .then((response) => response.data);
      const lyricPromise =
        voiceId !== undefined
          ? dependencies.getVoiceNeteaseLyric(voiceId)
          : reusableLyric
            ? Promise.resolve(reusableLyric)
            : dependencies.getLyric(entry.id).then((response) => response.data);

      const [sourceUrl, lyrics] = await Promise.all([urlPromise, lyricPromise]);
      throwIfAborted(signal);
      if (!sourceUrl) throw new Error("Playback URL is empty");

      const shouldCacheUrl = !cachedUrl;
      const shouldCacheLyric = !isVoice && !storedLyric && !cachedLyric && lyrics !== null;
      if (shouldCacheUrl || shouldCacheLyric) {
        await writes.enqueue(async () => {
          // Do not start a shared-record write for an already cancelled load.
          // Once begun, finish the ordered write so URL and lyric updates never
          // race each other and erase their sibling field in playbackCache.
          throwIfAborted(signal);
          if (shouldCacheUrl)
            await dependencies.cache.setCachedPlayUrl(entry.id, quality, sourceUrl);
          if (shouldCacheLyric && lyrics) await dependencies.cache.setCachedLyric(entry.id, lyrics);
        });
        throwIfAborted(signal);
      }

      return {
        durationMs: entry.durationMs,
        lyrics: lyrics ?? null,
        sourceUrl,
      };
    },
  };
}

/**
 * Bridges a source resolver into the current Runtime catalog port. The Host
 * adapter supplies the session-to-entry mapping and applies URL, duration and
 * lyrics together. Sequence and AbortSignal protect the local side; Runtime's
 * load epoch remains the final authority before playback starts.
 */
export function createPlaybackCatalogPort(
  options: PlaybackCatalogPortOptions,
): PlaybackCatalogPort<NeteaseLyric> {
  let activeSequence = 0;
  let activeController: AbortController | null = null;

  return {
    cancelSource() {
      activeSequence += 1;
      activeController?.abort();
      activeController = null;
    },
    async invalidateSource(request) {
      activeController?.abort();
      const controller = new AbortController();
      const sequence = activeSequence + 1;
      activeSequence = sequence;
      activeController = controller;

      try {
        await options.invalidateSource?.({ request, signal: controller.signal });
        if (controller.signal.aborted || activeSequence !== sequence) return;
      } finally {
        if (activeController === controller) activeController = null;
      }
    },
    async ensureSource(request) {
      activeController?.abort();
      const controller = new AbortController();
      const sequence = activeSequence + 1;
      activeSequence = sequence;
      activeController = controller;
      const isCurrent = () => activeSequence === sequence && !controller.signal.aborted;

      try {
        const resolved = await options.resolve({ request, signal: controller.signal });
        if (!isCurrent()) return false;

        const applied = await options.applyResolvedSource({
          isCurrent,
          request,
          resolved,
          signal: controller.signal,
        });
        return isCurrent() && applied;
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return false;
        throw error;
      } finally {
        if (activeController === controller) activeController = null;
      }
    },
  };
}

async function getStoredLyric(songId: number): Promise<NeteaseLyric | null> {
  const [source, importedLyric, matchedLyric] = await Promise.all([
    getLyricSourceSelection(songId),
    getImportedLyricOverride(songId),
    getLyricMatchOverride(songId),
  ]);

  if (source === "imported" && importedLyric) return importedLyric.lyric;
  return matchedLyric?.lyric ?? null;
}

class CacheWriteSerialiser {
  private tail: Promise<void> = Promise.resolve();

  enqueue(write: () => Promise<void>): Promise<void> {
    const next = this.tail.then(write, write);
    this.tail = next.catch(() => undefined);
    return next;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function throwIfAborted(signal: AbortSignal): void {
  if (!signal.aborted) return;
  const error = new Error("The playback source request was aborted.");
  error.name = "AbortError";
  throw error;
}

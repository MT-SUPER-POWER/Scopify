import type {
  MusicMv,
  MusicMvDetail,
  MusicMvQuality,
  MusicMvStream,
} from "@scopify/music-domain/mv";

import { qqSecureUrl } from "@/lib/providers/qq/adapters/playlist";
import type { QqMvDto, QqMvFileDto, QqMvUrlDto } from "@/types/providers/qq/mvApi";

/**
 * The picture height of QQ's file types. Only these three have been seen; a file of any other
 * type is left out rather than shown under a guessed quality.
 */
const QQ_MV_HEIGHT: Readonly<Record<number, number>> = { 10: 480, 20: 720, 30: 1080 };

export function adaptQqMv(raw: QqMvDto): MusicMv {
  return {
    ref: { provider: "qq", kind: "mv", id: raw.vid },
    title: raw.title,
    coverUrl: qqSecureUrl(raw.cover),
    artists: raw.singers.map((singer) => ({
      ref: { provider: "qq", kind: "artist", id: singer.mid },
      name: singer.name,
    })),
    durationMs: raw.duration === undefined ? null : raw.duration * 1000,
    playCount: raw.playCount ?? null,
  };
}

export function adaptQqMvDetail(raw: QqMvDto & { desc?: string }): MusicMvDetail {
  return {
    ...adaptQqMv(raw),
    description: raw.desc ?? null,
    publishedAt: raw.publishTime === undefined ? null : raw.publishTime * 1000,
    // QQ names the qualities with the stream, not with the detail.
    qualities: [],
  };
}

interface QqMvFile {
  height: number;
  file: QqMvFileDto;
}

function filesOf(dto: QqMvUrlDto): QqMvFile[] {
  return dto.files
    .flatMap((file): QqMvFile[] => {
      const height = QQ_MV_HEIGHT[file.quality];
      return height !== undefined && file.urls.length > 0 ? [{ height, file }] : [];
    })
    .sort((a, b) => b.height - a.height);
}

/** The first address that loads over HTTPS; the plain-HTTP ones are mixed content. */
function secureUrlOf(file: QqMvFileDto): string | null {
  const urls = file.urls.filter((url) => /\.mp4(\?|$)/.test(url));
  return urls.find((url) => url.startsWith("https://")) ?? qqSecureUrl(urls[0]);
}

/** The best file at or below `maxHeight` (the best of all when absent, the lowest if none fit). */
export function adaptQqMvStream(dto: QqMvUrlDto, maxHeight?: number): MusicMvStream | null {
  const files = filesOf(dto);
  if (files.length === 0) return null;
  const qualities: MusicMvQuality[] = files.map(({ height, file }) => ({
    height,
    sizeBytes: file.size ?? null,
  }));
  const chosen =
    (maxHeight === undefined ? files[0] : files.find(({ height }) => height <= maxHeight)) ??
    files[files.length - 1];
  const url = chosen ? secureUrlOf(chosen.file) : null;
  return chosen && url ? { url, height: chosen.height, qualities } : null;
}

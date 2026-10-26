import { downloadBlob, sanitizeDownloadFileName } from "@/lib/web/download";
import type { NeteaseLyric, SongDetail } from "@/types/api/music";
import type { LyricExportFormat } from "@/types/lyrics";

export function buildLyricExport(song: SongDetail, lyric: NeteaseLyric, format: LyricExportFormat) {
  const content = lyric[format]?.lyric?.trim();
  if (!content) return null;
  const artists = song.ar?.map((artist) => artist.name).join(", ");
  const baseName = sanitizeDownloadFileName(
    artists ? `${song.name} - ${artists}` : song.name,
    "lyrics",
  );
  return { content, fileName: `${baseName}.${format}` };
}

export function downloadLyricExport(file: NonNullable<ReturnType<typeof buildLyricExport>>) {
  downloadBlob(new Blob([file.content], { type: "text/plain;charset=utf-8" }), file.fileName);
}

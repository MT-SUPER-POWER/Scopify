import type { MusicLyrics, MusicLyricsText } from "@scopify/music-domain/lyrics";
import type { MusicResourceRef } from "@scopify/music-domain/identity";

import { hasNeteasePureMusicFlag } from "@/lib/lyrics/pureMusic";
import type { NeteaseLyricBranchDto, NeteaseLyricDto } from "@/types/providers/netease/lyricsApi";

function textOf(branch: NeteaseLyricBranchDto | undefined): string | null {
  return typeof branch?.lyric === "string" ? branch.lyric : null;
}

function hasText(text: MusicLyricsText): boolean {
  return text.original !== null || text.translation !== null || text.romanization !== null;
}

export function adaptNeteaseLyric(
  ref: MusicResourceRef<"track">,
  dto: NeteaseLyricDto,
): MusicLyrics {
  const words: MusicLyricsText = {
    original: textOf(dto.yrc),
    translation: textOf(dto.ytlrc),
    romanization: textOf(dto.yromalrc),
  };
  return {
    ref,
    pureMusic: hasNeteasePureMusicFlag(dto),
    lines: {
      original: textOf(dto.lrc),
      translation: textOf(dto.tlyric),
      romanization: textOf(dto.romalrc),
    },
    words: hasText(words) ? words : null,
  };
}

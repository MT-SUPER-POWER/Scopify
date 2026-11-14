import { describe, expect, it } from "bun:test";

import { toLikedVoice } from "@/lib/library/likedVoice";

describe("liked voice playback", () => {
  it("keeps a voice with an audio track playable despite its catalog status", () => {
    const voice = toLikedVoice({
      voiceId: 321,
      voiceName: "希望之歌",
      displayStatus: "UNKNOWN",
      auditStatus: "AUDIT_FAILED",
      mainSong: { id: 123, name: "希望之歌" },
    });

    expect(voice?.mainSong?.id).toBe(123);
    expect(voice?.isPlayable).toBe(true);
  });

  it("uses the embedded program track when the top-level track is incomplete", () => {
    const voice = toLikedVoice({
      contentId: 321,
      contentName: "Podcast episode",
      disPlayStatus: "UNKNOWN",
      mainSong: { id: 0 },
      djProgram: { mainSong: { id: 123 } },
    });

    expect(voice?.mainSong?.id).toBe(123);
    expect(voice?.isPlayable).toBe(true);
  });

  it("keeps a liked entry visible when it has no audio track", () => {
    const voice = toLikedVoice({
      voiceId: 321,
      voiceName: "Podcast episode",
      displayStatus: "ONLINE",
    });

    expect(voice?.mainSong).toBeNull();
    expect(voice?.isPlayable).toBe(false);
  });
});

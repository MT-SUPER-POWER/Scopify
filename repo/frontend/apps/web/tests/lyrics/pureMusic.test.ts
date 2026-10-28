import { describe, expect, it } from "bun:test";
import {
  hasNeteasePureMusicFlag,
  isPureMusicLyricLines,
  isPureMusicLyricText,
} from "@/lib/lyrics/pureMusic";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { adaptLyricDataToFolia } from "@/lib/lyrics/foliaLyricAdapter";
import { decideSongCommit, isInstrumentalConfirmed } from "@/lib/lyrics/folia/songHandover";
import type { NeteaseLyric } from "@/types/song/api";
import type { LyricData } from "@/types/lyrics";

describe("isPureMusicLyricText", () => {
  const notices = [
    "纯音乐，请欣赏",
    "纯音乐请欣赏",
    "纯音乐,请欣赏",
    "纯音乐 请欣赏",
    "纯音乐，请欣赏。",
    "纯音乐，请您欣赏",
    "此歌曲为没有填词的纯音乐，请您欣赏",
    "此歌曲为没有填词的纯音乐，请您欣赏！",
    "該歌曲為沒有填詞的純音樂，請您欣賞",
    "这首歌曲为纯音乐，请欣赏",
    "纯音乐，敬请聆听",
    "純音樂，請聆聽",
    "純音樂，請欣賞",
  ];

  it.each(notices)("recognises the notice '%s' with or without timestamps", (notice) => {
    expect(isPureMusicLyricText(notice)).toBe(true);
    expect(isPureMusicLyricText(`[00:00.00]${notice}`)).toBe(true);
    expect(isPureMusicLyricText(`[00:00.000] ${notice}\n`)).toBe(true);
  });

  it("recognises the notice when KRC splits it per character", () => {
    const krc =
      "[id:$00000000]\n[ti:某曲]\n[0,5000]<0,500,0>纯<500,500,0>音<1000,500,0>乐<1500,500,0>，<2000,500,0>请<2500,500,0>欣<3000,500,0>赏";
    expect(isPureMusicLyricText(krc)).toBe(true);
  });

  it("recognises the notice behind credit metadata lines", () => {
    const lrc = [
      "[00:00.00] 作曲 : 某某",
      "[00:01.00] 作词 : 某某",
      "[00:02.00]编曲：某某",
      "[00:03.00]纯音乐，请欣赏",
    ].join("\n");
    expect(isPureMusicLyricText(lrc)).toBe(true);
  });

  it("recognises the notice behind credit lines written without a colon", () => {
    const lrc = [
      "[00:00.00]编曲 某某",
      "[00:01.00]制作人 某某",
      "[00:02.00]Music by Foo",
      "[00:03.00]纯音乐，请欣赏",
    ].join("\n");
    expect(isPureMusicLyricText(lrc)).toBe(true);
    expect(isPureMusicLyricText("[00:00.00]鼓 声音很响\n[00:03.00]纯音乐，请欣赏")).toBe(true);
    expect(isPureMusicLyricText("[00:00.00]我爱你 很久了\n[00:03.00]纯音乐，请欣赏")).toBe(false);
  });

  it("recognises the notice behind a title line and JSON metadata", () => {
    const lrc = [
      '{"t":0,"c":[{"tx":"作曲: "}]}',
      "[00:00.00]某曲 - 某人",
      "[00:01.00]纯音乐，请欣赏",
    ].join("\n");
    expect(isPureMusicLyricText(lrc)).toBe(true);
  });

  it("does not treat missing or empty lyrics as instrumental", () => {
    expect(isPureMusicLyricText(null)).toBe(false);
    expect(isPureMusicLyricText(undefined)).toBe(false);
    expect(isPureMusicLyricText("")).toBe(false);
    expect(isPureMusicLyricText("[00:00.00]\n[00:05.00]")).toBe(false);
    expect(isPureMusicLyricText("[00:00.00] 作曲 : 某某\n[00:01.00] 作词 : 某某")).toBe(false);
  });

  it("does not treat a normal song with leading credits as instrumental", () => {
    const lrc = [
      "[00:00.00] 作词 : 某某",
      "[00:01.00] 作曲 : 某某",
      "[00:10.00]第一句歌词",
      "[00:15.00]第二句歌词",
    ].join("\n");
    expect(isPureMusicLyricText(lrc)).toBe(false);
  });

  it("does not treat a lyric line that merely contains the words as instrumental", () => {
    expect(isPureMusicLyricText("[00:10.00]我只听纯音乐，请欣赏这首歌")).toBe(false);
    expect(isPureMusicLyricText("[00:10.00]他喜欢纯音乐")).toBe(false);
    const lrc = ["[00:10.00]第一句歌词", "[00:15.00]纯音乐", "[00:20.00]第三句歌词"].join("\n");
    expect(isPureMusicLyricText(lrc)).toBe(false);
  });

  it("does not treat a real song that also carries the notice line as instrumental", () => {
    const lrc = ["[00:10.00]第一句歌词", "[00:15.00]第二句歌词", "[00:20.00]纯音乐，请欣赏"].join(
      "\n",
    );
    expect(isPureMusicLyricText(lrc)).toBe(false);
  });

  it("does not accept the bare phrase without the 'please enjoy' part", () => {
    expect(isPureMusicLyricText("[00:00.00]纯音乐")).toBe(false);
  });
});

describe("isPureMusicLyricLines", () => {
  it("judges parsed lines with the same rule", () => {
    expect(isPureMusicLyricLines([{ fullText: "纯音乐 请欣赏" }])).toBe(true);
    expect(isPureMusicLyricLines([{ fullText: "作词 : A" }, { fullText: "纯音乐，请欣赏" }])).toBe(
      true,
    );
    expect(isPureMusicLyricLines([{ text: "编曲 某某" }, { text: "纯音乐，请欣赏" }])).toBe(true);
    expect(
      isPureMusicLyricLines([
        { fullText: "", text: "作曲 : 某某" },
        { fullText: "", text: "纯音乐，请欣赏" },
      ]),
    ).toBe(true);
    expect(isPureMusicLyricLines([{ fullText: "第一句" }, { fullText: "纯音乐，请欣赏" }])).toBe(
      false,
    );
    expect(isPureMusicLyricLines([])).toBe(false);
    expect(isPureMusicLyricLines(null)).toBe(false);
  });
});

describe("hasNeteasePureMusicFlag", () => {
  it("reads the provider flag from any lyric track", () => {
    expect(hasNeteasePureMusicFlag({ lrc: { pureMusic: true } })).toBe(true);
    expect(hasNeteasePureMusicFlag({ pureMusic: true })).toBe(true);
    expect(hasNeteasePureMusicFlag({})).toBe(false);
    expect(hasNeteasePureMusicFlag(null)).toBe(false);
  });
});

describe("adaptNeteaseLyric pure music handling", () => {
  it("clears lines and sets isPureMusic when pureMusic flag is set", () => {
    const raw: NeteaseLyric = {
      code: 200,
      pureMusic: true,
      lrc: { lyric: "[00:00.00]纯音乐，请欣赏", version: 1 },
    };
    const adapted = adaptNeteaseLyric(raw);
    expect(adapted.isPureMusic).toBe(true);
    expect(adapted.lines).toHaveLength(0);
  });

  it("clears lines and sets isPureMusic when text is pure music notice without boolean flag", () => {
    const raw: NeteaseLyric = {
      code: 200,
      lrc: { lyric: "[00:00.00]此歌曲为没有填词的纯音乐，请您欣赏", version: 1 },
    };
    const adapted = adaptNeteaseLyric(raw);
    expect(adapted.isPureMusic).toBe(true);
    expect(adapted.lines).toHaveLength(0);
  });

  it("keeps lines for normal songs", () => {
    const raw: NeteaseLyric = {
      code: 200,
      lrc: { lyric: "[00:01.00]第一句歌词\n[00:05.00]第二句歌词", version: 1 },
    };
    const adapted = adaptNeteaseLyric(raw);
    expect(adapted.isPureMusic).toBe(false);
    expect(adapted.lines.length).toBeGreaterThan(0);
  });
});

describe("adaptLyricDataToFolia pure music handling", () => {
  it("returns empty lines if isPureMusic is true", () => {
    const data: LyricData = {
      isPureMusic: true,
      isWordByWord: false,
      lines: [
        {
          startTimeMs: 0,
          endTimeMs: 5000,
          text: "纯音乐，请欣赏",
          words: [],
        },
      ],
      metadata: { timedCredits: [] },
      raw: { code: 200 },
      source: "lrc",
    };
    const folia = adaptLyricDataToFolia(data);
    expect(folia.lines).toHaveLength(0);
  });

  it("returns empty lines if lines text indicates pure music", () => {
    const data: LyricData = {
      isPureMusic: false,
      isWordByWord: false,
      lines: [
        {
          startTimeMs: 0,
          endTimeMs: 5000,
          text: "纯音乐，请欣赏",
          words: [],
        },
      ],
      metadata: { timedCredits: [] },
      raw: { code: 200 },
      source: "lrc",
    };
    const folia = adaptLyricDataToFolia(data);
    expect(folia.lines).toHaveLength(0);
  });
});

describe("decideSongCommit empty lyrics handover", () => {
  it("keeps the words up but watches when lyrics are cleared for the song already on screen", () => {
    expect(
      decideSongCommit({
        seed: "current",
        committedSeed: "current",
        lyricsSignature: "",
        committedSignature: "2|hello",
        isCommittedInstrumental: false,
      }),
    ).toEqual({ action: "watch" });
  });

  it("idles when lyrics are already committed as instrumental", () => {
    expect(
      decideSongCommit({
        seed: "current",
        committedSeed: "current",
        lyricsSignature: "",
        committedSignature: "",
        isCommittedInstrumental: true,
      }),
    ).toEqual({ action: "idle" });
  });

  it("commits the filtered-down song once the watch finds no words returning", () => {
    expect(
      isInstrumentalConfirmed(
        { sawPlaybackReset: false, playbackTime: 95, elapsedMs: 3000 },
        { instrumentalCommitSeconds: 2, readyGraceMs: 3000 },
      ),
    ).toBe(true);
  });
});

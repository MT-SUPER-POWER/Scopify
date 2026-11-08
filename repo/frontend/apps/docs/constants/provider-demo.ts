import type { DemoIdentityRegistry } from "@/types/provider-demo";
import type { NeteaseTrackDto } from "@/types/providers/netease/trackApi";
import type { QqTrackDto } from "@/types/providers/qq/trackApi";
import { adaptNeteaseTrack } from "@/lib/music/providers/neteaseTrackAdapter";
import { adaptQqTrack } from "@/lib/music/providers/qqTrackAdapter";

/** Synthetic fixtures, not real accounts, assets or playable music. */
export const DEMO_IDENTITIES: DemoIdentityRegistry = {
  netease: {
    account: { provider: "netease", accountId: "demo-account" },
    name: "网易云体验账号",
    providerLabel: "网易云音乐",
    playlistNames: ["我喜欢的音乐", "网易云 · 通勤收藏"],
    cloudSupported: true,
  },
  qq: {
    account: { provider: "qq", accountId: "demo-account" },
    name: "QQ 体验账号",
    providerLabel: "QQ 音乐",
    playlistNames: ["我喜欢", "QQ · 周末收藏"],
    cloudSupported: false,
  },
};

export const DEMO_NETEASE_TRACK: NeteaseTrackDto = {
  id: 101,
  name: "夜航 · 网易云样本",
  dt: 210000,
  ar: [{ id: 201, name: "示例音乐人" }],
  al: { id: 301, name: "城市片段", picUrl: "" },
};

export const DEMO_QQ_TRACK: QqTrackDto = {
  id: 101,
  mid: "demoQqTrack101",
  name: "海风 · QQ 样本",
  interval: 195,
  singer: [{ id: 201, mid: "demoQqArtist201", name: "示例乐队" }],
  album: { id: 301, mid: "demoQqAlbum301", name: "晴日录音" },
};

export const DEMO_TRACKS = [adaptNeteaseTrack(DEMO_NETEASE_TRACK), adaptQqTrack(DEMO_QQ_TRACK)];

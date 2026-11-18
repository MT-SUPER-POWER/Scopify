import type { CommandWorkspaceSearchItem } from "@/types/commandWorkspace/model";

export function getCommandSearchKindLabel(item: CommandWorkspaceSearchItem) {
  const labels = {
    album: "辑",
    artist: "人",
    playlist: "单",
    podcast: "播",
    song: "歌",
    voice: "节",
  };
  return labels[item.kind];
}

export function getCommandSearchTitle(item: CommandWorkspaceSearchItem) {
  switch (item.kind) {
    case "song":
    case "album":
    case "playlist":
      return item.entity.title;
    default:
      return item.entity.name;
  }
}

export function getCommandSearchSubtitle(item: CommandWorkspaceSearchItem) {
  switch (item.kind) {
    case "song":
      return `${item.entity.artists.map((artist) => artist.name).join(" / ")} · ${item.entity.album?.title ?? ""}`;
    case "artist":
      return "歌手热门歌曲";
    case "album":
      return item.entity.artists[0]?.name ?? "";
    case "playlist":
      return item.entity.creator?.name ?? "歌单";
    case "podcast":
      return item.entity.hostName ?? "播客";
    case "voice":
      return item.entity.podcastName;
  }
}

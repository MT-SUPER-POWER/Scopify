import type { UserPlaylist } from "@/types/profile";
import type { NeteaseUser } from "@/types/api/user";

export interface PublicPlaylistGridProps {
  onClickPlaylist: (playlist: UserPlaylist) => void;
  playlists: UserPlaylist[];
}

export interface UserHeroProps {
  playlistCount: number;
  userInfo: NeteaseUser;
}

export interface UserHeroMetadataProps {
  userInfo: NeteaseUser;
}

export type UserHeroStatsProps = UserHeroProps;

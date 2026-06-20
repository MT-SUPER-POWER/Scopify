export interface PlaylistTag {
  id: number;
  name: string;
  category?: number;
  hot?: boolean;
}

export interface PlaylistHighQualityTagsResponse {
  code: number;
  tags: PlaylistTag[];
}

export interface UpdatePlaylistParams {
  id: number | string;
  name: string;
  desc?: string;
  tags?: string[];
}

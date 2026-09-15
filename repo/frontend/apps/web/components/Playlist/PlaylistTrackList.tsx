"use client";

import TracklistTable from "@/components/Playlist/TrackTable";
import { SortableList } from "@/components/shared/SortableList";
import { DragThumbnail } from "@/components/shared/DragThumbnail";
import { useInlinePlaylistOrder } from "@/hooks/playlist/useInlinePlaylistOrder";
import type { PlaylistTrackListProps } from "@/types/components/playlist";

export function PlaylistTrackList({ playlistId, tracks = [], ...props }: PlaylistTrackListProps) {
  const order = useInlinePlaylistOrder(tracks, playlistId ?? undefined);
  return (
    <SortableList
      ids={order.items.map((track) => track.id)}
      disabled={!playlistId || !props.canRemoveFromPlaylist || props.readonly}
      busy={order.isSaving}
      onMove={order.move}
      renderOverlay={(id) => {
        const track = order.items.find((item) => item.id === id);
        return track ? (
          <DragThumbnail
            cover={track.al.picUrl}
            title={track.name}
            subtitle={track.ar.map((artist) => artist.name).join(" / ")}
          />
        ) : null;
      }}
    >
      <TracklistTable {...props} tracks={order.items} />
    </SortableList>
  );
}

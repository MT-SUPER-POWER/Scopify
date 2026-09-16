"use client";

import TracklistTable from "@/components/Playlist/TrackTable";
import { SortableList } from "@/components/shared/SortableList";
import { StackedDragThumbnail } from "@/components/shared/StackedDragThumbnail";
import { useInlinePlaylistOrder } from "@/hooks/playlist/useInlinePlaylistOrder";
import { useTrackSelection } from "@/hooks/playlist/useTrackSelection";
import { useAppDragStore } from "@/store/module/appDrag";
import type { PlaylistTrackListProps } from "@/types/components/playlist";

export function PlaylistTrackList({ playlistId, tracks = [], ...props }: PlaylistTrackListProps) {
  const order = useInlinePlaylistOrder(tracks, playlistId ?? undefined);
  const selection = useTrackSelection(order.items);

  return (
    <SortableList
      ids={order.items.map((track) => track.id)}
      reorderDisabled={!playlistId || !props.canRemoveFromPlaylist || props.readonly}
      busy={order.isSaving}
      onMove={order.move}
      onDragStart={(activeId) => {
        const id = Number(activeId);
        const isSelected = selection.isSelected(id);
        const track = order.items.find((item) => item.id === id);
        const dragged =
          isSelected && selection.selectedTracks.length > 1
            ? selection.selectedTracks
            : track ? [track] : [];
        useAppDragStore.getState().startDrag(dragged, playlistId);
      }}
      renderOverlay={(id) => {
        const track = order.items.find((item) => item.id === id);
        if (!track) return null;
        const isMulti = selection.isSelected(Number(id)) && selection.selectedTracks.length > 1;
        const count = isMulti ? selection.selectedTracks.length : 1;
        return (
          <StackedDragThumbnail
            cover={track.al?.picUrl}
            title={track.name}
            subtitle={track.ar?.map((artist) => artist.name).join(" / ")}
            count={count}
          />
        );
      }}
    >
      <TracklistTable {...props} tracks={order.items} selection={selection} />
    </SortableList>
  );
}

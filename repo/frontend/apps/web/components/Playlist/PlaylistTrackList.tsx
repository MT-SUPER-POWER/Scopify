"use client";

import TracklistTable from "@/components/Playlist/TrackTable";
import { SortableList } from "@/components/shared/SortableList";
import { StackedDragThumbnail } from "@/components/shared/StackedDragThumbnail";
import { useInlinePlaylistOrder } from "@/hooks/playlist/useInlinePlaylistOrder";
import { useTrackSelection } from "@/hooks/playlist/useTrackSelection";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { toNeteaseSongDetails } from "@/lib/providers/netease/adapters/track";
import { useAppDragStore } from "@/store/module/appDrag";
import type { PlaylistTrackListProps } from "@/types/playlist/components";

export function PlaylistTrackList({ playlistId, tracks = [], ...props }: PlaylistTrackListProps) {
  const canReorder = useProviderCapability("playlist.reorder");
  const order = useInlinePlaylistOrder(tracks, playlistId ?? undefined);
  const selection = useTrackSelection(order.items);

  return (
    <SortableList
      ids={order.items.map((track) => track.ref.id)}
      reorderDisabled={!canReorder || !playlistId || !props.canRemoveFromPlaylist || props.readonly}
      busy={order.isSaving}
      onMove={order.move}
      onDragStart={(activeId) => {
        const id = String(activeId);
        const isSelected = selection.isSelected(id);
        const track = order.items.find((item) => item.ref.id === id);
        const dragged =
          isSelected && selection.selectedTracks.length > 1
            ? selection.selectedTracks
            : track
              ? [track]
              : [];
        // Dropping on the sidebar adds NetEase songs; other platforms' tracks are not carried.
        useAppDragStore.getState().startDrag(toNeteaseSongDetails(dragged), playlistId);
      }}
      renderOverlay={(id) => {
        const track = order.items.find((item) => item.ref.id === String(id));
        if (!track) return null;
        const isMulti = selection.isSelected(String(id)) && selection.selectedTracks.length > 1;
        const count = isMulti ? selection.selectedTracks.length : 1;
        return (
          <StackedDragThumbnail
            cover={track.album?.coverUrl ?? ""}
            title={track.title}
            subtitle={track.artists.map((artist) => artist.name).join(" / ")}
            count={count}
          />
        );
      }}
    >
      <TracklistTable {...props} tracks={order.items} selection={selection} />
    </SortableList>
  );
}

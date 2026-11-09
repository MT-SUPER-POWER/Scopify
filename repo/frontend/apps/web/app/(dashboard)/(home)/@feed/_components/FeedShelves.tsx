"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import { CollapsibleSection } from "../../_components/CollapsibleSection";
import { useHome } from "../../_components/HomeProvider";
import { NewSongItem } from "../../@releases/_components/NewSongItem";
import { GridCard } from "@/components/home/GridCard";
import { useHomeFeedQuery } from "@/hooks/home/useHomeQueries";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { useTranslation } from "react-i18next";
import { musicResourceKey } from "@scopify/music-domain/identity";
import type { MusicFeedShelf } from "@scopify/music-domain/recommend";

/** The platform's own title, or the app's wording for the shelf kinds it names itself. */
function useShelfTitle(shelf: MusicFeedShelf): string {
  const { t } = useTranslation();
  if (shelf.title) return shelf.title;
  if (shelf.kind === "guessYouLike") return t("home.feedKind.guessYouLike");
  return t("home.feed");
}

/** Songs shown on a collapsed shelf: three rows of two. */
const COLLAPSED_SONGS = 6;

function TrackShelf({ shelf }: { shelf: MusicFeedShelf }) {
  const { t } = useTranslation();
  const title = useShelfTitle(shelf);
  const { actions } = useHome();
  const [isOpen, setIsOpen] = useState(false);
  const tracks = shelf.items.flatMap((item) => (item.kind === "track" ? [item.track] : []));
  const visible = isOpen ? tracks : tracks.slice(0, COLLAPSED_SONGS);

  return (
    <section>
      <CollapsibleSection
        open={isOpen}
        onOpenChange={setIsOpen}
        title={
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-content sm:text-2xl">{title}</h2>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void actions.playTracks(tracks, 0);
              }}
              className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              <Play className="size-3 fill-current" />
              <span>{t("home.playAll")}</span>
            </button>
          </div>
        }
        disableHeightCollapse
        showTrigger={tracks.length > COLLAPSED_SONGS}
      >
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2">
          {visible.map((track, index) => (
            <NewSongItem
              key={musicResourceKey(track.ref)}
              song={track}
              index={index}
              onPlay={(_song, at) => actions.playTracks(tracks, at)}
            />
          ))}
        </div>
      </CollapsibleSection>
    </section>
  );
}

function PlaylistShelf({ shelf }: { shelf: MusicFeedShelf }) {
  const { actions } = useHome();
  const title = useShelfTitle(shelf);
  const smartRouter = useSmartRouter();
  const playlists = shelf.items.flatMap((item) =>
    item.kind === "playlist" ? [item.playlist] : [],
  );

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold tracking-tight text-content sm:text-2xl">{title}</h2>
      <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,200px),1fr))] gap-x-2 gap-y-4">
        {playlists.map((playlist) => (
          <GridCard
            key={playlist.ref.id}
            appearance="home"
            id={playlist.ref.id}
            name={playlist.title}
            coverUrl={getSizedImageUrl(playlist.coverUrl, 300)}
            isLoading={actions.loadingPlayId === `playlist-${playlist.ref.id}`}
            onPlay={(event) => actions.handlePlayPlaylist(playlist.ref.id, event)}
            onClick={() => smartRouter.push(`/playlist/?id=${encodeURIComponent(playlist.ref.id)}`)}
          />
        ))}
      </div>
    </section>
  );
}

/** The platform's own home shelves, each shown by what it holds: songs or playlists. */
export function FeedShelves() {
  const shelves = useHomeFeedQuery().data;
  return (
    <>
      {shelves.map((shelf) =>
        shelf.items[0]?.kind === "track" ? (
          <TrackShelf key={shelf.id} shelf={shelf} />
        ) : (
          <PlaylistShelf key={shelf.id} shelf={shelf} />
        ),
      )}
    </>
  );
}

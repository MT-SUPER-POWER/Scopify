"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";

import { useArtistData } from "./_hooks/useArtistData";
import { useArtistPlay } from "./_hooks/useArtistPlay";
import { ArtistHero } from './_components/Artisthero';
import { ActionBar } from './_components/Actionbar';
import { PopularTracks } from './_components/Populartracks';
import { AboutSection } from './_components/Aboutsection';
import { DiscographyGrid } from './_components/Discographygrid';


export default function ArtistPage() {
  const artistId = useSearchParams().get("id");
  const router = useSmartRouter();

  const { artist, popularTracks, hotTracksQueue, discography, isLoading } = useArtistData(artistId);
  const { isPlayingArtist, loadingAlbumId, handlePlayArtist, handlePlayAlbum } = useArtistPlay(hotTracksQueue);

  if (!artistId)
    return <div className="p-8 text-white h-screen bg-[#121212]">Invalid Artist ID</div>;

  if (isLoading || !artist)
    return (
      <div className="p-8 text-white h-screen bg-[#121212] flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1DB954]" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans overflow-x-hidden pb-24">

      <ArtistHero artist={artist} />

      <div className="w-full max-w-7xl mx-auto bg-linear-to-b from-black/20 to-[#121212]">

        <ActionBar
          isPlayingArtist={isPlayingArtist}
          disabled={hotTracksQueue.length === 0}
          onPlayArtist={handlePlayArtist}
        />

        <div className="px-6 md:px-8 flex flex-col xl:flex-row gap-12">
          <PopularTracks tracks={popularTracks} queue={hotTracksQueue} artist={artist} />
          <AboutSection artist={artist} />
        </div>

        <DiscographyGrid
          albums={discography}
          loadingAlbumId={loadingAlbumId}
          onPlayAlbum={handlePlayAlbum}
          onClickAlbum={(id) => router.push(`/album?id=${id}`)}
        />

      </div>
    </div>
  );
}

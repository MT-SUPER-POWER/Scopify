"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { usePlayerStore } from "@/store";

import { Category } from "./_types";
import { useSearchData } from "./_hooks/useSearchData";
import { usePlayActions } from "./_hooks/usePlayActions";

import { LoadingSkeleton } from "./_components/LoadingSkeleton";
import { AllView } from "./_components/AllView";
import { CategoryTabs } from './_components/Categorytabs';
import { SongsView } from './_components/Songsview';
import { GridCategoryView } from './_components/Gridcategoryview';

export default function SearchResultsPage() {
  const keywords = useSearchParams().get("keywords") || "";
  const router = useSmartRouter();

  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const { loading, songs, albums, playlists, artists } = useSearchData(keywords, activeCategory);
  const { loadingPlayId, handlePlayPlaylist, handlePlayAlbum } = usePlayActions();

  const isGridCategory = (["Albums", "Playlists", "Artists"] as Category[]).includes(activeCategory);

  return (
    <div className="w-full min-h-screen bg-[#121212] text-white p-6 overflow-y-auto pt-22">

      <CategoryTabs active={activeCategory} onChange={setActiveCategory} />

      {loading && <LoadingSkeleton />}

      {!loading && activeCategory === "All" && (
        <AllView
          songs={songs} albums={albums} playlists={playlists} artists={artists}
          loadingPlayId={loadingPlayId}
          onPlayAlbum={handlePlayAlbum}
          onPlayPlaylist={handlePlayPlaylist}
          onSeeAll={setActiveCategory}
          onNavigate={router.push}
        />
      )}

      {!loading && activeCategory === "Songs" && (
        <SongsView songs={songs} />
      )}

      {!loading && isGridCategory && (
        <GridCategoryView
          activeCategory={activeCategory as "Albums" | "Playlists" | "Artists"}
          albums={albums} playlists={playlists} artists={artists}
          loadingPlayId={loadingPlayId}
          onPlayAlbum={handlePlayAlbum}
          onPlayPlaylist={handlePlayPlaylist}
          onNavigate={router.push}
        />
      )}

    </div>
  );
}

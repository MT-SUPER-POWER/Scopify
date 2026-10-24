"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store";

/**
 * Shows the loaded song as the document title ("歌名 - 歌手"), which Electron also uses as the
 * window title for Alt+Tab and the taskbar. The route's own title comes back once no song is loaded.
 */
export function useNowPlayingDocumentTitle() {
  const nowPlaying = usePlayerStore((state) => {
    const song = state.currentSongDetail;
    if (!song?.name) return null;
    const artists = song.ar
      ?.map((artist) => artist.name)
      .filter(Boolean)
      .join(" / ");
    return artists ? `${song.name} - ${artists}` : song.name;
  });

  useEffect(() => {
    if (!nowPlaying) return;
    let pageTitle = document.title;
    const apply = () => {
      if (document.title === nowPlaying) return;
      // Next.js rewrites the title on navigation; remember it and take the title back.
      pageTitle = document.title;
      document.title = nowPlaying;
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { characterData: true, childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.title = pageTitle;
    };
  }, [nowPlaying]);
}

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LyricsContextType {
  isLyricsOpen: boolean;
  openLyrics: () => void;
  closeLyrics: () => void;
  toggleLyrics: () => void;
}

const LyricsContext = createContext<LyricsContextType | undefined>(undefined);

export const LyricsProvider = ({ children }: { children: ReactNode }) => {
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

  const openLyrics = () => setIsLyricsOpen(true);
  const closeLyrics = () => setIsLyricsOpen(false);
  const toggleLyrics = () => setIsLyricsOpen((s) => !s);

  return (
    <LyricsContext.Provider value={{ isLyricsOpen, openLyrics, closeLyrics, toggleLyrics }}>
      {children}
    </LyricsContext.Provider>
  );
};

export const useLyrics = () => {
  const ctx = useContext(LyricsContext);
  if (!ctx) {
    throw new Error("useLyrics must be used within a LyricsProvider");
  }
  return ctx;
};

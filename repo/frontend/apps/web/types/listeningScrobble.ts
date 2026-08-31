import type { RefObject } from "react";

export interface ListeningScrobbleSession {
  artist: string;
  key: string;
  songId: number;
  sourceId?: string;
  title: string;
  totalSeconds: number;
}

export interface UseListeningScrobbleOptions {
  audioRef: RefObject<HTMLAudioElement | null>;
  session: ListeningScrobbleSession | null;
}

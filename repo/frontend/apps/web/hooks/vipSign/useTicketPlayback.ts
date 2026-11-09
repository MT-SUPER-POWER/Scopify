"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getSongDetail } from "@/lib/providers/netease/api/track";
import { usePlayerStore } from "@/store";
import { useTranslation } from "react-i18next";
import { adaptNeteaseTrack } from "@/lib/providers/netease/adapters/track";

export function useTicketPlayback(songId: number | undefined, onClose: () => void) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const pending = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function play() {
    if (!songId || pending.current) return;
    pending.current = true;
    setIsPlaying(true);
    try {
      const response = await getSongDetail(songId);
      if (!active.current) return;
      const song = response?.data?.songs?.[0];
      if (!song) throw new Error("Missing song");
      usePlayerStore.getState().playFromSong(adaptNeteaseTrack(song), [adaptNeteaseTrack(song)]);
      onClose();
    } catch {
      if (active.current) toast.error(t("vipSign.playFailed"));
    } finally {
      pending.current = false;
      if (active.current) setIsPlaying(false);
    }
  }
  return { play, isPlaying };
}

"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { usePlaylistLatticeView } from "@/hooks/playlist/usePlaylistLatticeView";
import type { PlaylistLatticeViewProps } from "@/types/components/playlistLattice";

const PlaylistLattice = dynamic(() => import("./PlaylistLattice"), { ssr: false });

export function PlaylistLatticeView({ children, ...props }: PlaylistLatticeViewProps) {
  const { contentRef, container, open, close } = usePlaylistLatticeView();
  return (
    <>
      <div
        ref={contentRef}
        inert={Boolean(container)}
        style={{ visibility: container ? "hidden" : undefined }}
      >
        {children(open)}
      </div>
      {container && createPortal(<PlaylistLattice {...props} onClose={close} />, container)}
    </>
  );
}

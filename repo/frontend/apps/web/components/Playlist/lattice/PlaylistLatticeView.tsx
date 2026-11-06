"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { usePlaylistLatticeView } from "@/hooks/playlist/usePlaylistLatticeView";
import type { PlaylistViewMode } from "@/types/playlist/lattice";
import type {
  PlaylistLatticeProps,
  PlaylistLatticeViewProps,
} from "@/types/playlist/latticeComponents";
import type { ComponentType } from "react";
import { PlaylistViewSkeleton } from "./PlaylistViewSkeleton";

const PlaylistLattice = dynamic(() => import("./PlaylistLattice"), { ssr: false });
const PlaylistGrid = dynamic(() => import("../grid/PlaylistGrid"), { ssr: false });

const VIEWS: Record<PlaylistViewMode, ComponentType<PlaylistLatticeProps>> = {
  lattice: PlaylistLattice,
  grid: PlaylistGrid,
};

export function PlaylistLatticeView({ children, loading, ...props }: PlaylistLatticeViewProps) {
  const { contentRef, container, mode, open, close } = usePlaylistLatticeView();
  const View = VIEWS[mode];
  return (
    <>
      <div
        ref={contentRef}
        inert={Boolean(container)}
        style={{ visibility: container ? "hidden" : undefined }}
      >
        {children(open)}
      </div>
      {container &&
        createPortal(
          loading ? (
            <PlaylistViewSkeleton mode={mode} />
          ) : (
            <View key={mode} {...props} onClose={close} onModeChange={open} />
          ),
          container,
        )}
    </>
  );
}

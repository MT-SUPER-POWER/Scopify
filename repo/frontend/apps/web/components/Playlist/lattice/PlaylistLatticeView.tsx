"use client";

import { useEffect } from "react";
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

const PlaylistLattice = dynamic(() => import("./PlaylistLattice"), {
  ssr: false,
  loading: () => <PlaylistViewSkeleton mode="lattice" arm={false} />,
});
const PlaylistGrid = dynamic(() => import("../grid/PlaylistGrid"), {
  ssr: false,
  loading: () => <PlaylistViewSkeleton mode="grid" arm={false} />,
});
const RadioWall = dynamic(() => import("./RadioWall"), {
  ssr: false,
  loading: () => <PlaylistViewSkeleton mode="radio" arm={false} />,
});

const VIEWS: Record<PlaylistViewMode, ComponentType<PlaylistLatticeProps>> = {
  lattice: PlaylistLattice,
  grid: PlaylistGrid,
  radio: RadioWall,
};

export function PlaylistWallSurface({
  mode,
  ...props
}: PlaylistLatticeProps & { mode: PlaylistViewMode }) {
  const View = VIEWS[mode];
  return <View key={mode} {...props} />;
}

export function PlaylistLatticeView({ children, loading, ...props }: PlaylistLatticeViewProps) {
  const { contentRef, container, mode, open, close } = usePlaylistLatticeView();
  // Only warm the selected layout while data is loading.
  useEffect(() => {
    if (!container || !loading) return;
    if (mode === "radio") void import("./RadioWall");
    else if (mode === "grid") void import("../grid/PlaylistGrid");
    else void import("./PlaylistLattice");
  }, [container, loading, mode]);
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
            <PlaylistWallSurface {...props} mode={mode} onClose={close} onModeChange={open} />
          ),
          container,
        )}
    </>
  );
}

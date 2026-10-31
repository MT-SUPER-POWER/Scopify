"use client";

import { MvPlayer } from "./_components/MvPlayer";
import { MvPlayerPlaceholder } from "./_components/MvPlayerPlaceholder";
import { useMvPage } from "../_components/MvPageContext";
import { useSmartRouter } from "@/hooks/core/useSmartRouter";
import { useMVDetailQuery } from "@/hooks/mv/useMVQueries";
import { useMvId } from "@/hooks/mv/useMvId";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { getMvCover } from "@/lib/music/mvCover";
import { useUiStore } from "@/store/module/ui";

export default function MvPlayerSlot() {
  const smartRouter = useSmartRouter();
  const mvid = useMvId();
  const { isTheater, toggleTheater, nextId } = useMvPage();
  const detailQuery = useMVDetailQuery(mvid, { boundary: true });
  const detail = detailQuery.data?.data;
  const isPlayerBarHidden = useUiStore((state) => state.isPlayerBarHidden);
  const setIsPlayerBarHidden = useUiStore((state) => state.setIsPlayerBarHidden);
  const poster = detail ? getMvCover(detail) : "";

  if (detailQuery.isPending)
    return (
      <MvPlayerPlaceholder
        isTheater={isTheater}
        isPlayerBarHidden={isPlayerBarHidden}
        isPaused={detailQuery.fetchStatus === "paused"}
      />
    );
  return (
    <MvPlayer
      key={mvid}
      mvid={mvid}
      isTheater={isTheater}
      isPlayerBarHidden={isPlayerBarHidden}
      onTogglePlayerBar={() => setIsPlayerBarHidden(!isPlayerBarHidden)}
      onToggleTheater={toggleTheater}
      resolutions={detail?.brs ?? []}
      poster={poster ? getSizedImageUrl(poster, 1280) : undefined}
      onNext={nextId ? () => void smartRouter.push(`/mv?id=${nextId}`) : undefined}
    />
  );
}

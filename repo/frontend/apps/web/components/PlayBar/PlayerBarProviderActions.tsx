"use client";

import { useQuery } from "@tanstack/react-query";
import { PiChatCircleDotsBold, PiHeartBold, PiHeartFill } from "react-icons/pi";
import { PlayerBarStatAction } from "@/components/PlayBar/PlayerBarStatAction";
import { useActiveProvider, useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { useTrackLikeCount } from "@/hooks/song/useTrackInsights";
import { usePlaybackCommands } from "@/hooks/player/usePlaybackCommands";
import { getCommentHref } from "@/lib/comment/commentResource";
import { providerQueryKey } from "@/lib/query/providerQueryKey";
import type { PlayerTrack } from "@/types/player/model";
import { useTranslation } from "react-i18next";

/**
 * Like and comments for the current track on a platform other than NetEase, which has its own
 * counts. Each shows only when the platform has the capability; the comment count comes from
 * the platform's comment source.
 */
export function PlayerBarProviderActions({ track, liked }: { track: PlayerTrack; liked: boolean }) {
  const { t } = useTranslation();
  const provider = useActiveProvider();
  const commands = usePlaybackCommands();
  const canLike = useProviderCapability("track.like");
  const canComment = useProviderCapability("comments.read");
  const likeCount = useTrackLikeCount(track.ref);
  const commentCount = useQuery({
    enabled: canComment && provider.commentTargetKinds.has("track"),
    queryKey: providerQueryKey(provider.provider, "comment", "count", track.ref.id),
    meta: { persist: false, scope: "public" },
    staleTime: 5 * 60 * 1000,
    queryFn: ({ signal }) =>
      provider.getCommentCount(
        { provider: track.ref.provider, kind: "track", id: track.ref.id },
        signal,
      ),
  });
  if (!canLike && !canComment) return null;

  return (
    <div className="hidden shrink-0 items-center gap-4 sm:flex lg:gap-5">
      {canLike && (
        <PlayerBarStatAction
          count={likeCount.data ?? undefined}
          countClassName={liked ? "text-brand" : "text-content-muted"}
          title={liked ? t("common.action.unlike") : t("common.action.like")}
          shortcutCommandId="toggle-like"
          onClick={() => void commands.toggleLike()}
        >
          {liked ? (
            <PiHeartFill className="size-5 text-brand lg:size-5.5" />
          ) : (
            <PiHeartBold className="size-5 text-content-muted transition-colors group-hover:text-content lg:size-5.5" />
          )}
        </PlayerBarStatAction>
      )}
      {canComment && provider.commentTargetKinds.has("track") && (
        <PlayerBarStatAction
          count={commentCount.data}
          countClassName="text-content-muted group-hover:text-content transition-colors"
          href={getCommentHref("song", track.ref.id)}
          statsStatus={
            commentCount.isError ? "failed" : commentCount.isPending ? "loading" : "idle"
          }
          title={t("contextMenu.comments")}
          shortcutCommandId="open-current-track-comments"
        >
          <PiChatCircleDotsBold className="size-5 text-content-muted transition-colors group-hover:text-content lg:size-5.5" />
        </PlayerBarStatAction>
      )}
    </div>
  );
}

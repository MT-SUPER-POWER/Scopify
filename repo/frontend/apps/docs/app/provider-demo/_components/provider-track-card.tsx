"use client";

import { Heart, ListPlus, Music2 } from "lucide-react";
import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Card, CardContent } from "@scopify/ui/shadcn/components/card";
import { DEMO_IDENTITIES } from "@/constants/provider-demo";
import type { ProviderTrackCardProps } from "@/types/provider-demo";

export function ProviderTrackCard({
  track,
  account,
  liked,
  onToggleLike,
  onEnqueue,
}: ProviderTrackCardProps) {
  const canLike = account.provider === track.ref.provider;
  const source = DEMO_IDENTITIES[track.ref.provider].providerLabel;
  const seconds = Math.floor(track.durationMs / 1000);

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start gap-3">
          <span className="bg-muted grid size-12 shrink-0 place-items-center rounded-lg">
            <Music2 aria-hidden="true" className="text-muted-foreground size-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-medium">{track.title}</h3>
            <p className="text-muted-foreground text-sm">
              {track.artists.map((artist) => artist.name).join(" / ")}
            </p>
            <p className="text-muted-foreground text-xs">
              {track.album?.title} · {Math.floor(seconds / 60)}:
              {String(seconds % 60).padStart(2, "0")}
            </p>
          </div>
          <Badge variant="secondary">{source}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEnqueue}>
            <ListPlus aria-hidden="true" className="size-4" />
            加入混合队列
          </Button>
          <Button
            variant={liked && canLike ? "default" : "outline"}
            size="sm"
            disabled={!canLike}
            aria-pressed={canLike && liked}
            onClick={onToggleLike}
          >
            <Heart
              aria-hidden="true"
              className="size-4"
              fill={canLike && liked ? "currentColor" : "none"}
            />
            {canLike ? (liked ? "已喜欢" : "喜欢") : "当前身份无法收藏"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {canLike
            ? `仅改变 ${DEMO_IDENTITIES[account.provider].providerLabel} 体验账号的喜欢状态。`
            : `可以加入队列；收藏需要切换到 ${source} 身份，不会借用另一个账号。`}
        </p>
      </CardContent>
    </Card>
  );
}

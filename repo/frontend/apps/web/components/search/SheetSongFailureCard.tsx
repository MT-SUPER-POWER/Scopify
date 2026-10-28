"use client";

import { Card, CardContent } from "@scopify/ui/shadcn/components/card";
import { QueryFailure } from "@/components/shared/QueryFailure";
import type { SheetSongFailureCardProps } from "@/types/search/components";

export function SheetSongFailureCard({ song, error, onRetry }: SheetSongFailureCardProps) {
  return (
    <Card className="gap-0 py-0 shadow-none">
      <CardContent className="p-4">
        <p className="truncate text-sm font-medium">{song.name}</p>
        <QueryFailure compact error={error} onRetry={onRetry} />
      </CardContent>
    </Card>
  );
}

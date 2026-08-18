"use client";

import { MoreHorizontal, Settings } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export function ActionBar({ isSelf, onEdit }: { isSelf?: boolean; onEdit?: () => void }) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="flex items-center gap-6 p-6">
      {isSelf ? (
        <button
          type="button"
          onClick={onEdit}
          className="ml-2 text-content-muted transition-colors hover:text-content"
        >
          <Settings className="size-8" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsFollowing((v) => !v)}
          className={cn(
            "rounded-full border px-5 py-1.5 text-sm font-bold tracking-widest uppercase transition-all hover:scale-105",
            isFollowing
              ? "border-content text-content hover:border-content-muted"
              : "border-content-muted text-content hover:border-content",
          )}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}

      <button type="button" className="text-content-muted transition-colors hover:text-content">
        <MoreHorizontal className="size-8" />
      </button>
    </div>
  );
}

export const UserActionBar = React.memo(ActionBar);

"use client";

import { MoreHorizontal, Settings } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export function ActionBar({ isSelf, onEdit }: { isSelf?: boolean; onEdit?: () => void }) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="flex items-center gap-6 px-6 py-6">
      {isSelf ? (
        <button
          type="button"
          onClick={onEdit}
          className="ml-2 text-gray-400 transition-colors hover:text-white"
        >
          <Settings className="h-8 w-8" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsFollowing((v) => !v)}
          className={cn(
            "rounded-full border px-5 py-1.5 text-sm font-bold tracking-widest uppercase transition-all hover:scale-105",
            isFollowing
              ? "border-white text-white hover:border-gray-400"
              : "border-gray-400 text-white hover:border-white",
          )}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}

      <button type="button" className="text-gray-400 transition-colors hover:text-white">
        <MoreHorizontal className="h-8 w-8" />
      </button>
    </div>
  );
}

export const UserActionBar = React.memo(ActionBar);

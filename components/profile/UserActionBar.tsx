"use client";

import { MoreHorizontal, Settings } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export function ActionBar({ isSelf }: { isSelf?: boolean }) {
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <div className="flex items-center px-6 py-6 gap-6">
      {isSelf ? (
        <button className="ml-2 text-gray-400 hover:text-white transition-colors">
          <Settings className="w-8 h-8" />
        </button>
      ) : (
        <button
          onClick={() => setIsFollowing((v) => !v)}
          className={cn(
            "px-5 py-1.5 rounded-full border text-sm font-bold uppercase tracking-widest transition-all hover:scale-105",
            isFollowing
              ? "border-white text-white hover:border-gray-400"
              : "border-gray-400 text-white hover:border-white",
          )}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}

      <button className="text-gray-400 hover:text-white transition-colors">
        <MoreHorizontal className="w-8 h-8" />
      </button>
    </div>
  );
}

export const UserActionBar = React.memo(ActionBar);

import type React from "react";

import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const LIKE_BURST_DIRECTIONS = [0, 60, 120, 180, 240, 300];

export interface LikeButtonProps {
  disabled?: boolean;
  iconClassName?: string;
  liked: boolean;
  likedCount?: number;
  onLike: () => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  disabled = false,
  iconClassName,
  liked,
  likedCount,
  onLike,
}) => {
  const hasMountedRef = useRef(false);
  const previousLikedRef = useRef(liked);
  const [playLikedAnimation, setPlayLikedAnimation] = useState(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousLikedRef.current = liked;
      return;
    }

    const becameLiked = liked && !previousLikedRef.current;
    previousLikedRef.current = liked;

    if (!becameLiked) {
      setPlayLikedAnimation(false);
      return;
    }

    setPlayLikedAnimation(true);
    const timeoutId = setTimeout(() => setPlayLikedAnimation(false), 450);
    return () => clearTimeout(timeoutId);
  }, [liked]);

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onLike();
      }}
      className={cn(
        "relative flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-white",
        liked && "text-[#1DB954]",
        disabled && "pointer-events-none",
      )}
      whileTap={disabled ? undefined : { scale: 0.85 }}
    >
      <div className="relative">
        <motion.div
          animate={playLikedAnimation ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <Heart
            className={cn(
              "size-4 transition-all duration-200",
              liked && "fill-[#1DB954]",
              iconClassName,
            )}
          />
        </motion.div>
        {playLikedAnimation &&
          LIKE_BURST_DIRECTIONS.map((deg) => (
            <motion.span
              key={deg}
              initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 0,
                x: Math.cos((deg * Math.PI) / 180) * 10,
                y: Math.sin((deg * Math.PI) / 180) * 10,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="pointer-events-none absolute top-1/2 left-1/2 size-1 rounded-full bg-[#1DB954]"
              style={{ translateX: "-50%", translateY: "-50%" }}
            />
          ))}
      </div>
      {typeof likedCount === "number" && likedCount > 0 && (
        <span className="text-xs tabular-nums">{likedCount.toLocaleString()}</span>
      )}
    </motion.button>
  );
};

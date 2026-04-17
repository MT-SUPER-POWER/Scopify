import { Heart } from "lucide-react";
import { motion } from "motion/react";
import type React from "react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  liked: boolean;
  likedCount?: number;
  onLike: () => void;
  iconClassName?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ liked, onLike, iconClassName }) => (
  <motion.button
    onClick={onLike}
    className={cn(
      "flex items-center gap-1.5 transition-colors text-zinc-500 hover:text-white",
      liked && "text-[#1DB954]",
    )}
    whileTap={{ scale: 0.85 }}
  >
    <div className="relative">
      <motion.div
        animate={liked ? { scale: [1, 1.4, 0.9, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Heart
          className={cn(
            "w-4 h-4 transition-all duration-200",
            liked && "fill-[#1DB954]",
            iconClassName,
          )}
        />
      </motion.div>
      {liked &&
        [0, 60, 120, 180, 240, 300].map((deg) => (
          <motion.span
            key={deg}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos((deg * Math.PI) / 180) * 10,
              y: Math.sin((deg * Math.PI) / 180) * 10,
              scale: 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-[#1DB954] pointer-events-none"
            style={{ translateX: "-50%", translateY: "-50%" }}
          />
        ))}
    </div>
  </motion.button>
);

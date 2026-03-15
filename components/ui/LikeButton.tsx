import { motion, AnimatePresence } from "motion/react";
import { Heart } from "lucide-react";
import React from "react";

interface LikeButtonProps {
  liked: boolean;
  likedCount: number;
  onLike: () => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ liked, likedCount, onLike }) => (
  <motion.button
    onClick={onLike}
    className={`flex items-center gap-1.5 transition-colors ${liked ? "text-[#1DB954]" : "text-zinc-500 hover:text-white"}`}
    whileTap={{ scale: 0.85 }}
  >
    <AnimatePresence mode="popLayout">
      {likedCount > 0 && (
        <motion.span
          key={likedCount}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="text-xs tabular-nums"
        >
          {likedCount.toLocaleString()}
        </motion.span>
      )}
    </AnimatePresence>
    <div className="relative">
      <motion.div
        animate={
          liked
            ? { scale: [1, 1.4, 0.9, 1.1, 1] }
            : { scale: 1 }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <Heart
          className={`w-4 h-4 transition-all duration-200 ${liked ? "fill-[#1DB954]" : ""}`}
        />
      </motion.div>
      {liked && (
        <>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
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
        </>
      )}
    </div>
  </motion.button>
);

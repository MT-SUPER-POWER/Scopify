import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { IoMusicalNotesOutline } from "react-icons/io5";

export function SongTitle({ title }: { title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [offset, setOffset] = useState(0);

  // 获取文字的长度和被包含的容器大小，两个做差就是要滚动的 offset
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const canScroll = textWidth > containerWidth;

        setIsOverflowing(canScroll);
        if (canScroll) {
          setOffset(textWidth - containerWidth);
        }
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, []);

  return (
    <div className="group flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md p-2.5 text-zinc-300 transition-colors hover:bg-white/5">
      <IoMusicalNotesOutline className="h-4 w-4 shrink-0" />

      {/* 限制宽度的容器 */}
      <div ref={containerRef} className="relative h-5 flex-1 overflow-hidden whitespace-nowrap">
        <AnimatePresence mode="wait">
          <motion.span
            key={title}
            ref={textRef}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 inline-block whitespace-nowrap"
            whileHover={
              isOverflowing
                ? {
                    x: [-0, -offset],
                    transition: {
                      x: {
                        delay: 0.5,
                        duration: offset / 30 + 1, // 根据长度动态计算速度
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      },
                    },
                  }
                : {}
            }
          >
            {title}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

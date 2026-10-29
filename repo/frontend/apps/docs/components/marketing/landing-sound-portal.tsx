"use client";

import { type MotionValue, motion, useTransform } from "framer-motion";

interface LandingSoundPortalProps {
  portal: {
    echo: MotionValue<number>;
    height: MotionValue<string>;
    labelOpacity: MotionValue<number>;
    labelScale: MotionValue<number>;
    opacity: MotionValue<number>;
    radius: MotionValue<string>;
    width: MotionValue<string>;
  };
}

/** 胶囊里竖排章节名后面拖着的残影层数。 */
const ECHO_LAYERS = [1, 2, 3] as const;

/**
 * 副歌的入口：歌词舞台熄灯后，一枚竖着写着「副歌」的胶囊从下方升上来，
 * 往下滚它就放大到铺满整屏，章节名一路推近、拖出残影，最后整片化开、露出这一章。
 * 只在整屏钉住时出现。
 */
export function LandingSoundPortal({ portal }: LandingSoundPortalProps) {
  return (
    <div
      aria-hidden="true"
      className="landing-pin:flex pointer-events-none absolute inset-0 z-10 hidden items-center justify-center"
    >
      <motion.div
        className="relative flex items-center justify-center overflow-hidden border border-white/14 bg-[#05070c] shadow-[0_40px_120px_-20px_rgba(30,215,96,0.28)]"
        style={{
          borderRadius: portal.radius,
          height: portal.height,
          opacity: portal.opacity,
          width: portal.width,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_100%,rgba(30,215,96,0.22),transparent_70%)]" />
        <motion.div
          className="relative flex flex-col items-center gap-5"
          style={{ opacity: portal.labelOpacity, scale: portal.labelScale }}
        >
          <span className="relative">
            {ECHO_LAYERS.map((layer) => (
              <PortalEcho key={layer} layer={layer} echo={portal.echo} />
            ))}
            <span className="landing-display relative block text-[clamp(2.6rem,4.4vw,3.8rem)] leading-none font-semibold text-white [writing-mode:vertical-rl]">
              副歌
            </span>
          </span>
          <span className="font-mono text-[0.62rem] tracking-[0.4em] text-[#1ed760]/80 [writing-mode:vertical-rl]">
            03 · CHORUS
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

/** 一层残影：胶囊越大，它离本体越远、越淡。 */
function PortalEcho({ echo, layer }: { echo: MotionValue<number>; layer: number }) {
  const y = useTransform(echo, (value) => `${-value * layer * 0.55}em`);
  const opacity = useTransform(echo, [0, 0.15, 1], [0, 0.32 / layer, 0.16 / layer]);

  return (
    <motion.span
      className="landing-display absolute inset-0 block text-[clamp(2.6rem,4.4vw,3.8rem)] leading-none font-semibold text-[#1ed760] [writing-mode:vertical-rl]"
      style={{ opacity, y }}
    >
      副歌
    </motion.span>
  );
}

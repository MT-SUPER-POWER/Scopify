"use client";

import { motion } from "motion/react";

import type { LyricVisualizerRendererProps } from "@/types/lyrics";

const BAR_COUNT = 24;

/**
 * Folia-derived mode surface adapted to a static Next registry. The scene
 * deliberately keeps visual state separate from lyric timing and UI chrome.
 */
export function LyricVisualizerScene({ frame, mode }: LyricVisualizerRendererProps) {
  const power = frame.isPlaying ? frame.audioBands.power : 16;
  const modeClass = {
    cadenza: "bg-[#07181c]",
    cappella: "bg-[#112026]",
    claddagh: "bg-[#092019]",
    classic: "bg-[#0d1016]",
    diorama: "bg-[#07121c]",
    fume: "bg-[#21170d]",
    monet: "bg-[#16202a]",
    partita: "bg-[#171119]",
    tilt: "bg-[#18181a]",
  }[mode];

  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${modeClass}`}>
      {mode === "classic" ? (
        <div className="absolute inset-x-[14%] inset-y-[18%] border-y border-white/10" />
      ) : null}
      {mode === "cadenza" ? (
        <div className="absolute inset-0 grid grid-cols-8 gap-px opacity-35">
          {Array.from({ length: 32 }, (_, index) => (
            <i key={index} className={index % 3 === 0 ? "bg-cyan-300/30" : "bg-emerald-200/15"} />
          ))}
        </div>
      ) : null}
      {mode === "partita" ? (
        <div className="absolute inset-x-[11%] top-[20%] space-y-8 opacity-40">
          {Array.from({ length: 5 }, (_, index) => (
            <i key={index} className="block border-t border-fuchsia-100/30" />
          ))}
        </div>
      ) : null}
      {mode === "fume" ? (
        <div className="absolute inset-0 [background-size:32px_32px] opacity-40" />
      ) : null}
      {mode === "cappella" ? <CappellaScene /> : null}
      {mode === "tilt" ? (
        <div className="absolute inset-[-20%] [transform:rotate(-14deg)] border-y border-white/10" />
      ) : null}
      {mode === "monet" ? (
        <div className="absolute inset-10 grid grid-cols-4 gap-3 opacity-35">
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} className={index % 2 === 0 ? "bg-sky-200/25" : "bg-emerald-200/20"} />
          ))}
        </div>
      ) : null}
      {mode === "diorama" ? <DioramaScene /> : null}
      <AudioBars mode={mode} power={power} />
    </div>
  );
}

function AudioBars({ mode, power }: { mode: LyricVisualizerRendererProps["mode"]; power: number }) {
  const normalizedPower = Math.max(0.1, power / 255);
  const isCadenza = mode === "cadenza";
  const isCladdagh = mode === "claddagh";
  const isFume = mode === "fume";

  return (
    <div
      className={
        isCladdagh
          ? "absolute inset-y-8 left-7 flex items-center gap-1"
          : "absolute inset-x-8 bottom-8 flex h-24 items-end justify-center gap-1.5"
      }
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => {
        const factor = 0.26 + (((index * 37) % 11) / 10) * 0.74;
        const extent = Math.max(0.08, Math.min(1, normalizedPower * factor));
        return (
          <motion.i
            key={index}
            aria-hidden
            animate={
              isCladdagh
                ? { opacity: 0.3 + extent * 0.7, width: `${8 + extent * 38}px` }
                : { height: `${8 + extent * 88}px`, opacity: 0.3 + extent * 0.7 }
            }
            transition={{ damping: 18, stiffness: 210, type: "spring" }}
            className={
              isFume
                ? "block w-2 rounded-sm bg-amber-300/80"
                : isCadenza
                  ? "block w-2 bg-cyan-300/80"
                  : isCladdagh
                    ? "block h-1.5 rounded-sm bg-emerald-300/80"
                    : "block w-2 rounded-sm bg-white/65"
            }
          />
        );
      })}
    </div>
  );
}

function CappellaScene() {
  return (
    <div className="absolute inset-x-[12%] top-12 bottom-20 flex flex-col justify-between opacity-55">
      <i className="h-9 w-[42%] rounded-md bg-cyan-200/30" />
      <i className="ml-auto h-12 w-[56%] rounded-md bg-emerald-200/30" />
      <i className="h-10 w-[48%] rounded-md bg-yellow-100/25" />
      <i className="ml-auto h-8 w-[35%] rounded-md bg-cyan-200/30" />
    </div>
  );
}

function DioramaScene() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[48%] origin-bottom [perspective:420px]">
      <div className="absolute inset-0 [transform:rotateX(62deg)] border-t border-cyan-100/35">
        {Array.from({ length: 8 }, (_, index) => (
          <i
            key={index}
            className="absolute inset-x-0 border-t border-cyan-100/15"
            style={{ top: `${index * 14}%` }}
          />
        ))}
      </div>
    </div>
  );
}

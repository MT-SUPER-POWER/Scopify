import React, { useEffect, useState } from "react";
import {
  resolveThemeFontStack,
  resolveThemeFontWeight,
  resolveThemeTranslationFontStack,
} from "../../../utils/fontStacks";
import type { VisualizerSharedProps } from "../definition";
import VisualizerShell from "../VisualizerShell";

// src/components/visualizer/still/VisualizerStill.tsx
// Renders static lyrics inside the shared shell while leaving the background renderer unmounted.
const VisualizerStill: React.FC<VisualizerSharedProps> = ({
  currentLineIndex,
  lines,
  theme,
  subtitleTheme,
  lyricsFontScale = 1,
  subtitleFontScale = 1,
  hideTranslationSubtitle = false,
  isDaylight = false,
  showText = true,
  audioPower,
  audioBands,
  ...sharedProps
}) => {
  const [effectiveIndex, setEffectiveIndex] = useState(() => Math.max(0, currentLineIndex));

  useEffect(() => {
    if (currentLineIndex !== -1) {
      setEffectiveIndex(currentLineIndex);
    } else if (effectiveIndex >= lines.length) {
      setEffectiveIndex(0);
    }
  }, [currentLineIndex, effectiveIndex, lines.length]);

  const resolvedSubtitleTheme = subtitleTheme ?? theme;

  return (
    <VisualizerShell
      theme={theme}
      audioPower={audioPower}
      audioBands={audioBands}
      sharedProps={{
        ...sharedProps,
        isDaylight,
      }}
      renderBackground={false}
      className="visualizer-still"
    >
      <div
        className={`pointer-events-none absolute inset-0 z-0 ${isDaylight ? "opacity-30 mix-blend-multiply" : "opacity-[0.65]"} bg-[radial-gradient(ellipse_at_center,transparent_0%,#000_100%)]`}
      />

      {showText && (
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center gap-8 px-12 pb-16">
          {[-1, 0, 1].map((offset) => {
            const lineIndex = effectiveIndex + offset;
            const line = lines[lineIndex];
            if (!line) {
              return <div key={`empty-${offset}`} className="h-20" />;
            }

            const isCurrent = offset === 0;
            return (
              <div key={lineIndex} className="flex w-full max-w-4xl flex-col items-center">
                {line.fullText && (
                  <div
                    className={`text-center tracking-[0.02em] drop-shadow-md ${isCurrent ? "text-[2.5rem] leading-tight opacity-100" : "text-3xl opacity-30"}`}
                    style={{
                      color: theme.primaryColor,
                      fontFamily: resolveThemeFontStack(theme),
                      scale: lyricsFontScale,
                      fontWeight: resolveThemeFontWeight(theme, isCurrent ? 700 : 600),
                    }}
                  >
                    {line.fullText}
                  </div>
                )}
                {line.translation && !hideTranslationSubtitle && (
                  <div
                    className={`text-center tracking-wide drop-shadow-sm ${isCurrent ? "mt-3 text-2xl opacity-80" : "mt-2 text-xl opacity-30"}`}
                    style={{
                      color: resolvedSubtitleTheme.secondaryColor,
                      fontFamily: resolveThemeTranslationFontStack(resolvedSubtitleTheme),
                      scale: lyricsFontScale * subtitleFontScale,
                      fontWeight: resolveThemeFontWeight(
                        resolvedSubtitleTheme,
                        isCurrent ? 500 : 400,
                      ),
                    }}
                  >
                    {line.translation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </VisualizerShell>
  );
};

export default VisualizerStill;

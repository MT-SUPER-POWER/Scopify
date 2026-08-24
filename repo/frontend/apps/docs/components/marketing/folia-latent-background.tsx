"use client";

import { Dithering, MeshGradient } from "@paper-design/shaders-react";
import { memo, useEffect, useMemo, useState } from "react";

import { LANDING_LATENT_TUNING } from "@/constants/marketing";
import { extractRepresentativeColors } from "@/lib/marketing/folia-latent-colors";
import type { FoliaFluidTheme, FoliaLatentColorSource } from "@/types/marketing";

interface FoliaLatentBackgroundProps {
  coverUrl?: string | null;
  theme: FoliaFluidTheme;
}

const MAX_SHADER_PIXELS = 1280 * 720;

const resolveShaderColors = (
  coverColors: string[],
  theme: FoliaFluidTheme,
  colorSource: FoliaLatentColorSource,
) => {
  const primary = coverColors[0] ?? theme.secondaryColor;
  if (colorSource === "cover-only") {
    const secondary = coverColors[1] ?? primary;
    const tertiary = coverColors[2] ?? secondary;
    return {
      ditheringBack: tertiary,
      ditheringFront: primary,
      mesh: [
        primary,
        secondary,
        tertiary,
        coverColors[3] ?? primary,
        coverColors[4] ?? secondary,
        coverColors[5] ?? tertiary,
      ],
    };
  }

  const secondary = coverColors[1] ?? theme.primaryColor;
  const tertiary = coverColors[2] ?? primary;
  return {
    ditheringBack: theme.backgroundColor,
    ditheringFront: primary,
    mesh: [
      primary,
      secondary,
      tertiary,
      coverColors[3] ?? secondary,
      theme.backgroundColor,
      theme.accentColor,
    ],
  };
};

export const FoliaLatentBackground = memo(function FoliaLatentBackground({
  coverUrl,
  theme,
}: FoliaLatentBackgroundProps) {
  const tuning = LANDING_LATENT_TUNING;
  const [coverColors, setCoverColors] = useState<string[]>([]);
  const showDithering = tuning.displayMode !== "mesh";
  const showMesh = tuning.displayMode !== "dithering";

  useEffect(() => {
    let active = true;
    if (!coverUrl) {
      setCoverColors([]);
      return () => {
        active = false;
      };
    }

    void extractRepresentativeColors(coverUrl).then((colors) => {
      if (active) setCoverColors(colors);
    });
    return () => {
      active = false;
    };
  }, [coverUrl]);

  const shaderColors = useMemo(
    () => resolveShaderColors(coverColors, theme, tuning.colorSource),
    [coverColors, theme, tuning.colorSource],
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      data-folia-background="latent"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {showMesh && (
        <div className="absolute inset-0 origin-center scale-[1.025]">
          <MeshGradient
            width="100%"
            height="100%"
            colors={shaderColors.mesh}
            distortion={tuning.meshDistortion}
            swirl={tuning.meshSwirl}
            grainMixer={0}
            grainOverlay={0}
            speed={tuning.meshSpeed}
            minPixelRatio={1}
            maxPixelCount={MAX_SHADER_PIXELS}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      )}
      {showDithering && (
        <div
          className="absolute inset-0 origin-center scale-[1.015]"
          style={{
            mixBlendMode: showMesh ? "soft-light" : "normal",
            opacity: showMesh ? tuning.ditheringOpacity : 1,
          }}
        >
          <Dithering
            width="100%"
            height="100%"
            colorBack={shaderColors.ditheringBack}
            colorFront={shaderColors.ditheringFront}
            shape="warp"
            type="4x4"
            size={tuning.ditheringSize}
            speed={tuning.ditheringSpeed}
            minPixelRatio={1}
            maxPixelCount={MAX_SHADER_PIXELS}
            style={{ height: "100%", width: "100%" }}
          />
        </div>
      )}
      {tuning.overlayEnabled && tuning.overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: theme.backgroundColor, opacity: tuning.overlayOpacity }}
        />
      )}
    </div>
  );
});

FoliaLatentBackground.displayName = "FoliaLatentBackground";

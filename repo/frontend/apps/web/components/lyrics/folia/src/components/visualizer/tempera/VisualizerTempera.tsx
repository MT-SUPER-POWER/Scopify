import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/store/module/i18n";
import { DEFAULT_TEMPERA_TUNING } from "../../../types";
import type { Line } from "../../../types";
import { extractRepresentativeColors } from "../../../utils/colorExtractor";
import { loadTemperaLayerImageBlobs } from "../../../services/temperaLayerImages";
import { resolveThemeFontStack, resolveThemeFontWeight } from "../../../utils/fontStacks";
import { getLineRenderEndTime } from "../../../utils/lyrics/renderHints";
import type { VisualizerSharedProps } from "../definition";
import { useVisualizerRuntime } from "../runtime";
import VisualizerShell from "../VisualizerShell";
import VisualizerSubtitleOverlay from "../VisualizerSubtitleOverlay";
import type { TemperaPixiRuntime, TemperaSongMetadata } from "./createTemperaPixiRuntime";
import { compileTemperaProgram } from "./temperaProgram";

// src/components/visualizer/tempera/VisualizerTempera.tsx
// Mounts the lazily loaded Pixi director while React retains shell and subtitle responsibilities.
const EMPTY_TEMPERA_LINES: Line[] = [];

const VisualizerTempera: React.FC<VisualizerSharedProps> = (props) => {
  const {
    currentTime,
    currentLineIndex,
    lines,
    theme,
    audioPower,
    audioBands,
    showText = true,
    lyricsFontScale = 1,
    staticMode = false,
    paused = false,
    seed = "tempera",
    coverUrl,
    temperaLayerImageAssets,
    songTitle,
    songArtist,
    songAlbum,
    isPlayerChromeHidden = false,
    hideTranslationSubtitle = false,
    showSubtitleTranslation = true,
    subtitleContentMode,
    subtitleTheme,
    subtitleFontScale,
    subtitleOverlayOpacity,
    subtitleOverlayBackground,
    temperaTuning = DEFAULT_TEMPERA_TUNING,
  } = props;
  const { t } = useI18n();
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<TemperaPixiRuntime | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const temperaTuningRef = useRef(temperaTuning);
  temperaTuningRef.current = temperaTuning;
  const latestSongMetadataRef = useRef<TemperaSongMetadata>({
    title: songTitle,
    artist: songArtist,
    album: songAlbum,
  });
  latestSongMetadataRef.current = {
    title: songTitle,
    artist: songArtist,
    album: songAlbum,
  };
  const [coverColors, setCoverColors] = useState<string[]>([]);
  const [imageBlobs, setImageBlobs] = useState<Map<string, Blob>>(() => new Map());
  const [runtimeFailed, setRuntimeFailed] = useState(false);
  const [isInstrumental, setIsInstrumental] = useState(false);
  const lyricsSig = lines.length === 0 ? "" : `${lines.length}|${lines[0]?.fullText ?? ""}`;
  const seedRef = useRef(seed);

  useEffect(() => {
    if (lyricsSig !== "") {
      setIsInstrumental(false);
      seedRef.current = seed;
      return undefined;
    }
    if (seed !== seedRef.current) {
      setIsInstrumental(false);
      seedRef.current = seed;
    }

    let raf = 0;
    let sawReset = false;
    const startWall = performance.now();
    const watch = () => {
      const time = currentTime.get();
      const capped = performance.now() - startWall >= 3000;
      if (!sawReset && time < 1) sawReset = true;
      if ((sawReset && time >= 2) || capped) {
        setIsInstrumental(true);
        return;
      }
      raf = requestAnimationFrame(watch);
    };
    raf = requestAnimationFrame(watch);
    return () => cancelAnimationFrame(raf);
  }, [seed, lyricsSig, currentTime]);

  const virtualLines = useMemo(() => {
    if (!isInstrumental) return EMPTY_TEMPERA_LINES;
    const generated: Line[] = [];
    for (let i = 0; i < 60; i++) {
      generated.push({
        id: `virtual-block-${i}`,
        startTime: i * 8,
        endTime: i * 8 + 6,
        fullText: "♪",
        words: [],
        isChorus: false,
      });
    }
    return generated;
  }, [isInstrumental]);

  const programLines = showText ? (lines.length > 0 ? lines : virtualLines) : EMPTY_TEMPERA_LINES;
  const program = useMemo(() => compileTemperaProgram(programLines, seed), [programLines, seed]);
  const { activeLine, recentCompletedLine, nextLines } = useVisualizerRuntime({
    currentTime,
    currentLineIndex,
    lines,
    getLineEndTime: getLineRenderEndTime,
  });

  // Cover-art colours feed the gradient colour mode only; the other modes derive everything
  // from the theme, so there is no reason to decode the artwork for them.
  const needsCoverColors = temperaTuning.colorMode === "gradient";
  useEffect(() => {
    if (!needsCoverColors || !coverUrl) {
      setCoverColors([]);
      return undefined;
    }
    let active = true;
    void extractRepresentativeColors(coverUrl, 5)
      .then((colors) => {
        if (active) setCoverColors(colors);
      })
      .catch(() => {
        if (active) setCoverColors([]);
      });
    return () => {
      active = false;
    };
  }, [coverUrl, needsCoverColors]);

  // The placed images live in IndexedDB; only their ids and placement ride in the tuning.
  // Blobs are handed to the renderer as-is, which decodes them itself - see the note there
  // on why an object URL would not survive Pixi's asset loader.
  const layerImages = temperaTuning.layerImages;
  const layerImagesRef = useRef(layerImages);
  layerImagesRef.current = layerImages;
  const injectedAssetsRef = useRef(temperaLayerImageAssets);
  injectedAssetsRef.current = temperaLayerImageAssets;
  // Keyed on the id set, not the array: dragging a slider hands down a new array every
  // pointer move, and re-reading storage for each of those would be pure waste.
  const layerImageIds = layerImages.map((image) => image.id).join("|");
  const injectedAssetIds = (temperaLayerImageAssets ?? []).map((asset) => asset.id).join("|");
  useEffect(() => {
    const placements = layerImagesRef.current;
    const injected = injectedAssetsRef.current;
    if (placements.length === 0) {
      setImageBlobs(new Map());
      return undefined;
    }
    let active = true;
    // The OBS overlay ships the pool inline because that page has no access to the app's
    // IndexedDB; when it does, storage is not consulted at all.
    const load =
      injected && injected.length > 0
        ? Promise.all(
            injected.map(
              async (asset) =>
                [asset.id, await fetch(asset.url).then((response) => response.blob())] as const,
            ),
          ).then((entries) => new Map(entries))
        : loadTemperaLayerImageBlobs(placements);
    void load
      .then((blobs) => {
        if (active) setImageBlobs(blobs);
      })
      .catch(() => {
        if (active) setImageBlobs(new Map());
      });
    return () => {
      active = false;
    };
  }, [layerImageIds, injectedAssetIds]);

  // Tuning is pushed into the live renderer rather than rebuilding it. A rebuild per pointer
  // move re-initialises WebGL, re-decodes every placed image and re-measures every line.
  useEffect(() => {
    runtimeRef.current?.setTuning(temperaTuning);
  }, [temperaTuning]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    let disposed = false;
    let createdRuntime: TemperaPixiRuntime | null = null;
    const abortController = new AbortController();
    setRuntimeFailed(false);
    void import("./createTemperaPixiRuntime")
      .then(({ TemperaPixiRuntime }) => {
        const metadata = latestSongMetadataRef.current;
        return TemperaPixiRuntime.create({
          host,
          program,
          theme,
          tuning: temperaTuningRef.current,
          currentTime,
          lyricsFontScale,
          staticMode,
          coverColors,
          imageBlobs,
          paused: pausedRef.current,
          songTitle: metadata.title,
          songArtist: metadata.artist,
          songAlbum: metadata.album,
          signal: abortController.signal,
        });
      })
      .then((runtime) => {
        if (disposed) {
          runtime.destroy();
          return;
        }
        createdRuntime = runtime;
        runtimeRef.current = runtime;
        runtime.setSongMetadata(latestSongMetadataRef.current);
        // The tuning may have moved on while Pixi was importing or initializing.
        runtime.setTuning(temperaTuningRef.current);
        // The pause state may have changed while Pixi was importing or initializing.
        runtime.setPaused(pausedRef.current);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("[Tempera] Pixi runtime initialization failed", error);
        if (!disposed) setRuntimeFailed(true);
      });
    return () => {
      disposed = true;
      abortController.abort();
      if (createdRuntime) {
        createdRuntime.destroy();
        if (runtimeRef.current === createdRuntime) runtimeRef.current = null;
      } else if (runtimeRef.current) {
        runtimeRef.current.destroy();
        runtimeRef.current = null;
      }
      host.replaceChildren();
    };
  }, [coverColors, currentTime, imageBlobs, lyricsFontScale, program, staticMode, theme]);

  useEffect(() => {
    runtimeRef.current?.setSongMetadata(latestSongMetadataRef.current);
  }, [songAlbum, songArtist, songTitle]);

  useEffect(() => {
    runtimeRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(
    () =>
      currentTime.on("change", () => {
        if (paused) runtimeRef.current?.renderOnce();
      }),
    [currentTime, paused],
  );

  const fallbackFontFamily = resolveThemeFontStack(theme);
  const fallbackFontWeight = resolveThemeFontWeight(theme, 600);
  const finalLine = lines.at(-1);
  const creditsRecentCompletedLine = recentCompletedLine === finalLine ? null : recentCompletedLine;

  return (
    <VisualizerShell
      theme={theme}
      audioPower={audioPower}
      audioBands={audioBands}
      sharedProps={props}
    >
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div ref={hostRef} className="absolute inset-0 z-10" aria-hidden="true" />
        {(runtimeFailed || program.paragraphs.length === 0) && (
          <div
            className="absolute inset-0 flex items-center justify-center px-10 text-center transition-opacity duration-300"
            style={{
              color: theme.primaryColor,
              fontFamily: fallbackFontFamily,
              fontWeight: fallbackFontWeight,
              fontSize: `clamp(2rem, ${5.4 * lyricsFontScale}vw, 5.6rem)`,
            }}
          >
            {showText && !isInstrumental
              ? activeLine?.fullText || t("folia.ui.waitingForMusic")
              : null}
          </div>
        )}
      </div>

      <VisualizerSubtitleOverlay
        showText={showText}
        activeLine={activeLine}
        recentCompletedLine={creditsRecentCompletedLine}
        nextLines={nextLines}
        theme={theme}
        subtitleTheme={subtitleTheme}
        translationFontSize={`clamp(${1.05 * lyricsFontScale}rem, ${2.2 * lyricsFontScale}vw, ${1.25 * lyricsFontScale}rem)`}
        upcomingFontSize={`clamp(${0.9 * lyricsFontScale}rem, ${1.8 * lyricsFontScale}vw, ${1.05 * lyricsFontScale}rem)`}
        subtitleFontScale={subtitleFontScale}
        subtitleOverlayOpacity={subtitleOverlayOpacity}
        subtitleOverlayBackground={subtitleOverlayBackground}
        isPlayerChromeHidden={isPlayerChromeHidden}
        hideTranslationSubtitle={hideTranslationSubtitle}
        showSubtitleTranslation={showSubtitleTranslation}
        subtitleContentMode={subtitleContentMode}
      />
    </VisualizerShell>
  );
};

export default VisualizerTempera;

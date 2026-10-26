"use client";

import { LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useMVUrlQuery } from "@/hooks/mv/useMVQueries";
import { useMvSongExclusivity } from "@/hooks/mv/useMvSongExclusivity";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { MvPlayerProps } from "@/types/components/mv";

const MAX_RESOLUTION = 1080;

/** MV 页的 16:9 播放器：右上角切换画质，切换时从当前进度接着播。 */
export function MvPlayer({ mvid, resolutions, poster }: MvPlayerProps) {
  const { t } = useI18n();
  const available = resolutions
    .map((item) => item.br)
    .filter((br) => br <= MAX_RESOLUTION)
    .sort((a, b) => b - a);
  const [selected, setSelected] = useState<number | null>(null);
  const resolution = selected ?? available[0] ?? MAX_RESOLUTION;
  const urlQuery = useMVUrlQuery(mvid, resolution);
  const url = urlQuery.data?.data?.url ?? null;
  const { videoRef, handleVideoPlay } = useMvSongExclusivity();
  const resumeAtRef = useRef(0);

  const changeResolution = (br: number) => {
    resumeAtRef.current = videoRef.current?.currentTime ?? 0;
    setSelected(br);
  };

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-panel">
      {url ? (
        <video
          ref={videoRef}
          key={url}
          src={url}
          poster={poster}
          autoPlay
          controls
          playsInline
          onPlay={handleVideoPlay}
          onLoadedMetadata={(event) => {
            if (resumeAtRef.current > 0) event.currentTarget.currentTime = resumeAtRef.current;
            resumeAtRef.current = 0;
          }}
          className="size-full object-contain"
        />
      ) : urlQuery.isError || (urlQuery.isSuccess && !url) ? (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
          {t("mv.status.unavailable")}
        </p>
      ) : (
        <LoaderCircle className="absolute inset-0 m-auto size-8 animate-spin text-white/70" />
      )}

      {available.length > 1 && (
        <div
          role="radiogroup"
          aria-label={t("mv.quality")}
          className="absolute top-3 right-3 flex gap-1 rounded-full bg-black/55 p-1 opacity-0 backdrop-blur-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        >
          {available.map((br) => (
            <button
              key={br}
              type="button"
              role="radio"
              aria-checked={br === resolution}
              onClick={() => changeResolution(br)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors",
                br === resolution ? "bg-white text-black" : "text-white/80 hover:text-white",
              )}
            >
              {br}P
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

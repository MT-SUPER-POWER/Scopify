"use client";

import { FoliaStudioWindow } from "@scopify/ui/scopify/components/folia-studio/window";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { LYRIC_ANTIALIAS_LABELS } from "@/components/lyrics/folia/src/components/visualizer/renderQuality/LyricRenderQualityRows";
import { formatLyricRenderScale } from "@/components/lyrics/folia/src/utils/lyricRenderQuality";
import { useFoliaModalFocus } from "@/hooks/lyrics/useFoliaModalFocus";
import { runFoliaRenderPerformanceCheck } from "@/lib/lyrics/folia/runRenderPerformanceCheck";
import { useLyricStageStore } from "@/store/module/lyrics";
import type {
  FoliaRenderPerformanceDialogProps,
  FoliaRenderPerformanceState,
} from "@/types/lyrics/folia/renderPerformance";

export function FoliaRenderPerformanceDialog({
  onClose,
  theme,
}: FoliaRenderPerformanceDialogProps) {
  const { t, i18n } = useTranslation();
  const panelRef = useFoliaModalFocus(true, onClose);
  const hostRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<FoliaRenderPerformanceState>({ status: "idle" });
  const numbers = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 1 });
  const percentages = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: "percent",
    maximumFractionDigits: 1,
  });

  useEffect(() => () => controllerRef.current?.abort(), []);

  const start = async () => {
    const host = hostRef.current;
    if (!host || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: "running" });
    try {
      const report = await runFoliaRenderPerformanceCheck({
        host,
        theme,
        current: useLyricStageStore.getState().lyricRenderQuality,
        signal: controller.signal,
        onProgress: (step, total) => setState({ status: "running", step, total }),
      });
      if (!controller.signal.aborted) setState({ status: "complete", report });
    } catch (error) {
      if (!controller.signal.aborted) {
        console.warn("[FoliaRenderPerformance] Measurement failed", error);
        setState({ status: "failed" });
      }
    } finally {
      controllerRef.current = null;
    }
  };

  const running = state.status === "running";
  if (typeof document === "undefined") return null;
  return createPortal(
    <FoliaStudioWindow
      panelRef={panelRef}
      layer={210}
      title={t("folia.perfCheck.title")}
      backLabel={t("folia.ui.close")}
      onClose={onClose}
      isDaylight={theme.name === "snow"}
      colors={theme}
    >
      <p className="px-5 py-3 text-sm text-[color:var(--st-t2)]">
        {t("folia.perfCheck.description")}
      </p>
      <div className="relative min-h-0 flex-1 overflow-auto border-y border-[var(--st-line)]">
        <div ref={hostRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
        {state.status === "running" && (
          <p
            role="status"
            className="absolute top-3 right-3 rounded-lg bg-black/75 px-3 py-2 text-sm text-white"
          >
            {state.step !== undefined && state.total !== undefined
              ? t("folia.perfCheck.progress", { step: state.step, total: state.total })
              : t("folia.perfCheck.measuringDisplay")}
          </p>
        )}
        {state.status === "failed" && (
          <p role="alert" className="px-5 py-4 text-sm">
            {t("folia.perfCheck.failed")}
          </p>
        )}
        {state.status === "complete" && (
          <table className="relative w-full min-w-120 text-left text-sm tabular-nums">
            <thead>
              <tr className="border-b border-[var(--st-line)] [&>th]:px-4 [&>th]:py-3">
                <th scope="col">{t("folia.options.lyricRenderScale")}</th>
                <th scope="col">{t("folia.options.lyricRenderAntialias")}</th>
                <th scope="col">{t("folia.perfCheck.averageFps")}</th>
                <th scope="col">{t("folia.perfCheck.lowFps")}</th>
                <th scope="col">{t("folia.perfCheck.lateFrames")}</th>
              </tr>
            </thead>
            <tbody>
              {state.report.results.map((result) => (
                <tr
                  key={String(result.quality.scale) + result.quality.antialias}
                  className="border-b border-[var(--st-line)] [&>td]:px-4 [&>td]:py-3"
                >
                  <td>
                    {formatLyricRenderScale(result.quality.scale)}
                    {result === state.report.recommended && (
                      <span className="ml-2 text-xs font-medium text-[color:var(--st-t2)]">
                        {t("folia.perfCheck.recommended")}
                      </span>
                    )}
                  </td>
                  <td>{t(LYRIC_ANTIALIAS_LABELS[result.quality.antialias])}</td>
                  <td>{numbers.format(result.fps)}</td>
                  <td>{numbers.format(result.lowFps)}</td>
                  <td>{percentages.format(result.lateShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2 px-5 py-4">
        <Button variant="outline" onClick={onClose}>
          {t(running ? "folia.ui.cancel" : "folia.ui.close")}
        </Button>
        {!running && (
          <Button
            variant={state.status === "complete" ? "outline" : "default"}
            onClick={() => void start()}
          >
            {t(state.status === "idle" ? "folia.perfCheck.start" : "folia.perfCheck.retry")}
          </Button>
        )}
        {state.status === "complete" && (
          <Button
            onClick={() => {
              useLyricStageStore.getState().patchSettings({
                lyricRenderQuality: state.report.recommended.quality,
              });
              onClose();
            }}
          >
            {t("folia.perfCheck.apply")}
          </Button>
        )}
      </div>
    </FoliaStudioWindow>,
    document.body,
  );
}

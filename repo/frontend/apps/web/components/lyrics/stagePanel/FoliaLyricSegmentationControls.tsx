"use client";

import { Fragment, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  FoliaPanelButton,
  FoliaPanelRow,
  FoliaToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";

import { splitLyricGraphemes } from "@/components/lyrics/folia/src/utils/lyrics/graphemeTiming";
import {
  useLyricSegmentation,
  useSaveLyricSegmentation,
} from "@/hooks/lyrics/useLyricSegmentation";
import { usePlaybackProjection } from "@/hooks/player/usePlaybackProjection";
import {
  getDefaultLyricBoundaries,
  getLyricSegmentationLineKey,
  isValidLyricSegmentation,
} from "@/lib/lyrics/segmentation";
import type { LyricData, LyricDisplayLine } from "@/types/lyrics/model";
import type { LyricSegmentationLineEditorProps } from "@/types/lyrics/segmentation";

export function FoliaLyricSegmentationControls() {
  const { t } = useTranslation();
  const playback = usePlaybackProjection<LyricData>();
  const projectedTrackId = playback.track?.id ?? null;
  const trackId = projectedTrackId === null ? null : String(projectedTrackId);
  const { automatic, overrides } = useLyricSegmentation(trackId);
  const { saveAutomatic, saveOverride } = useSaveLyricSegmentation();
  const automaticLabelId = useId();
  const [selectedLineKey, setSelectedLineKey] = useState("");
  const lines = playback.lyrics?.isPureMusic ? [] : (playback.lyrics?.lines ?? []);
  const eligibleLines = new Map<string, LyricDisplayLine>();
  for (const line of lines) {
    if (line.text.trim()) eligibleLines.set(getLyricSegmentationLineKey(line), line);
  }
  const lineKey = eligibleLines.has(selectedLineKey)
    ? selectedLineKey
    : (eligibleLines.keys().next().value ?? "");
  const selectedLine = eligibleLines.get(lineKey);
  const pending = automatic.isPending || (trackId !== null && overrides.isPending);
  const failedAutomatic = automatic.isError && automatic.data === undefined;
  const failedOverrides = trackId !== null && overrides.isError && overrides.data === undefined;
  const stored = overrides.data?.[lineKey];
  const reportSaveError = () => toast.error(t("lyrics.segmentation.saveFailed"));

  return (
    <details className="mx-1 my-2 rounded-xl border border-[var(--st-line)] px-2">
      <summary className="st-focus-inside cursor-pointer py-2 text-sm">
        {t("lyrics.segmentation.title")}
      </summary>
      <div className="space-y-2 pb-2">
        <FoliaPanelRow
          label={<span id={automaticLabelId}>{t("lyrics.segmentation.automatic")}</span>}
        >
          <FoliaToggle
            checked={automatic.data ?? false}
            disabled={automatic.data === undefined || saveAutomatic.isPending}
            labelledBy={automaticLabelId}
            onChange={(enabled) => saveAutomatic.mutate(enabled, { onError: reportSaveError })}
          />
        </FoliaPanelRow>
        {failedAutomatic || failedOverrides ? (
          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            <span role="alert">{t("lyrics.segmentation.loadFailed")}</span>
            <FoliaPanelButton
              onClick={() => {
                if (failedAutomatic) void automatic.refetch();
                if (failedOverrides) void overrides.refetch();
              }}
            >
              {t("common.action.retry")}
            </FoliaPanelButton>
          </div>
        ) : pending ? (
          <p role="status" className="px-1 text-xs text-[color:var(--st-t3)]">
            {t("common.status.loading")}
          </p>
        ) : trackId !== null && selectedLine ? (
          <>
            <label className="grid gap-1 px-1 text-xs">
              <span>{t("lyrics.segmentation.line")}</span>
              <select
                className="st-focus-inside min-w-0 rounded-lg bg-[var(--st-fill)] px-2 py-1.5 text-sm text-[color:var(--st-t1)]"
                value={lineKey}
                onChange={(event) => setSelectedLineKey(event.currentTarget.value)}
              >
                {[...eligibleLines].map(([key, line], index) => (
                  <option key={key} value={key}>
                    {index + 1}. {line.text}
                  </option>
                ))}
              </select>
            </label>
            <SegmentationLineEditor
              key={JSON.stringify([trackId, lineKey, stored, automatic.data])}
              text={selectedLine.text}
              saved={isValidLyricSegmentation(selectedLine.text, stored) ? stored : undefined}
              automatic={automatic.data ?? false}
              isSaving={saveOverride.isPending}
              onSave={(boundaries) =>
                saveOverride.mutate(
                  { trackId, line: selectedLine, boundaries },
                  { onError: reportSaveError },
                )
              }
            />
          </>
        ) : (
          <p className="px-1 text-xs text-[color:var(--st-t3)]">{t("lyrics.segmentation.empty")}</p>
        )}
      </div>
    </details>
  );
}

function SegmentationLineEditor({
  text,
  saved,
  automatic,
  isSaving,
  onSave,
}: LyricSegmentationLineEditorProps) {
  const { t } = useTranslation();
  const [initial] = useState(() => saved ?? getDefaultLyricBoundaries(text, automatic));
  const [draft, setDraft] = useState(initial);
  const cuts = new Set<number>();
  let offset = 0;
  for (const piece of draft) {
    offset += piece.length;
    if (offset < text.length) cuts.add(offset);
  }

  function toggleCut(cut: number) {
    const next = new Set(cuts);
    if (next.has(cut)) next.delete(cut);
    else next.add(cut);
    const ends = [...next, text.length].sort((left, right) => left - right);
    setDraft(ends.map((end, index) => text.slice(ends[index - 1] ?? 0, end)));
  }

  let characterOffset = 0;
  const hasChanges =
    draft.length !== initial.length || draft.some((piece, index) => piece !== initial[index]);
  return (
    <>
      <p className="px-1 text-xs leading-4 text-[color:var(--st-t3)]">
        {t("lyrics.segmentation.hint")}
      </p>
      <div className="flex flex-wrap items-center rounded-lg bg-[var(--st-fill)] px-2 py-1">
        {splitLyricGraphemes(text).map((character, index) => {
          characterOffset += character.length;
          const cut = characterOffset;
          const active = cuts.has(cut);
          return (
            <Fragment key={cut}>
              <span className="whitespace-pre-wrap">{character}</span>
              {cut < text.length ? (
                <button
                  type="button"
                  aria-label={t("lyrics.segmentation.boundary", { index: index + 1 })}
                  aria-pressed={active}
                  className="st-focus-inside grid h-7 w-5 place-items-center rounded hover:bg-[var(--st-fill2)]"
                  disabled={isSaving}
                  onClick={() => toggleCut(cut)}
                >
                  <span
                    aria-hidden
                    className={`h-3 w-px ${active ? "bg-[var(--st-accent)]" : "bg-[var(--st-t3)] opacity-30"}`}
                  />
                </button>
              ) : null}
            </Fragment>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <FoliaPanelButton disabled={isSaving || !saved} onClick={() => onSave(null)}>
          {t("lyrics.segmentation.reset")}
        </FoliaPanelButton>
        <FoliaPanelButton disabled={isSaving || !hasChanges} onClick={() => onSave(draft)}>
          {t(isSaving ? "common.action.saving" : "common.action.save")}
        </FoliaPanelButton>
      </div>
    </>
  );
}

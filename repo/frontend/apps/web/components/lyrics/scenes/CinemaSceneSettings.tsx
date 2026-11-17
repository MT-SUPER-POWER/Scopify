"use client";

import {
  FoliaPanelButton,
  FoliaPanelRow,
  FoliaSegments,
  FoliaToggle,
} from "@scopify/ui/scopify/components/folia-panel/controls";
import { ScanLine } from "lucide-react";
import { useId, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { HALL, ROWS } from "@/components/lyrics/folia/src/components/scenes/cinema/cinemaLayout";
import { availableCinemaSeats, cinemaSeats, resolveCinemaSeat } from "@/lib/lyrics/cinema/seats";
import { useCinemaSceneStore } from "@/store/module/cinemaScene";
import type { CinemaQuality } from "@/types/lyrics/cinema";

const front = Math.min(...cinemaSeats.map((seat) => seat.eye[2])) - 0.45;
const back = Math.max(...cinemaSeats.map((seat) => seat.eye[2])) + 0.45;

function CinemaSeatMap() {
  const { t } = useTranslation();
  const seatId = useCinemaSceneStore((state) => state.seatId);
  const setPreferences = useCinemaSceneStore((state) => state.updatePreferences);
  const selected = resolveCinemaSeat(seatId);

  const moveFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = availableCinemaSeats.indexOf(selected);
    const count = availableCinemaSeats.length;
    let next;
    switch (event.key) {
      case "ArrowLeft":
        next = availableCinemaSeats[(index + count - 1) % count];
        break;
      case "ArrowRight":
        next = availableCinemaSeats[(index + 1) % count];
        break;
      case "ArrowUp":
      case "ArrowDown": {
        const offset = event.key === "ArrowUp" ? -1 : 1;
        const row = ((selected.row - 1 + ROWS.count + offset) % ROWS.count) + 1;
        const inRow = availableCinemaSeats.filter((seat) => seat.row === row);
        next = inRow.reduce((nearest, seat) =>
          Math.abs(seat.eye[0] - selected.eye[0]) < Math.abs(nearest.eye[0] - selected.eye[0])
            ? seat
            : nearest,
        );
        break;
      }
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    setPreferences({ seatId: next.id });
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-seat="${next.id}"]`)?.focus();
  };

  return (
    <details className="px-1 py-2">
      <summary className="st-focus-inside cursor-pointer rounded-lg text-sm">
        {t("folia.scene.seatLabel", { row: selected.row, number: selected.number })}
      </summary>
      <div className="mx-auto mt-3 h-0.5 w-2/3 rounded-full bg-[var(--st-t3)]" />
      <div className="mt-1 text-center text-xs text-[color:var(--st-t3)]">
        {t("folia.scene.screen")}
      </div>
      <div
        role="radiogroup"
        aria-label={t("folia.scene.seat")}
        className="relative aspect-[19/16]"
        onKeyDown={moveFocus}
      >
        {cinemaSeats.map((seat) => {
          const checked = seat.id === selected.id;
          const label = t("folia.scene.seatLabel", { row: seat.row, number: seat.number });
          return (
            <button
              key={seat.id}
              type="button"
              role="radio"
              data-seat={seat.id}
              aria-checked={checked}
              aria-label={label}
              className={`absolute aspect-square w-[2.7%] -translate-1/2 rounded-xs focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--st-accent)] ${
                checked
                  ? "bg-[var(--st-accent)]"
                  : "bg-[var(--st-t3)] enabled:hover:bg-[var(--st-t1)] disabled:opacity-35"
              }`}
              style={{
                left: `${((seat.eye[0] + HALL.halfWidth) / (2 * HALL.halfWidth)) * 100}%`,
                top: `${((seat.eye[2] - front) / (back - front)) * 100}%`,
              }}
              disabled={seat.occupied}
              tabIndex={checked ? 0 : -1}
              title={label}
              onClick={() => setPreferences({ seatId: seat.id })}
            />
          );
        })}
      </div>
    </details>
  );
}

export function CinemaSceneSettings() {
  const { t } = useTranslation();
  const id = useId();
  const { enabled, houseLights, curtainsOnPause, quality, recenter, updatePreferences } =
    useCinemaSceneStore();

  return (
    <section aria-label={t("folia.scene.title")} className="mt-2">
      <FoliaPanelRow label={<span id={`${id}-enabled`}>{t("folia.scene.cinema")}</span>}>
        <FoliaToggle
          checked={enabled}
          labelledBy={`${id}-enabled`}
          onChange={(value) => updatePreferences({ enabled: value })}
        />
      </FoliaPanelRow>
      {enabled ? (
        <>
          <FoliaPanelRow label={<span id={`${id}-lights`}>{t("folia.scene.houseLights")}</span>}>
            <FoliaToggle
              checked={houseLights}
              labelledBy={`${id}-lights`}
              onChange={(value) => updatePreferences({ houseLights: value })}
            />
          </FoliaPanelRow>
          <FoliaPanelRow label={<span id={`${id}-curtains`}>{t("folia.scene.curtains")}</span>}>
            <FoliaToggle
              checked={curtainsOnPause}
              labelledBy={`${id}-curtains`}
              onChange={(value) => updatePreferences({ curtainsOnPause: value })}
            />
          </FoliaPanelRow>
          <FoliaPanelRow label={t("folia.scene.quality")}>
            <FoliaSegments<CinemaQuality>
              value={quality}
              options={[
                { value: "low", label: t("folia.scene.qualityLow") },
                { value: "medium", label: t("folia.scene.qualityMedium") },
                { value: "high", label: t("folia.scene.qualityHigh") },
              ]}
              onChange={(value) => updatePreferences({ quality: value })}
              size="s"
            />
          </FoliaPanelRow>
          <CinemaSeatMap />
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-2">
            <p className="max-w-40 text-xs text-[color:var(--st-t3)]">
              {t("folia.scene.lookAround")}
            </p>
            <FoliaPanelButton icon={ScanLine} onClick={recenter}>
              {t("folia.scene.recenter")}
            </FoliaPanelButton>
          </div>
        </>
      ) : null}
    </section>
  );
}

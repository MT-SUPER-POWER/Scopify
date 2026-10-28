// Adapted from RhineLabUI (d9ecb6c) theme-motion.ts; see SOURCE.md and LICENSE.RhineLabUI.
import type { RhineThemeCell } from "@/types/lyrics/rhine/runtime";

const ease = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};
const cellKey = (cell: RhineThemeCell) => `${cell.lane}:${cell.row}`;

/** A theme change sweeps out from the current archive; each file can be interrupted mid-way. */
export class ThemeWave {
  target: number;
  private start = -Infinity;
  private origin: RhineThemeCell = { row: 0, lane: 0 };
  private from = new Map<string, number>();
  private latest = new Map<string, number>();
  private backgroundFrom: number;

  constructor(dark: boolean) {
    this.target = this.backgroundFrom = Number(dark);
  }

  set(dark: boolean, time: number, origin: RhineThemeCell, immediate = false) {
    const target = Number(dark);
    if (target === this.target && !immediate) return;
    this.backgroundFrom = immediate ? target : this.background(time);
    this.from = immediate ? new Map() : new Map(this.latest);
    this.target = target;
    this.start = immediate ? -Infinity : time;
    this.origin = { row: origin.row, lane: origin.lane };
  }

  background(time: number) {
    return (
      this.backgroundFrom + (this.target - this.backgroundFrom) * ease((time - this.start) / 0.85)
    );
  }

  beginFrame() {
    this.latest.clear();
  }

  sample(cell: RhineThemeCell, time: number) {
    const delay = Math.min(
      0.6,
      Math.abs(cell.row - this.origin.row) * 0.034 + Math.abs(cell.lane - this.origin.lane) * 0.11,
    );
    const key = cellKey(cell);
    const from = this.from.get(key) ?? this.backgroundFrom;
    const value = from + (this.target - from) * ease((time - this.start - delay) / 0.58);
    this.latest.set(key, value);
    return value;
  }
}

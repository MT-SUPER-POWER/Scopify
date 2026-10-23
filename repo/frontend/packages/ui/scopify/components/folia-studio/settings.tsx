"use client";

import { useId, type ReactNode } from "react";
import { FoliaToggle } from "@scopify/ui/scopify/components/folia-panel/controls";

// Folia settings-kit grouping: a heading outside a joined card, with labelled rows inside.
export function FoliaSettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <h3 id={id} className="px-1 text-xs font-semibold text-[color:var(--st-t2)]">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-[var(--st-line)] bg-[var(--st-card)] [&>*+*]:border-t [&>*+*]:border-[var(--st-line)]">
        {children}
      </div>
    </section>
  );
}

export function FoliaSettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[color:var(--st-t2)]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function FoliaSettingsToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <span id={id} className="text-sm">
          {label}
        </span>
        {description ? (
          <p className="mt-1 text-xs leading-5 text-[color:var(--st-t2)]">{description}</p>
        ) : null}
      </div>
      <FoliaToggle checked={checked} onChange={onChange} labelledBy={id} />
    </div>
  );
}

export function FoliaSettingsRange({
  label,
  value,
  min,
  max,
  step,
  onChange,
  valueText,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  valueText: string;
}) {
  const id = useId();
  const progress = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex justify-between gap-3 text-sm">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="text-[color:var(--st-t2)] tabular-nums">
          {valueText}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
        className="folia-studio-range w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--st-accent) ${progress}%, var(--st-track) ${progress}%)`,
        }}
      />
    </div>
  );
}

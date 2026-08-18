"use client";

import { useEffect, useId, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CacheCheckboxProps } from "@/types/components/cache";

export function CacheCheckbox({
  checked,
  disabled = false,
  indeterminate = false,
  label,
  onCheckedChange,
}: CacheCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-center gap-3",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <span className="relative grid size-4 shrink-0 place-items-center">
        <input
          ref={inputRef}
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "grid size-4 place-items-center rounded-[3px] border border-input bg-background transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring/60",
            (checked || indeterminate) && "border-primary bg-primary text-primary-foreground",
          )}
          aria-hidden="true"
        >
          {indeterminate ? (
            <Minus className="size-3" />
          ) : checked ? (
            <Check className="size-3" />
          ) : null}
        </span>
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </label>
  );
}

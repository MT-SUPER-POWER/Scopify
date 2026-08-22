"use client";

import { ShadcnPreview } from "@/components/docs/shadcn-preview";
import { ShadcnThemeScope } from "@/components/theme-prototype/shadcn-theme-scope";
import type { ComponentPreviewProps } from "@/types/component-docs";

export function ComponentPreview({ name }: ComponentPreviewProps) {
  return (
    <ShadcnThemeScope className="not-prose my-6">
      <section className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm">
        <div className="bg-muted/40 flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Interactive preview
          </span>
          <span className="bg-background text-muted-foreground rounded-full border px-2 py-0.5 font-mono text-[11px]">
            shadcn
          </span>
        </div>
        <div className="component-preview-grid bg-background/80 flex min-h-52 items-center justify-center p-8 sm:p-12">
          <ShadcnPreview name={name} />
        </div>
      </section>
    </ShadcnThemeScope>
  );
}

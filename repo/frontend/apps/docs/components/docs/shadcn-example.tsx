"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { ShadcnPreview } from "@/components/docs/shadcn-preview";

import { ShadcnThemeScope } from "@/components/theme-prototype/shadcn-theme-scope";
import type { ShadcnExampleProps } from "@/types/component-docs";

export function ShadcnExample({
  align = "center",
  children,
  code,
  direction = "ltr",
  hideCode = false,
  label,
  lang = "tsx",
  name,
  previewClassName,
}: ShadcnExampleProps) {
  return (
    <div className="not-prose my-6 space-y-3">
      {label ? <p className="text-muted-foreground text-sm">{label}</p> : null}
      <ShadcnThemeScope>
        <section className="bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm">
          <div className="bg-muted/40 border-b px-4 py-2.5">
            <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Preview
            </span>
          </div>
          <div
            dir={direction}
            data-align={align}
            className={`component-preview-grid bg-background/80 flex min-h-36 p-5 sm:min-h-48 sm:p-8 ${
              align === "start"
                ? "items-start justify-center"
                : align === "end"
                  ? "items-end justify-center"
                  : "items-center justify-center"
            } ${previewClassName ?? ""}`}
          >
            {children ?? (name ? <ShadcnPreview name={name} /> : null)}
          </div>
        </section>
      </ShadcnThemeScope>
      <section aria-label="Example code" className={`space-y-2 ${hideCode ? "hidden" : ""}`}>
        <span className="text-muted-foreground block text-xs font-semibold tracking-wide uppercase">
          Code
        </span>
        <DynamicCodeBlock code={code} lang={lang} codeblock={{ className: "m-0" }} />
      </section>
    </div>
  );
}

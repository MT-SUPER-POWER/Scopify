"use client";

import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";

import type { ShadcnCodeExampleProps } from "@/types/component-docs";

export function ShadcnCodeExample({ code, lang = "tsx" }: ShadcnCodeExampleProps) {
  return (
    <div className="not-prose my-4">
      <DynamicCodeBlock code={code} lang={lang} codeblock={{ className: "m-0" }} />
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import type { SocialPostTextProps } from "@/types/social/components";
import { SocialInlineText } from "./SocialInlineText";
import { cn } from "@/lib/utils";
import { socialPostTextClass } from "./socialClasses";

export function SocialPostText({ text, expanded = false }: SocialPostTextProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(expanded);
  const id = useId();
  const preview = Array.from(text.split("\n").slice(0, 6).join("\n")).slice(0, 280).join("");
  const collapsible = !expanded && preview.length < text.length;
  const content = open || !collapsible ? text : preview.trimEnd() + "…";
  return (
    <div className="mb-3">
      <p id={id} data-slot="social-post-text" className={cn(socialPostTextClass, "mb-0")}>
        <SocialInlineText text={content} />
      </p>
      {collapsible && (
        <button
          type="button"
          className="inline-flex min-h-[30px] pt-1.5 text-[13px] text-primary hover:underline"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {t(open ? "social.showLess" : "social.readMore")}
        </button>
      )}
    </div>
  );
}

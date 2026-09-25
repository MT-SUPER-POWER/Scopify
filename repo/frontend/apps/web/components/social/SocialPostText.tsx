"use client";

import { useId, useState } from "react";
import { useI18n } from "@/store/module/i18n";
import type { SocialPostTextProps } from "@/types/components/social";
import s from "./Social.module.css";

export function SocialPostText({ text, expanded = false }: SocialPostTextProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(expanded);
  const id = useId();
  const preview = Array.from(text.split("\n").slice(0, 6).join("\n")).slice(0, 280).join("");
  const collapsible = !expanded && preview.length < text.length;
  const content = open || !collapsible ? text : preview.trimEnd() + "…";
  return (
    <div className={s.postCopy}>
      <p id={id} className={s.postText}>
        {content.split(/(#[^#\n]+#)/g).map((part, index) =>
          /^#[^#\n]+#$/.test(part) ? (
            <span key={index} className={s.hashtag}>
              {part}
            </span>
          ) : (
            part
          ),
        )}
      </p>
      {collapsible && (
        <button
          type="button"
          className={s.expandText}
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

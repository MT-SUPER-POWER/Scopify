"use client";

import type { CSSProperties } from "react";
import { useCoverThemeColor } from "@/hooks/playlist/useCoverThemeColor";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import s from "@/components/social/Social.module.css";

export function ProfileGlow({ avatar }: { avatar: string }) {
  const tint = useCoverThemeColor(avatar ? getSizedImageUrl(avatar, 100) : null);
  return (
    <div
      className={s.profileGlow}
      style={tint ? ({ "--profile-tint": tint } as CSSProperties) : undefined}
      aria-hidden="true"
    />
  );
}

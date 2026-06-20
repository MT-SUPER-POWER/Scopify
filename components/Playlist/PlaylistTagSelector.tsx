"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getPlaylistHighQualityTags } from "@/lib/api/playlist";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { PlaylistTag } from "@/types/api/playlistTags";
import type { PlaylistTagSelectorProps } from "@/types/components/playlist";

export function PlaylistTagSelector({ value, maxSelected, onChange }: PlaylistTagSelectorProps) {
  const { t } = useI18n();
  const [tags, setTags] = useState<PlaylistTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const skeletonKeys = [
    "style",
    "mood",
    "scene",
    "language",
    "era",
    "genre",
    "theme",
    "hot",
    "new",
    "daily",
  ];

  const loadTags = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await getPlaylistHighQualityTags();
      setTags(Array.isArray(res.data.tags) ? res.data.tags : []);
    } catch (error) {
      console.error("Failed to load playlist tags:", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const toggleTag = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter((tag) => tag !== name));
      return;
    }
    if (value.length >= maxSelected) return;
    onChange([...value, name]);
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {skeletonKeys.map((key) => (
          <span key={key} className="h-7 w-14 animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
    );
  }

  if (failed) {
    return (
      <button
        type="button"
        onClick={() => void loadTags()}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-white/30 hover:text-white"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {t("playlist.form.tagsRetry")}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>{t("playlist.form.tagsLabel")}</span>
        <span>
          {value.length}/{maxSelected}
        </span>
      </div>
      <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
        {tags.map((tag) => {
          const selected = value.includes(tag.name);
          const disabled = !selected && value.length >= maxSelected;
          return (
            <button
              key={tag.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleTag(tag.name)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                selected
                  ? "border-[#1ed760] bg-[#1ed760]/20 text-[#1ed760]"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/30 hover:text-white",
                disabled && "cursor-not-allowed opacity-40",
              )}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import type { ScratchpadCommentsHeadProps } from "@/types/scratchpad/folia";
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Music2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePlaybackProjectionStore } from "@/hooks/player/usePlaybackProjection";
import { useScratchpadStore } from "@/store/module/scratchpad";
import { formatMomentAt as formatNoteAt, normalizeTagName } from "@/lib/scratchpad/songNotesModel";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import type { SongNoteComment } from "@/types/scratchpad/model";

const PlayingDiamond: React.FC<{ duration: number }> = ({ duration }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const playback = usePlaybackProjectionStore();
  useLayoutEffect(() => {
    let last = -1;
    const place = (value: number) => {
      const ratio = duration > 0 ? Math.max(0, Math.min(1, value / duration)) : 0;
      const permille = Math.round(ratio * 1000);
      if (permille === last || !ref.current) return;
      last = permille;
      ref.current.style.left = `${permille / 10}%`;
    };
    const update = () => place(playback.samplePositionMs() / 1000);
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [duration, playback]);
  return <span ref={ref} className="scratchpad-comments-timeline-now" aria-hidden="true" />;
};

const ScratchpadCommentsHead: React.FC<ScratchpadCommentsHeadProps> = ({
  song,
  songKey,
  isPlaying,
  tags,
  tagNames,
  comments,
  duration,
  onSeek,
  onPlay,
  onBackToPlaying,
}) => {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [coverFailed, setCoverFailed] = useState(false);
  const coverUrl = getSizedImageUrl(song.album?.coverUrl, 128);
  const marks = useMemo(
    () =>
      comments
        .filter(
          (c): c is SongNoteComment & { at: number } =>
            c.at !== undefined && c.at <= duration && duration > 0,
        )
        .map((c) => ({ ...c, ratio: c.at / duration })),
    [comments, duration],
  );

  const commitTag = () => {
    const name = normalizeTagName(tagDraft);
    setTagDraft("");
    setAdding(false);
    if (name) useScratchpadStore.getState().addTagToTracks([song], name);
  };
  const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      commitTag();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setTagDraft("");
      setAdding(false);
    }
  };

  return (
    <div className="scratchpad-comments-head">
      <div className="scratchpad-comments-song">
        <div className="scratchpad-comments-song-text">
          <span className="scratchpad-comments-label">
            {isPlaying ? t("scratchpad.nowPlaying") : t("scratchpad.foliaMoment.viewing")}
            {onBackToPlaying && (
              <button
                type="button"
                className="scratchpad-band-link scratchpad-comments-back"
                onClick={onBackToPlaying}
              >
                {t("scratchpad.foliaMoment.backToPlaying")} ›
              </button>
            )}
          </span>
          <h3 className="scratchpad-comments-title" title={song.title}>
            {song.title}
          </h3>
          <span className="scratchpad-intro-rule" aria-hidden="true" />
          <span className="scratchpad-comments-artist">{formatTrackArtists(song)}</span>
        </div>
        <button
          className="scratchpad-comments-cover"
          type="button"
          onClick={onPlay}
          aria-label={t("scratchpad.play")}
          title={t("scratchpad.play")}
        >
          {coverUrl && !coverFailed ? (
            <img
              src={coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <Music2 />
          )}
        </button>
      </div>

      <ul className="scratchpad-comments-tags" aria-label={t("scratchpad.foliaMoment.tags")}>
        {tags.map((key) => (
          <li key={key} className="scratchpad-comments-tag">
            <span title={tagNames.get(key)?.name ?? key}>#{tagNames.get(key)?.name ?? key}</span>
            <button
              type="button"
              title={t("scratchpad.foliaMoment.removeTag", { tag: tagNames.get(key)?.name ?? key })}
              aria-label={t("scratchpad.foliaMoment.removeTag", {
                tag: tagNames.get(key)?.name ?? key,
              })}
              onClick={() => useScratchpadStore.getState().removeTagFromTrack(songKey, key)}
            >
              <X aria-hidden="true" />
            </button>
          </li>
        ))}
        <li>
          {adding ? (
            <input
              // 点「+ 标签」之后接着就打字。
              autoFocus
              className="scratchpad-comments-tag-input"
              value={tagDraft}
              maxLength={80}
              placeholder={t("scratchpad.foliaMoment.tagPlaceholder")}
              aria-label={t("scratchpad.foliaMoment.addTag")}
              list="scratchpad-comments-tag-options"
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={commitTag}
            />
          ) : (
            <button
              type="button"
              className="scratchpad-comments-tag-add"
              onClick={() => setAdding(true)}
            >
              <Plus aria-hidden="true" />
              <span>{t("scratchpad.foliaMoment.addTag")}</span>
            </button>
          )}
        </li>
      </ul>
      {adding && (
        <datalist id="scratchpad-comments-tag-options">
          {[...tagNames.values()]
            .filter((tag) => !tags.includes(tag.key))
            .map((tag) => (
              <option key={tag.key} value={tag.name} />
            ))}
        </datalist>
      )}

      {duration > 0 && (marks.length > 0 || isPlaying) && (
        <div
          className="scratchpad-comments-timeline"
          role="group"
          aria-label={t("scratchpad.foliaMoment.timeline")}
        >
          <span className="scratchpad-comments-timeline-track" aria-hidden="true" />
          {marks.map((mark) => (
            <button
              key={mark.id}
              type="button"
              className="scratchpad-comments-timeline-mark"
              style={{ left: `${(mark.ratio * 100).toFixed(2)}%` }}
              disabled={!isPlaying}
              title={`${formatNoteAt(mark.at)}${mark.text ? ` · ${mark.text}` : ""}`}
              aria-label={t("scratchpad.foliaMoment.seekTo", { at: formatNoteAt(mark.at) })}
              onClick={() => onSeek(mark.at)}
            />
          ))}
          {isPlaying && <PlayingDiamond duration={duration} />}
        </div>
      )}
    </div>
  );
};

export default ScratchpadCommentsHead;

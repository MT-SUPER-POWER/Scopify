import { cn } from "@/lib/utils";
// Adapted from chthollyphile/folia-major v0.8.0 (3b91924f1), AGPL-3.0.
import type { ScratchpadCommentComposerProps } from "@/types/scratchpad/folia";
import React, { useRef, useState, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pin } from "lucide-react";
import { usePlaybackProjectionStore } from "@/hooks/player/usePlaybackProjection";
import { formatMomentAt as formatNoteAt } from "@/lib/scratchpad/songNotesModel";
import { useScratchpadStore } from "@/store/module/scratchpad";

const PinTime: React.FC = () => {
  const ref = useRef<HTMLSpanElement>(null);
  const playback = usePlaybackProjectionStore();
  useLayoutEffect(() => {
    let last = -1;
    const write = (value: number) => {
      const second = Math.floor(Math.max(0, value));
      if (second === last || !ref.current) return;
      last = second;
      ref.current.textContent = formatNoteAt(second);
    };
    const update = () => write(playback.samplePositionMs() / 1000);
    update();
    const timer = window.setInterval(update, 500);
    return () => window.clearInterval(timer);
  }, [playback]);
  return <span ref={ref} className="scratchpad-composer-pin-time" />;
};

const ScratchpadCommentComposer: React.FC<ScratchpadCommentComposerProps> = ({
  song,
  draft,
  setDraft,
  canPin,
  onWritten,
}) => {
  const { t } = useTranslation();
  const playback = usePlaybackProjectionStore();
  const [pinned, setPinned] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pinActive = pinned && canPin;

  const submit = () => {
    const comment = useScratchpadStore
      .getState()
      .addMomentComment(song, draft, pinActive ? playback.samplePositionMs() / 1000 : undefined);
    if (!comment) return;
    setDraft("");
    setPinned(false);
    onWritten(comment.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape" && draft) {
      // 有字时 Esc 只是离开输入框（字留作草稿），不收起抽屉；空着时照常收起。
      event.preventDefault();
      inputRef.current?.blur();
    }
  };

  return (
    <form
      className="scratchpad-composer"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <textarea
        ref={inputRef}
        className="scratchpad-composer-input"
        value={draft}
        // 存的那一下（几毫秒）不收新字：存完会清空草稿，这期间打的字会跟着丢。
        rows={Math.min(5, Math.max(2, draft.split("\n").length))}
        maxLength={10_000}
        placeholder={t("scratchpad.foliaMoment.composerPlaceholder")}
        aria-label={t("scratchpad.foliaMoment.composerLabel")}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="scratchpad-composer-row">
        <button
          type="button"
          className={cn("scratchpad-composer-pin", pinActive && "is-on")}

          aria-pressed={pinActive}
          disabled={!canPin}
          title={
            canPin
              ? t("scratchpad.foliaMoment.pinHint")
              : t("scratchpad.foliaMoment.pinUnavailable")
          }
          onClick={() => setPinned((value) => !value)}
        >
          <Pin aria-hidden="true" />
          <span>{t("scratchpad.foliaMoment.pinAt")}</span>
          {canPin && <PinTime />}
        </button>
        <span className="scratchpad-composer-hint">{t("scratchpad.foliaMoment.composerHint")}</span>
        <button
          type="submit"
          className="scratchpad-pill is-solid"
          disabled={!draft.trim() && !pinActive}
        >
          {t("scratchpad.foliaMoment.submit")}
        </button>
      </div>
    </form>
  );
};

export default ScratchpadCommentComposer;

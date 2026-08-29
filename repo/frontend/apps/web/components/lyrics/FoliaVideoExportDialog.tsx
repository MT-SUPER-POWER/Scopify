"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleStop, Download, Film, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/store/module/i18n";
import { createCroppedVideoStream } from "@/lib/lyrics/videoExportCapture";
import { runtime } from "@/lib/runtime";
import type { FoliaVideoExportDialogProps } from "@/types/components/lyrics";
import type { VideoExportPreset } from "@/types/videoExport";

const PRESETS = [
  { id: "720p", width: 1280, height: 720 },
  { id: "1080p", width: 1920, height: 1080 },
  { id: "portrait", width: 1080, height: 1920 },
] as const satisfies readonly VideoExportPreset[];

type ExportStatus = "idle" | "preparing" | "recording" | "finalizing" | "done" | "error";

const getFormat = () => {
  const formats = [
    { mimeType: "video/mp4;codecs=avc1,mp4a.40.2", extension: "mp4" as const, name: "MP4 Video" },
    { mimeType: "video/mp4", extension: "mp4" as const, name: "MP4 Video" },
    { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" as const, name: "WebM Video" },
    { mimeType: "video/webm", extension: "webm" as const, name: "WebM Video" },
  ];
  return formats.find((format) => MediaRecorder.isTypeSupported(format.mimeType)) ?? null;
};

const stopStream = (stream: MediaStream | null) =>
  stream?.getTracks().forEach((track) => track.stop());

export function FoliaVideoExportDialog({ isOpen, onClose, theme }: FoliaVideoExportDialogProps) {
  const { t } = useI18n();
  const [presetId, setPresetId] = useState<(typeof PRESETS)[number]["id"]>("1080p");
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [startMode, setStartMode] = useState<"current" | "from-start">("current");
  const [message, setMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const croppedStreamCleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const playbackRestoreRef = useRef<{
    audio: HTMLAudioElement;
    paused: boolean;
    time: number;
  } | null>(null);
  const endedListenerRef = useRef<(() => void) | null>(null);
  const isDaylight = theme.name === "snow";

  const cleanup = async () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamsRef.current.forEach(stopStream);
    streamsRef.current = [];
    croppedStreamCleanupRef.current?.();
    croppedStreamCleanupRef.current = null;
    recorderRef.current = null;
    const playback = playbackRestoreRef.current;
    if (playback && (cancelledRef.current || playback.paused)) {
      playback.audio.pause();
      playback.audio.currentTime = playback.time;
    }
    if (playback && endedListenerRef.current)
      playback.audio.removeEventListener("ended", endedListenerRef.current);
    endedListenerRef.current = null;
    playbackRestoreRef.current = null;
    await runtime.videoExport.restoreWindow();
  };

  useEffect(
    () => () => {
      void cleanup();
    },
    [],
  );

  const startExport = async () => {
    const format = getFormat();
    const preset = PRESETS.find((item) => item.id === presetId) ?? PRESETS[1];
    if (!runtime.isDesktop || !format) {
      setStatus("error");
      setMessage(t("folia.videoExport.unavailable"));
      return;
    }

    setStatus("preparing");
    cancelledRef.current = false;
    setMessage("");
    try {
      const title = document.title.replace(/[\\/:*?"<>|]/g, "-") || "scopify-folia";
      const filePath = await runtime.videoExport.selectFile({
        defaultPath: `${title}-${preset.width}x${preset.height}.${format.extension}`,
        extension: format.extension,
        formatName: format.name,
      });
      if (!filePath) {
        setStatus("idle");
        return;
      }
      const audio = document.querySelector("audio") as HTMLAudioElement & {
        captureStream?: () => MediaStream;
      };
      if (!audio?.captureStream) throw new Error(t("folia.videoExport.audioFailed"));
      playbackRestoreRef.current = { audio, paused: audio.paused, time: audio.currentTime };
      if (startMode === "from-start") {
        audio.currentTime = 0;
        if (audio.paused) await audio.play();
      }
      await runtime.videoExport.prepareWindow(preset);
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const source = await runtime.videoExport.getCaptureSource();
      if (!source) throw new Error(t("folia.videoExport.captureFailed"));
      const sourceVideoStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source.id,
            maxFrameRate: 60,
          },
        } as unknown as MediaTrackConstraints,
      });
      streamsRef.current = [sourceVideoStream];
      const croppedVideo = createCroppedVideoStream(sourceVideoStream, preset);
      croppedStreamCleanupRef.current = croppedVideo.cleanup;
      const audioStream = audio.captureStream();
      if (audioStream.getAudioTracks().length === 0)
        throw new Error(t("folia.videoExport.audioFailed"));
      const combined = new MediaStream([
        ...croppedVideo.stream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ]);
      streamsRef.current.push(croppedVideo.stream, combined, audioStream);
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(combined, {
        mimeType: format.mimeType,
        audioBitsPerSecond: 320_000,
        videoBitsPerSecond: preset.width * preset.height >= 1_900_000 ? 28_000_000 : 14_000_000,
      });
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = async () => {
        setStatus("finalizing");
        try {
          if (cancelledRef.current) {
            setStatus("idle");
            setMessage(t("folia.videoExport.cancelled"));
            return;
          }
          const blob = new Blob(chunks, { type: format.mimeType });
          await runtime.videoExport.writeFile(filePath, await blob.arrayBuffer());
          setStatus("done");
          setMessage(t("folia.videoExport.done"));
        } catch (error) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : String(error));
        } finally {
          await cleanup();
        }
      };
      const stopAtTrackEnd = () => {
        if (recorder.state === "recording") recorder.stop();
      };
      endedListenerRef.current = stopAtTrackEnd;
      audio.addEventListener("ended", stopAtTrackEnd);
      setElapsed(0);
      const startedAt = Date.now();
      timerRef.current = window.setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 250);
      recorder.start(1000);
      setStatus("recording");
    } catch (error) {
      await cleanup();
      setStatus("error");
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-210 flex items-center justify-center p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={status === "recording" ? undefined : onClose}
          style={{ backgroundColor: isDaylight ? "rgba(255,255,255,.76)" : "rgba(0,0,0,.76)" }}
        >
          <motion.section
            className={`w-full max-w-lg rounded-[28px] border p-5 shadow-2xl ${isDaylight ? "border-black/8 bg-white text-zinc-900" : "border-white/10 bg-zinc-950 text-white"}`}
            initial={{ scale: 0.97, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 16 }}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <header className="mb-5 flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <Film size={18} style={{ color: theme.accentColor }} />
                <div>
                  <h2 className="text-sm font-semibold">{t("folia.videoExport.title")}</h2>
                  <p className="mt-1 text-xs opacity-50">{t("folia.videoExport.description")}</p>
                </div>
              </div>
              <button
                aria-label={t("audioEqualizer.close")}
                disabled={status === "recording"}
                onClick={onClose}
                type="button"
              >
                <X size={16} />
              </button>
            </header>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className="rounded-xl border px-2 py-3 text-xs"
                  onClick={() => setPresetId(preset.id)}
                  style={
                    presetId === preset.id
                      ? { borderColor: theme.accentColor, color: theme.accentColor }
                      : undefined
                  }
                  type="button"
                >
                  {preset.width} x {preset.height}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["current", "from-start"] as const).map((mode) => (
                <button
                  className="rounded-xl border px-3 py-2 text-xs"
                  key={mode}
                  onClick={() => setStartMode(mode)}
                  style={
                    startMode === mode
                      ? { borderColor: theme.accentColor, color: theme.accentColor }
                      : undefined
                  }
                  type="button"
                >
                  {t(`folia.videoExport.${mode === "current" ? "fromCurrent" : "fromStart"}`)}
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-xs opacity-55">
                {status === "recording"
                  ? `${t("folia.videoExport.recording")} ${elapsed.toFixed(1)}s`
                  : message || t("folia.videoExport.ready")}
              </span>
              {status === "recording" ? (
                <span className="flex gap-2">
                  <button
                    className="rounded-full border border-current/15 px-3 py-2 text-xs"
                    onClick={() => {
                      cancelledRef.current = true;
                      recorderRef.current?.stop();
                    }}
                    type="button"
                  >
                    {t("folia.videoExport.cancel")}
                  </button>
                  <button
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white"
                    onClick={() => recorderRef.current?.stop()}
                    style={{ backgroundColor: "#d9465f" }}
                    type="button"
                  >
                    <CircleStop size={14} />
                    {t("folia.videoExport.stop")}
                  </button>
                </span>
              ) : (
                <button
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                  disabled={status === "preparing" || status === "finalizing"}
                  onClick={() => void startExport()}
                  style={{ backgroundColor: theme.accentColor, color: theme.backgroundColor }}
                  type="button"
                >
                  <Download size={14} />
                  {t("folia.videoExport.start")}
                </button>
              )}
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

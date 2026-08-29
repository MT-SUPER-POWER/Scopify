"use client";

import { RefreshCw, Speaker } from "lucide-react";
import { useEffect } from "react";

import { useAudioDevices } from "@/hooks/player/useAudioDevices";
import { getPlaybackAudioElement, setAudioElementOutputDevice } from "@/lib/player/audioOutput";
import { useAudioOutputStore } from "@/store/module/audioOutput";
import { useI18n } from "@/store/module/i18n";
import type { AudioOutputOptionProps } from "@/types/audioOutput";

export function AudioOutputDevicePanel() {
  const { t } = useI18n();
  const selectedDeviceId = useAudioOutputStore((state) => state.selectedDeviceId);
  const setSelectedDeviceId = useAudioOutputStore((state) => state.setSelectedDeviceId);
  const { ensureLoaded, errorKey, isLoading, isSupported, outputDevices, refresh, setErrorKey } =
    useAudioDevices();

  useEffect(() => ensureLoaded(), [ensureLoaded]);

  const selectDevice = async (deviceId: string) => {
    const audio = getPlaybackAudioElement();
    if (!audio) return;
    try {
      await setAudioElementOutputDevice(audio, deviceId);
      setSelectedDeviceId(deviceId);
      setErrorKey(null);
    } catch {
      setErrorKey("audioSettings.outputSelectFailed");
    }
  };

  if (!isSupported) {
    return (
      <p className="py-6 text-sm text-muted-foreground">{t("audioSettings.outputUnsupported")}</p>
    );
  }

  return (
    <div className="space-y-4 py-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Speaker className="size-4" />
            {t("audioSettings.outputTitle")}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("audioSettings.outputDescription")}
          </p>
        </div>
        <button
          aria-label={t("audioSettings.outputRefresh")}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          disabled={isLoading}
          onClick={() => void refresh()}
          title={t("audioSettings.outputRefresh")}
          type="button"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-1.5">
        <OutputOption
          active={!selectedDeviceId || selectedDeviceId === "default"}
          label={t("audioSettings.outputDefault")}
          onClick={() => void selectDevice("default")}
        />
        {outputDevices
          .filter((device) => device.deviceId !== "default")
          .map((device, index) => (
            <OutputOption
              active={selectedDeviceId === device.deviceId}
              key={device.deviceId}
              label={device.label || t("audioSettings.outputUnnamed", { index: index + 1 })}
              onClick={() => void selectDevice(device.deviceId)}
            />
          ))}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{t("audioSettings.outputLoading")}</p>
      ) : null}
      {errorKey ? <p className="text-xs text-destructive">{t(errorKey)}</p> : null}
    </div>
  );
}

function OutputOption({ active, label, onClick }: AudioOutputOptionProps) {
  return (
    <button
      aria-pressed={active}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
        active ? "border-primary/40 bg-primary/10 text-foreground" : "border-border hover:bg-accent"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className={`size-2 rounded-full ${active ? "bg-primary" : "bg-muted-foreground/35"}`} />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

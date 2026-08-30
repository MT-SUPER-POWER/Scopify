"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioDevices } from "@/hooks/player/useAudioDevices";
import { getPlaybackAudioElement, setAudioElementOutputDevice } from "@/lib/player/audioOutput";
import { useAudioOutputStore } from "@/store/module/audioOutput";
import { useI18n } from "@/store/module/i18n";

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
    <div className="space-y-2 py-1">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <Select
            disabled={isLoading}
            onValueChange={(deviceId) => void selectDevice(deviceId)}
            value={selectedDeviceId || "default"}
          >
            <SelectTrigger
              aria-label={t("audioSettings.outputTitle")}
              className="h-10 w-full bg-background"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" className="z-2001" position="popper">
              <SelectItem value="default">{t("audioSettings.outputDefault")}</SelectItem>
              {outputDevices
                .filter((device) => device.deviceId !== "default")
                .map((device, index) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || t("audioSettings.outputUnnamed", { index: index + 1 })}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <button
          aria-label={t("audioSettings.outputRefresh")}
          className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          disabled={isLoading}
          onClick={() => void refresh()}
          title={t("audioSettings.outputRefresh")}
          type="button"
        >
          <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{t("audioSettings.outputLoading")}</p>
      ) : null}
      {errorKey ? <p className="text-xs text-destructive">{t(errorKey)}</p> : null}
    </div>
  );
}

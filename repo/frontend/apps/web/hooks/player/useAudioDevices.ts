"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isAudioOutputSelectionSupported } from "@/lib/player/audioOutput";
import type { AudioDeviceOption, AudioOutputDevicesErrorKey } from "@/types/audioOutput";

let cachedDevices: MediaDeviceInfo[] | null = null;

export function useAudioDevices() {
  const isSupported =
    isAudioOutputSelectionSupported() &&
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.enumerateDevices === "function";
  const [devices, setDevices] = useState<MediaDeviceInfo[]>(() => cachedDevices ?? []);
  const [hasLoaded, setHasLoaded] = useState(() => cachedDevices !== null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorKey, setErrorKey] = useState<AudioOutputDevicesErrorKey | null>(null);
  const isLoadingRef = useRef(false);

  const load = useCallback(async () => {
    if (!isSupported) {
      setDevices([]);
      setErrorKey("audioSettings.outputUnsupported");
      return;
    }
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorKey(null);
    try {
      const enumerated = await navigator.mediaDevices.enumerateDevices();
      cachedDevices = enumerated.filter(
        (device) => device.kind === "audioinput" || device.kind === "audiooutput",
      );
      setDevices(cachedDevices);
      setHasLoaded(true);
    } catch {
      setErrorKey("audioSettings.outputLoadFailed");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [isSupported]);

  const ensureLoaded = useCallback(() => {
    if (cachedDevices === null && !isLoadingRef.current) void load();
  }, [load]);

  const refresh = useCallback(() => {
    cachedDevices = null;
    return load();
  }, [load]);

  const requestInputAccess = useCallback(
    async (deviceId: string) => {
      if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
        setErrorKey("audioSettings.inputAccessFailed");
        return false;
      }
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId && deviceId !== "default" ? { deviceId: { exact: deviceId } } : true,
        });
        cachedDevices = null;
        await load();
        return true;
      } catch {
        setErrorKey("audioSettings.inputAccessFailed");
        return false;
      } finally {
        stream?.getTracks().forEach((track) => track.stop());
      }
    },
    [load],
  );

  useEffect(() => {
    if (!isSupported || !hasLoaded) return;
    const handleDeviceChange = () => {
      cachedDevices = null;
      void load();
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
  }, [hasLoaded, isSupported, load]);

  return {
    inputDevices: devices
      .filter((device) => device.kind === "audioinput")
      .map<AudioDeviceOption>((device) => ({ deviceId: device.deviceId, label: device.label })),
    outputDevices: devices
      .filter((device) => device.kind === "audiooutput")
      .map<AudioDeviceOption>((device) => ({ deviceId: device.deviceId, label: device.label })),
    ensureLoaded,
    errorKey,
    isLoading,
    isSupported,
    refresh,
    requestInputAccess,
    setErrorKey,
  };
}

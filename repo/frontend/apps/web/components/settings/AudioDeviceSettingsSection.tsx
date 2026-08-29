"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { useAudioDevices } from "@/hooks/player/useAudioDevices";
import { getPlaybackAudioElement, setAudioElementOutputDevice } from "@/lib/player/audioOutput";
import { useAudioOutputStore } from "@/store/module/audioOutput";
import { useI18n } from "@/store/module/i18n";

import { SettingRow, SettingSection, SettingSelect } from "./SettingsUI";

export function AudioDeviceSettingsSection() {
  const { t } = useI18n();
  const selectedInputDeviceId = useAudioOutputStore((state) => state.selectedInputDeviceId);
  const selectedOutputDeviceId = useAudioOutputStore((state) => state.selectedDeviceId);
  const setSelectedInputDeviceId = useAudioOutputStore((state) => state.setSelectedInputDeviceId);
  const setSelectedOutputDeviceId = useAudioOutputStore((state) => state.setSelectedDeviceId);
  const {
    ensureLoaded,
    errorKey,
    inputDevices,
    isLoading,
    isSupported,
    outputDevices,
    refresh,
    requestInputAccess,
    setErrorKey,
  } = useAudioDevices();
  const [isTestingInput, setIsTestingInput] = useState(false);
  const [inputVerified, setInputVerified] = useState(false);

  useEffect(() => ensureLoaded(), [ensureLoaded]);

  const selectOutput = async (deviceId: string) => {
    const audio = getPlaybackAudioElement();
    try {
      if (audio) await setAudioElementOutputDevice(audio, deviceId);
      setSelectedOutputDeviceId(deviceId);
      setErrorKey(null);
    } catch {
      setErrorKey("audioSettings.outputSelectFailed");
    }
  };

  const verifyInput = async () => {
    setIsTestingInput(true);
    setInputVerified(false);
    const verified = await requestInputAccess(selectedInputDeviceId || "default");
    setInputVerified(verified);
    setIsTestingInput(false);
  };

  return (
    <SettingSection title={t("audioSettings.devicesTitle")}>
      <SettingRow
        label={t("audioSettings.outputTitle")}
        sublabel={t("audioSettings.outputDescription")}
        control={
          <SettingSelect
            disabled={!isSupported || isLoading}
            onChange={(value) => void selectOutput(value)}
            value={selectedOutputDeviceId || "default"}
          >
            <option value="default" className="bg-popover">
              {t("audioSettings.outputDefault")}
            </option>
            {outputDevices
              .filter((device) => device.deviceId !== "default")
              .map((device, index) => (
                <option key={device.deviceId} value={device.deviceId} className="bg-popover">
                  {device.label || t("audioSettings.outputUnnamed", { index: index + 1 })}
                </option>
              ))}
          </SettingSelect>
        }
      />
      <SettingRow
        label={t("audioSettings.inputTitle")}
        sublabel={t("audioSettings.inputDescription")}
        control={
          <SettingSelect
            disabled={isLoading}
            onChange={(value) => {
              setSelectedInputDeviceId(value);
              setInputVerified(false);
            }}
            value={selectedInputDeviceId || "default"}
          >
            <option value="default" className="bg-popover">
              {t("audioSettings.inputDefault")}
            </option>
            {inputDevices
              .filter((device) => device.deviceId !== "default")
              .map((device, index) => (
                <option key={device.deviceId} value={device.deviceId} className="bg-popover">
                  {device.label || t("audioSettings.inputUnnamed", { index: index + 1 })}
                </option>
              ))}
          </SettingSelect>
        }
      />
      <SettingRow
        label={t("audioSettings.inputAccess")}
        sublabel={
          inputVerified
            ? t("audioSettings.inputVerified")
            : t("audioSettings.inputAccessDescription")
        }
        control={
          <button
            className="inline-flex items-center gap-2 rounded border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-content disabled:cursor-wait disabled:opacity-50"
            disabled={isTestingInput}
            onClick={() => void verifyInput()}
            type="button"
          >
            <ShieldCheck className="size-4" />
            {isTestingInput ? t("audioSettings.inputTesting") : t("audioSettings.inputTest")}
          </button>
        }
      />
      <SettingRow
        label={t("audioSettings.devicesRefresh")}
        sublabel={t("audioSettings.devicesRefreshDescription")}
        control={
          <button
            aria-label={t("audioSettings.outputRefresh")}
            className="rounded border border-input p-2 text-foreground transition-colors hover:border-content disabled:cursor-wait disabled:opacity-50"
            disabled={isLoading}
            onClick={() => void refresh()}
            title={t("audioSettings.outputRefresh")}
            type="button"
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        }
      />
      {errorKey ? <p className="text-xs text-destructive">{t(errorKey)}</p> : null}
    </SettingSection>
  );
}

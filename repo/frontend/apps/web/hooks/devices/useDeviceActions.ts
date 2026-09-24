"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kickoffDevice, sendDeviceSecurityCaptcha, uploadDeviceName } from "@/lib/api/devices";
import { rememberDeviceName } from "@/lib/devices/clientIdentity";
import { runtime } from "@/lib/runtime";
import { getBackendBaseUrl } from "@/lib/web/request";
import { useUserStore } from "@/store/module/user";
import { usePlayerStore } from "@/store";
import { useI18n } from "@/store/module/i18n";
import type { DeviceKickoffInput } from "@/types/devices";
import { getDeviceSessionScope } from "./useDeviceSession";

export function useDeviceActions(scope: string) {
  const client = useQueryClient();
  const { t } = useI18n();
  const ensureSession = () => {
    if (scope !== getDeviceSessionScope()) throw new Error(t("devices.sessionChanged"));
  };
  const refresh = () => client.invalidateQueries({ queryKey: ["loginDevices", scope] });
  const rename = useMutation({
    retry: false,
    mutationFn: async (name: string) => {
      ensureSession();
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 80) throw new Error(t("devices.nameValidation"));
      const backend = getBackendBaseUrl();
      const response = await uploadDeviceName(trimmed);
      ensureSession();
      if (response.data.code !== 200) throw new Error(t("devices.actionFailed"));
      rememberDeviceName(trimmed, backend);
      await refresh();
    },
  });
  const kickoff = useMutation({
    retry: false,
    mutationFn: async ({ device, captcha }: DeviceKickoffInput) => {
      ensureSession();
      if (!device.deviceKey) throw new Error(t("devices.invalidResponse"));
      const backend = getBackendBaseUrl();
      const response = await kickoffDevice({
        deviceKey: device.deviceKey,
        captcha: captcha.trim() || undefined,
      });
      if (response.data.code !== 200) throw new Error(t("devices.actionFailed"));
      ensureSession();
      if (device.current) {
        try {
          await runtime.auth.clearMusicSession(backend);
        } finally {
          ensureSession();
          useUserStore.getState().clearSession();
          usePlayerStore.getState().cleanCache();
          client.removeQueries({ predicate: (query) => query.meta?.scope === "account" });
        }
      } else await refresh();
    },
  });
  const sendCaptcha = useMutation({
    retry: false,
    mutationFn: async () => {
      ensureSession();
      const response = await sendDeviceSecurityCaptcha();
      ensureSession();
      if (response.data.code !== 200) throw new Error(t("devices.actionFailed"));
    },
  });
  return { rename, kickoff, sendCaptcha };
}

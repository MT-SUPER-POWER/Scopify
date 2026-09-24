"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/store/module/i18n";
import type { DeviceActionDialogProps } from "@/types/components/loginDevices";
import { useDeviceActions } from "./useDeviceActions";
export function useDeviceActionForm({ action, scope, onClose }: DeviceActionDialogProps) {
  const { t } = useI18n();
  const actions = useDeviceActions(scope);
  const [name, setName] = useState(action?.device.name ?? "");
  const [captcha, setCaptcha] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const pending =
    actions.rename.isPending || actions.kickoff.isPending || actions.sendCaptcha.isPending;
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);
  const submit = async () => {
    if (!action || pending) return;
    setError("");
    try {
      if (action.type === "rename") await actions.rename.mutateAsync(name);
      else await actions.kickoff.mutateAsync({ device: action.device, captcha });
      toast.success(t(action.type === "rename" ? "devices.renamed" : "devices.signedOut"));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("devices.actionFailed"));
    }
  };
  const send = async () => {
    if (pending || countdown > 0) return;
    setError("");
    try {
      await actions.sendCaptcha.mutateAsync();
      setCountdown(60);
      toast.success(t("devices.captchaSent"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("devices.actionFailed"));
    }
  };
  return {
    name,
    setName,
    captcha,
    setCaptcha,
    showCaptcha,
    setShowCaptcha,
    countdown,
    error,
    pending,
    submit,
    send,
  };
}

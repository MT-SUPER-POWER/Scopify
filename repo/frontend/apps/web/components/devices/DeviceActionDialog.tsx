"use client";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Label } from "@scopify/ui/shadcn/components/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@scopify/ui/shadcn/components/dialog";
import { useDeviceActionForm } from "@/hooks/devices/useDeviceActionForm";
import { useI18n } from "@/store/module/i18n";
import type { DeviceActionDialogProps } from "@/types/components/loginDevices";
export function DeviceActionDialog(props: DeviceActionDialogProps) {
  const { action, onClose } = props;
  const form = useDeviceActionForm(props);
  const { t } = useI18n();
  const rename = action?.type === "rename";
  return (
    <Dialog
      open={action !== null}
      onOpenChange={(open) => {
        if (!open && !form.pending) onClose();
      }}
    >
      <DialogContent showCloseButton={!form.pending}>
        <DialogHeader>
          <DialogTitle>{t(rename ? "devices.rename" : "devices.signOut")}</DialogTitle>
          <DialogDescription>
            {rename
              ? t("devices.renameHint")
              : t(action?.device.current ? "devices.kickoffCurrentHint" : "devices.kickoffHint", {
                  name: action?.device.name ?? "",
                })}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.submit();
          }}
          className="space-y-5"
        >
          {rename ? (
            <div className="space-y-2">
              <Label htmlFor="device-name">{t("devices.loginName")}</Label>
              <Input
                id="device-name"
                value={form.name}
                onChange={(event) => form.setName(event.target.value)}
                maxLength={80}
                disabled={form.pending}
                autoFocus
              />
            </div>
          ) : (
            <div>
              {!form.showCaptcha ? (
                <Button type="button" variant="ghost" onClick={() => form.setShowCaptcha(true)}>
                  {t("devices.needCaptcha")}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="device-captcha">{t("devices.captcha")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="device-captcha"
                      value={form.captcha}
                      onChange={(event) => form.setCaptcha(event.target.value)}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={12}
                      disabled={form.pending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={form.pending || form.countdown > 0}
                      onClick={() => void form.send()}
                    >
                      {form.countdown > 0 ? `${form.countdown}s` : t("devices.sendCaptcha")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("devices.captchaHint")}</p>
                </div>
              )}
            </div>
          )}
          {form.error && (
            <p role="alert" className="text-sm text-destructive">
              {form.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={form.pending} onClick={onClose}>
              {t("devices.cancel")}
            </Button>
            <Button
              type="submit"
              variant={rename ? "default" : "destructive"}
              disabled={form.pending || (rename && !form.name.trim())}
            >
              {t(
                form.pending
                  ? "devices.saving"
                  : rename
                    ? "devices.save"
                    : "devices.confirmSignOut",
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

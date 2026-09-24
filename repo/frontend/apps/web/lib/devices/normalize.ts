import { translate } from "@/lib/i18n";
import type { LoginDevicesResponse } from "@/types/api/devices";
import type { AppLocale } from "@/types/config";
import type { LoginDeviceSnapshot } from "@/types/devices";

export function normalizeLoginDevices(
  response: LoginDevicesResponse,
  locale: AppLocale,
): LoginDeviceSnapshot {
  const rows = response.data?.userDeviceList;
  if (response.code !== 200 || !Array.isArray(rows))
    throw new Error(
      response.message || response.msg || translate(locale, "devices.invalidResponse"),
    );
  const unknown = translate(locale, "devices.unknown");
  const date = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const devices = rows
    .map((row, index) => {
      const os = row.os?.toLowerCase() ?? "";
      const current = row.ifLoginDevice === true;
      const kind =
        os === "iphone" || os === "android" || row.hardwareTypeCode === "mobile"
          ? ("phone" as const)
          : os === "osx"
            ? ("laptop" as const)
            : os === "pc" || os === "linux"
              ? ("desktop" as const)
              : ("unknown" as const);
      const time = Number(row.lastActiveTime);
      const lastActiveTime = Number.isFinite(time) && time > 0 && time <= 8.64e15 ? time : null;
      const deviceKey =
        row.deviceKey === undefined || row.deviceKey === null ? null : String(row.deviceKey);
      return {
        id: deviceKey || `device-record-${index}`,
        deviceKey,
        name: row.deviceName?.trim() || translate(locale, "devices.unnamed"),
        kind,
        tone:
          current || kind === "phone"
            ? ("mint" as const)
            : kind === "laptop"
              ? ("violet" as const)
              : ("slate" as const),
        platform:
          (
            { iphone: "iOS", android: "Android", osx: "macOS", pc: "PC", linux: "Linux" } as Record<
              string,
              string
            >
          )[os] ||
          row.os ||
          unknown,
        current,
        lastActiveTime,
        activity: lastActiveTime ? date.format(lastActiveTime) : unknown,
        region: row.region?.trim() || row.loginPlace?.trim() || unknown,
        loginMethod: row.loginType?.trim() || unknown,
      };
    })
    .sort(
      (a, b) =>
        Number(b.current) - Number(a.current) || (b.lastActiveTime ?? 0) - (a.lastActiveTime ?? 0),
    );
  const quota = response.data?.userDeviceLimitInfoDTO;
  const used = quota?.currentNum;
  const limit = quota?.deviceLimit;
  const allowance =
    typeof used === "number" &&
    typeof limit === "number" &&
    Number.isFinite(used) &&
    Number.isFinite(limit) &&
    used >= 0 &&
    limit > 0
      ? { used, limit }
      : null;
  return { devices, allowance };
}

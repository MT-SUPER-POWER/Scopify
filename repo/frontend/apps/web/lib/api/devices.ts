import request, { requestConfig } from "@/lib/web/request";
import type {
  DeviceActionResponse,
  KickoffDeviceParams,
  LoginDevicesResponse,
} from "@/types/api/devices";

const authenticated = { requiresMusicSession: true, expectedBusinessCodes: [200] };

export function getLoginDevices(signal?: AbortSignal) {
  return request.post<LoginDevicesResponse>(
    "/device/list",
    {},
    requestConfig({ ...authenticated, signal }),
  );
}

export function uploadDeviceName(deviceName: string, signal?: AbortSignal) {
  return request.post<DeviceActionResponse>(
    "/deviceinfo/center/upload",
    { deviceName },
    requestConfig({ ...authenticated, signal }),
  );
}

export function kickoffDevice(params: KickoffDeviceParams) {
  return request.post<DeviceActionResponse>(
    "/device/kickoff",
    params,
    requestConfig(authenticated),
  );
}

export function sendDeviceSecurityCaptcha() {
  return request.post<DeviceActionResponse>("/captcha/safe/sent", {}, requestConfig(authenticated));
}

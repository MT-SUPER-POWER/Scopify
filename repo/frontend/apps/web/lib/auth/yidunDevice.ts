import type { FreshLoginDevice } from "@/types/devices/model";

/** Keep the identity used by the backend throughout the risk verification. */
export function bindYidunDevice(cookie: string, device: FreshLoginDevice): FreshLoginDevice {
  const parts = cookie.split(";").map((part) => part.trim());
  const deviceId = parts.find((part) => /^deviceId=.+$/.test(part));
  const os = parts.find((part) => /^os=.+$/.test(part));
  if (!deviceId || !os) throw new Error("Missing login device identity");
  return { ...device, cookie: `${deviceId}; ${os}` };
}

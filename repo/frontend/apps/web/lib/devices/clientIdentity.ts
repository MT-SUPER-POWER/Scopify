import { runtime } from "@/lib/runtime";
import { getBackendBaseUrl } from "@/lib/web/request";
import type { FreshLoginDevice } from "@/types/devices";

const ID_KEY = "scopify-device-id";
const NAME_KEY = "scopify-device-name:";

function getClientPlatform() {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/Android/i.test(ua)) return { os: "android", name: "Android" };
  if (/iPhone|iPad/i.test(ua)) return { os: "iphone", name: "iOS" };
  if (/Macintosh|Mac OS X/i.test(ua)) return { os: "osx", name: "macOS" };
  if (/Windows/i.test(ua)) return { os: "pc", name: "Windows" };
  if (/Linux/i.test(ua)) return { os: "linux", name: "Linux" };
  return { os: "pc", name: "PC" };
}

export function getLocalDeviceName() {
  if (typeof window !== "undefined") {
    try {
      const name = localStorage.getItem(NAME_KEY + getBackendBaseUrl());
      if (name) return name;
    } catch {
      /* Storage can be unavailable. */
    }
  }
  return `${runtime.isDesktop ? "Scopify" : "Scopify Web"} · ${getClientPlatform().name}`;
}

export function rememberDeviceName(name: string, backend = getBackendBaseUrl()) {
  try {
    localStorage.setItem(NAME_KEY + backend, name);
  } catch {
    /* A saved server name does not depend on local storage. */
  }
}

export function createFreshLoginDevice(name: string): FreshLoginDevice {
  let id: string | null = null;
  try {
    id = localStorage.getItem(ID_KEY);
  } catch {
    /* Use one identity for this login attempt. */
  }
  if (!id || !/^[a-f0-9]{32}$/.test(id)) {
    id = crypto.randomUUID().replaceAll("-", "");
    try {
      localStorage.setItem(ID_KEY, id);
    } catch {
      /* The caller retains this attempt's identity. */
    }
  }
  return {
    name: name.trim() || getLocalDeviceName(),
    cookie: `deviceId=${id}; os=${getClientPlatform().os}`,
    backend: getBackendBaseUrl(),
  };
}

/** Only fresh logins get a local identity; never rewrite imported or existing sessions. */
export function bindFreshLoginCookie(cookie: string, device: FreshLoginDevice) {
  const sessionParts = cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !/^(deviceId|os)=/i.test(part));
  return [...sessionParts, device.cookie].join("; ");
}

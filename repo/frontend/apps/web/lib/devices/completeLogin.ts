import { getUserAccount, getUserDetail } from "@/lib/api/user";
import { uploadDeviceName } from "@/lib/api/devices";
import { bindFreshLoginCookie, rememberDeviceName } from "@/lib/devices/clientIdentity";
import { runtime } from "@/lib/runtime";
import {
  saveMusicSessionCredential,
  getMusicSessionCredential,
} from "@/lib/web/musicSessionCredential";
import { getBackendBaseUrl } from "@/lib/web/request";
import { useUserStore } from "@/store/module/user";
import type { NeteaseUserSource } from "@/types/api/user";
import type { FreshLoginDevice } from "@/types/devices";

/** Verify the account, then synchronize the name once per fresh login, before closing the login window. */
export async function completeFreshLogin(
  rawCookie: string,
  type: "qr" | "token",
  device: FreshLoginDevice,
) {
  if (device.backend !== getBackendBaseUrl()) throw new Error("Backend changed during login");
  if (!rawCookie) throw new Error("Missing login session");
  const cookie = bindFreshLoginCookie(rawCookie, device);
  saveMusicSessionCredential(cookie);
  if (runtime.isDesktop) await runtime.auth.importMusicSession(cookie, device.backend);
  const isCurrent = () =>
    device.backend === getBackendBaseUrl() && getMusicSessionCredential() === cookie;
  const account = (await getUserAccount()).data;
  const userId = account.account?.id ?? account.profile?.userId;
  if (account.code !== 200 || !userId || !isCurrent())
    throw new Error("Unable to confirm login account");
  let profile: NeteaseUserSource | undefined = account.profile;
  try {
    profile = (await getUserDetail(userId)).data.profile ?? profile;
  } catch {
    /* Account profile is a valid fallback. */
  }
  if (!profile || !isCurrent()) throw new Error("Unable to confirm login profile");
  let nameSynced = false;
  try {
    const response = await uploadDeviceName(device.name, AbortSignal.timeout(5000));
    nameSynced = response.data.code === 200;
    if (nameSynced && isCurrent()) rememberDeviceName(device.name, device.backend);
  } catch {
    /* Name reporting must not fail an otherwise successful login. */
  }
  if (!isCurrent()) throw new Error("Login session changed");
  useUserStore.getState().setLoginType(type);
  useUserStore.getState().setUser(profile);
  useUserStore.getState().setUserId(userId);
  try {
    localStorage.setItem("user_id", String(userId));
  } catch {
    /* The verified account remains in memory. */
  }
  return { nameSynced };
}

import { getUserAccount, getUserDetail } from "@/lib/api/user";
import { isRealUser } from "@/lib/hooks/useLoginStatus";
import {
  getMusicSessionCredential,
  MUSIC_SESSION_CHANGED_EVENT,
} from "@/lib/web/musicSessionCredential";
import { useUserStore } from "@/store/module/user";
import type { NeteaseUserSource } from "@/types/api/user";

/**
 * 依据本地已有的 music_cookie 静默拉取网易云账号画像并回填 UserStore
 * 彻底解决“本地持久化了有效 Cookie 但 UserStore 中因时序或覆盖升级缺少 Profile 导致被误判未登录”的断层问题
 */

let isHydrating = false;
let lastAttemptedCookie: string | null = null;
let lastAttemptedFailed = false;

/**
 * 静默同步当前 Cookie 对应的用户画像
 * @param force - 是否忽略失败缓存强制重试
 * @returns 是否成功获取并写入用户画像
 */
export async function syncUserSessionFromCookie(force = false): Promise<boolean> {
  const credential = getMusicSessionCredential();
  if (!credential) {
    lastAttemptedCookie = null;
    lastAttemptedFailed = false;
    return false;
  }

  const currentUser = useUserStore.getState().user;
  if (!force && isRealUser(currentUser)) {
    return true;
  }

  // 若当前凭据此前已明确请求失败且非强制重试，避免死循环请求
  if (!force && lastAttemptedCookie === credential && lastAttemptedFailed) {
    return false;
  }

  if (isHydrating) return false;
  isHydrating = true;
  lastAttemptedCookie = credential;

  try {
    const res = await getUserAccount();
    const account = res.data;
    if (account.code !== 200) {
      lastAttemptedFailed = true;
      return false;
    }

    const userId = account.account?.id ?? account.profile?.userId;
    if (!userId) {
      lastAttemptedFailed = true;
      return false;
    }

    let profile: NeteaseUserSource | undefined = account.profile;
    try {
      const detailRes = await getUserDetail(userId);
      profile = detailRes.data.profile ?? profile;
    } catch {
      // 容错：降级使用 account.profile
    }

    if (!profile) {
      lastAttemptedFailed = true;
      return false;
    }

    const userStore = useUserStore.getState();
    userStore.setUser(profile);
    userStore.setUserId(userId);
    if (!userStore.loginType) {
      userStore.setLoginType("cookie");
    }

    try {
      localStorage.setItem("user_id", String(userId));
    } catch {
      // 忽略本地存储写入失败
    }

    lastAttemptedFailed = false;
    return true;
  } catch {
    lastAttemptedFailed = true;
    return false;
  } finally {
    isHydrating = false;
  }
}

// 监听本地 Cookie 凭据变化：若写入新 Cookie 且无用户画像，自动触发拉取
if (typeof window !== "undefined") {
  window.addEventListener(MUSIC_SESSION_CHANGED_EVENT, () => {
    const credential = getMusicSessionCredential();
    if (credential && credential !== lastAttemptedCookie) {
      lastAttemptedCookie = null;
      lastAttemptedFailed = false;
      const currentUser = useUserStore.getState().user;
      if (!isRealUser(currentUser)) {
        void syncUserSessionFromCookie(true);
      }
    }
  });
}

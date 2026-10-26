"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SocialEventTarget } from "@/types/social";

const POST_PARAM = "post";
const POST_UID_PARAM = "postUid";

/**
 * 动态浮层的 URL 状态：在当前地址上追加 post / postUid 打开浮层，
 * 保留筛选等其他参数；浏览器后退即可关闭，链接也能直接分享到某条动态。
 */
export function useSocialPostModal() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const id = params.get(POST_PARAM) ?? "";
  const uid = params.get(POST_UID_PARAM) ?? "";
  const target: SocialEventTarget | undefined =
    /^\d+$/.test(id) && /^\d+$/.test(uid) ? { id, uid } : undefined;

  const hrefFor = (event: { id: string; user: { id: string } }) => {
    const next = new URLSearchParams(params);
    next.set(POST_PARAM, event.id);
    next.set(POST_UID_PARAM, event.user.id);
    return `${pathname}?${next}`;
  };

  const close = () => {
    const next = new URLSearchParams(params);
    next.delete(POST_PARAM);
    next.delete(POST_UID_PARAM);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return { target, hrefFor, close };
}

import Image from "next/image";
import { User } from "lucide-react";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";

/**
 * MockAvatar: 顶部栏头像与登录状态展示组件。
 * 参考 Spotify：48px 深色圆盘内嵌头像，作为顶栏右侧的视觉重心。
 */
const MockAvatar = () => {
  const isLogged = useLoginStatus();
  const imgSrc = useUserStore((state) => state.user?.avatarUrl);
  const nickname = useUserStore((state) => state.user?.nickname);

  if (!isLogged)
    // Logged out: match the neighbouring notification/message buttons instead of a brand badge.
    return (
      <div className="flex size-12 items-center justify-center rounded-full bg-surface-sunken text-content-muted transition-all hover:scale-105 hover:bg-surface-elevated hover:text-content">
        <User className="size-5" />
      </div>
    );

  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-surface-sunken p-1.5 text-content transition-all hover:scale-105 hover:bg-surface-elevated">
      <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-brand">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={nickname || "avatar"}
            className="size-full object-cover"
            width={72}
            height={72}
          />
        ) : nickname ? (
          <span className="text-xs font-bold text-brand-foreground">
            {nickname[0]?.toUpperCase() ?? "U"}
          </span>
        ) : (
          <User className="size-5 text-brand-foreground" />
        )}
      </div>
    </div>
  );
};

export default MockAvatar;

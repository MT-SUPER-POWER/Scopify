import Image from "next/image";
import { User } from "lucide-react";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";

/**
 * MockAvatar: 顶部栏头像与登录状态展示组件
 */
const MockAvatar = () => {
  const isLogged = useLoginStatus();
  const imgSrc = useUserStore((state) => state.user?.avatarUrl);
  const nickname = useUserStore((state) => state.user?.nickname);

  return (
    <div className="flex size-10 items-center justify-center rounded-full border-[3px] border-border bg-surface-sunken text-content transition-transform hover:scale-105 hover:border-content">
      <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-brand">
        {isLogged && imgSrc ? (
          <Image
            src={imgSrc}
            alt={nickname || "avatar"}
            className="size-full object-cover"
            width={40}
            height={40}
          />
        ) : isLogged && nickname ? (
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

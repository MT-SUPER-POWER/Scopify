import Image from "next/image";
import { User } from "lucide-react";
import { ProviderLogo } from "@/components/provider/ProviderLogo";
import { useActiveAccount } from "@/hooks/auth/useProviderAccounts";

/**
 * MockAvatar: 顶部栏头像与登录状态展示组件，显示当前平台的账号
 */
const MockAvatar = () => {
  const account = useActiveAccount();
  const imgSrc = account.profile?.avatarUrl;
  const nickname = account.profile?.nickname;

  if (!account.isLoggedIn)
    // Logged out: the active platform's mark stands in for the avatar.
    return (
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-sunken/80 transition-transform hover:scale-105">
        <ProviderLogo provider={account.provider} className="size-8" />
      </div>
    );

  return (
    <div className="flex size-10 items-center justify-center rounded-full border-[3px] border-border bg-surface-sunken text-content transition-transform hover:scale-105 hover:border-content">
      <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-brand">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={nickname || "avatar"}
            className="size-full object-cover"
            width={40}
            height={40}
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

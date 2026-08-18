import Image from "next/image";
import { useLoginStatus } from "@/lib/hooks/useLoginStatus";
import { useUserStore } from "@/store";

/**
 * MockAvatar: 仅在用户未上传头像时显示的占位组件
 */
const MockAvatar = () => {
  const isLogged = useLoginStatus();
  const imgSrc = useUserStore.getState().user?.avatarUrl;

  return (
    <div className="flex size-10 items-center justify-center rounded-full border-[3px] border-border bg-surface-sunken text-content transition-transform hover:scale-105 hover:border-content">
      <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-brand">
        {isLogged && imgSrc !== "" && imgSrc !== undefined ? (
          <Image src={imgSrc} alt="avatar" className="size-full" width={40} height={40} />
        ) : (
          <span className="text-xs font-bold"> M </span>
        )}
      </div>
    </div>
  );
};

export default MockAvatar;

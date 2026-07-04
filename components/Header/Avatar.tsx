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
    <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-black/70 bg-black/70 text-white transition-transform hover:scale-105 hover:border-zinc-700">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-pink-600">
        {isLogged && imgSrc !== "" && imgSrc !== undefined ? (
          <Image src={imgSrc} alt="avatar" className="h-full w-full" width={40} height={40} />
        ) : (
          <span className="text-xs font-bold"> M </span>
        )}
      </div>
    </div>
  );
};

export default MockAvatar;

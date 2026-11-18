import Image from "next/image";
import type { MusicProvider } from "@scopify/music-domain/identity";
import { cn } from "@/lib/utils";

/** The platforms' own marks (32px favicons from their sites), shown where an account has no avatar. */
const PROVIDER_LOGO_SRC: Record<MusicProvider, string> = {
  netease: "/images/providers/netease.png",
  qq: "/images/providers/qq.png",
};

export function ProviderLogo({
  provider,
  className,
}: {
  provider: MusicProvider;
  className?: string;
}) {
  return (
    <Image
      src={PROVIDER_LOGO_SRC[provider]}
      alt=""
      width={32}
      height={32}
      className={cn("rounded-full", className)}
    />
  );
}

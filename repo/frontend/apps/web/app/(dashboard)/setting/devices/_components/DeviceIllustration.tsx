import Image from "next/image";
import type { DeviceIllustrationProps } from "@/types/devices/components";

export function DeviceIllustration({ kind, tone, hero = false }: DeviceIllustrationProps) {
  const asset =
    kind === "phone"
      ? "phone"
      : kind === "laptop"
        ? "laptop"
        : tone === "mint"
          ? "monitor"
          : "tower";
  return (
    <div className="relative aspect-square w-full" data-asset={asset} aria-hidden="true">
      <Image
        src={`/images/devices/${asset}.png`}
        alt=""
        width={1024}
        height={1024}
        sizes={hero ? "(max-width: 700px) 180px, 360px" : "(max-width: 700px) 120px, 240px"}
        priority={hero}
        className="size-full object-contain"
      />
    </div>
  );
}

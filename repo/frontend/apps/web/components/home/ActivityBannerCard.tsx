import Link from "next/link";
import Image from "next/image";

import { resolveBannerDestination } from "@/lib/home/resolveBannerDestination";
import type { ActivityBannerCardProps } from "@/types/components/home";

export function ActivityBannerCard({ banner, imageAlt }: ActivityBannerCardProps) {
  const imageUrl = banner.imageUrl ?? banner.pic;
  const destination = resolveBannerDestination(banner);

  if (!imageUrl) return null;

  const card = (
    <article className="group relative aspect-[16/8] overflow-hidden rounded-md bg-surface-elevated select-none">
      <Image
        src={imageUrl}
        alt={banner.typeTitle || imageAlt}
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-overlay/70 via-transparent to-transparent" />
      {banner.typeTitle && (
        <span className="pointer-events-none absolute right-2 bottom-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-overlay/75 px-2 py-0.5 text-[11px] font-medium text-overlay-foreground shadow-panel backdrop-blur-sm select-none">
          {banner.typeTitle}
        </span>
      )}
    </article>
  );

  if (!destination) return card;

  const linkClassName =
    "focus-visible:outline-brand block cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2";

  if (destination.isExternal) {
    return (
      <a href={destination.href} className={linkClassName}>
        {card}
      </a>
    );
  }

  return (
    <Link href={destination.href} className={linkClassName}>
      {card}
    </Link>
  );
}

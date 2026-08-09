import Link from "next/link";
import Image from "next/image";

import { resolveBannerDestination } from "@/lib/home/resolveBannerDestination";
import type { ActivityBannerCardProps } from "@/types/components/home";

export function ActivityBannerCard({ banner, imageAlt }: ActivityBannerCardProps) {
  const imageUrl = banner.imageUrl ?? banner.pic;
  const destination = resolveBannerDestination(banner);

  if (!imageUrl) return null;

  const card = (
    <article className="bg-surface-elevated group relative aspect-[16/8] overflow-hidden rounded-md select-none">
      <Image
        src={imageUrl}
        alt={banner.typeTitle || imageAlt}
        fill
        sizes="(min-width: 640px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="from-overlay/70 absolute inset-0 bg-linear-to-t via-transparent to-transparent" />
      {banner.typeTitle && (
        <span className="bg-overlay/75 text-overlay-foreground shadow-panel pointer-events-none absolute right-2 bottom-2 max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm select-none">
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

import Link from "next/link";
import Image from "next/image";

import { resolveBannerDestination } from "@/lib/home/resolveBannerDestination";
import type { ActivityBannerCardProps } from "@/types/components/home";

export function ActivityBannerCard({
  banner,
  imageAlt,
  isCenter = true,
  onClickSide,
}: ActivityBannerCardProps) {
  const imageUrl = banner.imageUrl ?? banner.pic;
  const destination = resolveBannerDestination(banner);

  if (!imageUrl) return null;

  const card = (
    <article className="group relative aspect-[2.4/1] overflow-hidden rounded-xl border border-content/10 bg-surface-elevated shadow-lg transition-shadow duration-300 select-none">
      <Image
        src={imageUrl}
        alt={banner.typeTitle || imageAlt}
        fill
        sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
        className="group-hover:scale-1.03 object-cover transition-transform duration-500"
        priority={isCenter}
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      {banner.typeTitle && (
        <span className="pointer-events-none absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/10 bg-overlay/80 px-2.5 py-0.5 text-xs font-medium text-overlay-foreground shadow-panel backdrop-blur-md select-none">
          {banner.typeTitle}
        </span>
      )}
    </article>
  );

  if (!isCenter) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClickSide}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClickSide?.();
          }
        }}
        className="block cursor-pointer outline-none select-none"
      >
        {card}
      </div>
    );
  }

  if (!destination) return card;

  const linkClassName =
    "focus-visible:outline-brand block cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2";

  if (destination.isExternal) {
    return (
      <a href={destination.href} className={linkClassName} target="_blank" rel="noreferrer">
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

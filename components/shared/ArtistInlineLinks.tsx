"use client";

import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import type { ArtistInlineLinksProps } from "@/types/components/artist";

export function ArtistInlineLinks({ artists, className }: ArtistInlineLinksProps) {
  const smartRouter = useSmartRouter();

  if (!artists.length) return null;

  return (
    <span className={className}>
      {artists.map((artist, index) => {
        const hasLink = artist.id !== undefined && artist.id !== null;
        const key = `${artist.name}-${index}`;
        return (
          <span key={key}>
            <button
              type="button"
              disabled={!hasLink}
              onClick={(event) => {
                event.stopPropagation();
                if (hasLink) smartRouter.push(`/artist?id=${artist.id}`);
              }}
              className="inline text-left hover:text-white hover:underline disabled:cursor-default disabled:hover:text-inherit disabled:hover:no-underline"
            >
              {artist.name}
            </button>
            {index < artists.length - 1 ? ", " : ""}
          </span>
        );
      })}
    </span>
  );
}

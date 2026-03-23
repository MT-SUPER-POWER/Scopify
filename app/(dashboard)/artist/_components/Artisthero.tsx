import { BadgeCheck } from "lucide-react";
import { ArtistInfo, formatNumber } from "../_types";

interface Props {
  artist: ArtistInfo;
}

export function ArtistHero({ artist }: Props) {
  return (
    <div className="relative h-[40vh] md:h-[50vh] min-h-85 w-full flex items-end">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${artist.headerImageUrl})` }}
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-[#121212]/70 to-transparent" />
      <div className="relative z-10 p-6 md:p-8 w-full max-w-7xl mx-auto flex flex-col gap-2">
        {artist.isVerified && (
          <div className="flex items-center gap-2 text-sm md:text-base font-medium drop-shadow-md">
            <BadgeCheck className="w-5 h-5 text-[#1DB954]" fill="white" />
            <span>Verified Artist</span>
          </div>
        )}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 drop-shadow-xl">
          {artist.name}
        </h1>
        <p className="text-sm md:text-base text-gray-300 font-medium drop-shadow-md">
          {formatNumber(artist.listeners)} listeners
        </p>
      </div>
    </div>
  );
}

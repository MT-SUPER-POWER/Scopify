"use client";

import { User } from "lucide-react";
import { Artist } from "@/app/(dashboard)/search/_types";

export function ArtistCard({ artist, onClick }: { artist: Artist; onClick?: () => void }) {
  return (
    <div
      className="bg-[#181818] hover:bg-[#282828] active:bg-[#202020] transition-colors p-4 rounded-xl cursor-pointer group flex flex-col items-center text-center"
      onClick={onClick}
    >
      <div className="w-full aspect-square mb-4 shadow-lg overflow-hidden rounded-full bg-zinc-800 flex items-center justify-center">
        {artist.picUrl || artist.img1v1Url ? (
          <img src={artist.picUrl || artist.img1v1Url} alt={artist.name} className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 text-zinc-500" />
        )}
      </div>
      <h4 className="text-base font-bold truncate w-full mb-1">{artist.name}</h4>
      <p className="text-sm text-zinc-400 truncate w-full mt-1">Artist</p>
    </div>
  );
}

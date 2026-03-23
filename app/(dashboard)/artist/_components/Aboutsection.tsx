import { ArtistInfo, formatNumber } from "../_types";

interface Props {
  artist: ArtistInfo;
}

export function AboutSection({ artist }: Props) {
  return (
    <div className="xl:w-80">
      <h2 className="text-2xl font-bold mb-4">About</h2>
      <div className="group relative rounded-xl overflow-hidden cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
        <div
          className="h-64 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${artist.avatar})` }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
          <p className="font-bold mb-2">{formatNumber(artist.listeners)} monthly listeners</p>
          <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">{artist.bio}</p>
        </div>
      </div>
    </div>
  );
}

import { Song } from "../_types";
import { SongsPanel } from './Songspanel';

interface Props {
  songs: Song[];
}

export function SongsView({ songs }: Props) {
  return (
    <div className="pb-10">
      <h2 className="text-2xl font-bold mb-6 tracking-tight">Search Songs</h2>
      <SongsPanel songs={songs} />
    </div>
  );
}

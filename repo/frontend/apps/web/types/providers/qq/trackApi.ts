/** Fields consumed from modern `track_info` (/song/batch), not legacy songmid/songname. */
export interface QqTrackDto {
  id: number;
  mid: string;
  name: string;
  interval: number;
  singer: { id: number; mid: string; name: string }[];
  album: { id: number; mid: string; name: string };
}

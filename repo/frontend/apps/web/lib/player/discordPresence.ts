import type { DiscordPresenceTrackMetadata } from "@/types/discordPresence";

function normalizeMetadataValue(value: string) {
  return value.trim().toLocaleLowerCase();
}

/**
 * Builds Discord's activity subtitle without ever duplicating the track title.
 * Some upstream responses incorrectly include the song name in the artist field.
 */
export function buildDiscordPresenceArtist({
  album,
  artistNames,
  title,
}: DiscordPresenceTrackMetadata) {
  const normalizedTitle = normalizeMetadataValue(title);
  const artists = [...new Set(artistNames.map((artist) => artist.trim()).filter(Boolean))].filter(
    (artist) => normalizeMetadataValue(artist) !== normalizedTitle,
  );
  if (artists.length > 0) return artists.join(" / ");

  const trimmedAlbum = album.trim();
  if (trimmedAlbum && normalizeMetadataValue(trimmedAlbum) !== normalizedTitle) return trimmedAlbum;

  return "Scopify";
}

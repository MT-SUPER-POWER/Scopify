/** Preserve IDs even when NetEase does not return their song details. */
export function getPlaylistOrderIds(trackIds: unknown[] | undefined): number[] {
  if (!Array.isArray(trackIds)) throw new Error("Playlist track IDs are missing.");
  const ids = trackIds.map((track) => {
    const id = typeof track === "object" && track !== null && "id" in track ? track.id : null;
    if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
      throw new Error("Invalid playlist track ID.");
    }
    return id;
  });
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate playlist track IDs.");
  return ids;
}

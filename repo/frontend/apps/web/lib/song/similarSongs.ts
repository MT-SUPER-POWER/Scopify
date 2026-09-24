/** Extract only song identities from resource blocks; details come from /song/detail. */
export function getSimilarSongIds(data: unknown, sourceSongId: number): number[] {
  const ids = new Set<number>();
  let hasCollection = false;
  const add = (value: unknown) => {
    if (typeof value !== "number" && typeof value !== "string") return;
    const id = Number(value);
    if (Number.isSafeInteger(id) && id > 0) ids.add(id);
  };
  const visit = (value: unknown, key = "", depth = 0) => {
    if (depth > 12 || value == null) return;
    if (Array.isArray(value)) {
      if (
        [
          "resources",
          "resourceList",
          "commonResourceList",
          "songs",
          "songList",
          "songIds",
          "data",
        ].includes(key)
      )
        hasCollection = true;
      for (const item of value) {
        if (key === "songIds") add(item);
        else visit(item, key, depth + 1);
      }
      return;
    }
    if (typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    const type =
      typeof record.resourceType === "string" ? record.resourceType.toLowerCase() : undefined;
    // Do not mistake album / artist identities for tracks.
    if (type && type !== "song" && type !== "similar_rcmd_song") return;
    if (record.resourceId != null) add(record.resourceId);
    else if (record.songId != null) add(record.songId);
    else if (
      type === "song" ||
      type === "similar_rcmd_song" ||
      key === "songData" ||
      key === "song" ||
      (typeof record.name === "string" &&
        (Array.isArray(record.ar) || Array.isArray(record.artists)))
    )
      add(record.id);
    for (const [childKey, child] of Object.entries(record)) {
      if (["ar", "artists", "al", "album", "creator", "user"].includes(childKey)) continue;
      visit(child, childKey, depth + 1);
    }
  };
  visit(data, "data");
  // The position endpoint can return only exposure metadata when no recommendation is available.
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (
      Array.isArray(record.libraLogList) &&
      typeof record.exposureRecords === "string" &&
      Object.keys(record).every((key) => ["libraLogList", "exposureRecords"].includes(key))
    )
      hasCollection = true;
  }
  if (ids.size === 0 && data != null && !hasCollection) {
    throw new Error("Unsupported similar-song resource response");
  }
  ids.delete(sourceSongId);
  return [...ids];
}

import { object } from "./preferences";

/** Forward notifications wrap shared events in JSON; read only display text and named resources. */
export function readForwardContent(value: unknown) {
  const messages: string[] = [];
  const comments: string[] = [];
  const resources: string[] = [];
  const songs: string[] = [];
  let remaining = 80;
  function visit(value: unknown, depth: number) {
    if (depth > 7 || remaining-- <= 0) return;
    if (typeof value === "string") {
      if (!value.trim().startsWith("{")) return;
      try {
        visit(JSON.parse(value), depth + 1);
      } catch {
        /* Not a JSON resource. */
      }
      return;
    }
    const record = object(value);
    if (
      typeof record.name === "string" &&
      (record.album || record.al) &&
      (record.artists || record.ar)
    ) {
      const artists = record.artists ?? record.ar;
      const names = Array.isArray(artists)
        ? artists
            .map((artist) => object(artist).name)
            .filter((name): name is string => typeof name === "string")
            .join(" / ")
        : "";
      songs.push(`${record.name}${names ? ` · ${names}` : ""}`.slice(0, 200));
    }
    for (const key of ["msg", "content"]) {
      const text = record[key];
      if (typeof text === "string" && text.trim()) {
        (key === "msg" ? messages : comments).push(text.trim().slice(0, 2000));
      }
    }
    for (const key of ["song", "playlist", "album", "mv", "video"]) {
      const resource = object(record[key]);
      const name = resource.name ?? resource.title;
      if (typeof name === "string" && name.trim()) resources.push(name.trim().slice(0, 200));
    }
    for (const [key, child] of Object.entries(record)) {
      if (
        ["user", "fromUser", "toUser", "creator", "artist", "artists", "msg", "content"].includes(
          key,
        )
      )
        continue;
      if (typeof child === "string" || (child && typeof child === "object"))
        visit(child, depth + 1);
    }
  }
  visit(value, 0);
  const body = messages[0] || comments[0] || "";
  return {
    body,
    quote: comments.find((text) => text !== body) || messages.find((text) => text !== body) || "",
    resource: songs[0] || resources[0] || "",
  };
}

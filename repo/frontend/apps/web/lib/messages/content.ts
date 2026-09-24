import type { MessageAttachment, PrivateMessageContent } from "@/types/privateMessages";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function messageImage(value: unknown) {
  const url = text(value);
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? url : undefined;
  } catch {
    return undefined;
  }
}

function resourceAttachment(body: Record<string, unknown>): MessageAttachment | undefined {
  for (const kind of ["album", "song", "playlist"] as const) {
    const resource = record(body[kind]);
    const title = text(resource.name);
    if (!title) continue;
    const album = record(resource.album ?? resource.al);
    const artist = record(resource.artist ?? resource.creator);
    const artists = resource.artists ?? resource.ar;
    const names = Array.isArray(artists)
      ? artists
          .map((value) => text(record(value).name))
          .filter(Boolean)
          .join(" / ")
      : text(artist.name ?? artist.nickname);
    const id = resource.id;
    const href =
      typeof id === "string" || typeof id === "number"
        ? `${kind === "song" ? "/comment?songId=" : `/${kind}?id=`}${encodeURIComponent(String(id))}`
        : undefined;
    return {
      kind,
      title,
      subtitle: names,
      imageUrl: messageImage(resource.picUrl ?? resource.coverImgUrl ?? album.picUrl),
      href,
    };
  }
  const image = record(body.picInfo ?? body.image);
  const imageUrl = messageImage(image.picUrl ?? image.originUrl ?? body.picUrl);
  return imageUrl ? { kind: "image", title: "", imageUrl } : undefined;
}

export function parsePrivateContent(value: unknown): PrivateMessageContent {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return { text: value };
    }
  }
  const body = record(parsed);
  return { text: text(body.msg ?? body.content), attachment: resourceAttachment(body) };
}

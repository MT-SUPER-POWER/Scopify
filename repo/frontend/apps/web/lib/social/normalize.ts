import { pruneUser } from "@/types/api/user";
import type { SongDetail } from "@/types/api/music";
import type { SocialRawObject } from "@/types/api/social";
import type {
  SocialComment,
  SocialEvent,
  SocialEventLinkSource,
  SocialMessage,
  SocialPlaylist,
  SocialProfile,
  SocialResource,
  SocialUser,
  SocialTopic,
} from "@/types/social";

export function object(value: unknown): SocialRawObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as SocialRawObject)
    : {};
}
export function decode(value: unknown): SocialRawObject {
  if (typeof value !== "string") return object(value);
  try {
    return object(JSON.parse(value));
  } catch {
    return {};
  }
}
export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
export function id(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}
export function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
export function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
export function imageUrl(value: unknown): string {
  const url = text(value);
  return /^https?:\/\//i.test(url) ? url.replace(/^http:/i, "https:") : "";
}
export function user(value: unknown): SocialUser {
  const raw = object(value);
  return {
    id: id(raw.userId),
    name: text(raw.nickname),
    avatar: imageUrl(raw.avatarUrl),
    signature: text(raw.signature),
    followed: raw.followed === true,
    mutual: raw.mutual === true,
  };
}
export function profile(value: unknown): SocialProfile {
  const root = object(value),
    raw = object(root.profile);
  if (!id(raw.userId)) throw new Error("Invalid profile response");
  const editable = {
    ...pruneUser({
      userId: number(raw.userId),
      nickname: text(raw.nickname),
      avatarUrl: imageUrl(raw.avatarUrl),
      signature: text(raw.signature),
      followeds: number(raw.followeds),
      follows: number(raw.follows),
      vipType: number(raw.vipType),
    }),
    gender: number(raw.gender),
    backgroundUrl: imageUrl(raw.backgroundUrl),
  };
  return {
    ...user(raw),
    editable,
    cover: imageUrl(raw.backgroundUrl),
    following: number(raw.follows),
    followers: number(raw.followeds),
    events: number(raw.eventCount),
    level: typeof root.level === "number" ? root.level : undefined,
    listenSongs: typeof root.listenSongs === "number" ? root.listenSongs : undefined,
    joinedAt: number(raw.createTime) || undefined,
  };
}
export function resource(value: unknown): SocialResource | undefined {
  const data = object(value);
  for (const kind of ["song", "playlist", "album", "program", "video"] as const) {
    const raw = object(data[kind]);
    const resourceId = id(raw.id ?? raw.vid);
    if (!resourceId) continue;
    const album = object(raw.album ?? raw.al);
    const artistList = list(raw.artists ?? raw.ar).map((a) => ({
      id: number(object(a).id),
      name: text(object(a).name),
    }));
    const artists = artistList
      .map((a) => a.name)
      .filter(Boolean)
      .join(" / ");
    const song: SongDetail | undefined =
      kind === "song"
        ? {
            id: Number(resourceId),
            name: text(raw.name),
            dt: number(raw.dt ?? raw.duration),
            fee: number(raw.fee),
            ar: artistList,
            al: { id: number(album.id), name: text(album.name), picUrl: imageUrl(album.picUrl) },
            publishTime: number(raw.publishTime),
          }
        : undefined;
    return {
      id: resourceId,
      kind,
      name: text(raw.name ?? raw.title),
      subtitle:
        artists ||
        text(object(raw.creator ?? raw.dj ?? raw.artist).nickname ?? object(raw.artist).name),
      cover: imageUrl(raw.coverImgUrl ?? raw.picUrl ?? raw.coverUrl ?? raw.cover ?? album.picUrl),
      song,
    };
  }
}
export function event(value: unknown, depth = 0): SocialEvent | undefined {
  const raw = object(value),
    eventId = id(raw.id);
  if (!eventId) return;
  const content = decode(raw.json),
    info = object(raw.info);
  const isForward = number(raw.type) === 22;
  const nested = decode(content.event);
  return {
    id: eventId,
    user: user(raw.user),
    threadId: text(info.threadId ?? raw.threadId ?? object(info.commentThread).id),
    text: text(content.msg ?? content.content ?? raw.msg),
    title: text(content.title ?? raw.title) || undefined,
    time: number(raw.eventTime ?? raw.showTime),
    type: number(raw.type),
    liked: info.liked === true,
    likes: number(info.likedCount),
    comments: number(info.commentCount),
    forwards: number(info.shareCount),
    pictures: list(raw.pics)
      .map((p) => imageUrl(object(p).originUrl ?? object(p).squareUrl))
      .filter(Boolean),
    resource: resource(content),
    forward: isForward && depth < 2 ? event(nested, depth + 1) : undefined,
    unavailableForward: isForward && (!id(nested.id) || nested.deleted === true || depth >= 2),
    privacy:
      typeof (raw.privacySetting ?? raw.privacy) === "number"
        ? number(raw.privacySetting ?? raw.privacy)
        : undefined,
  };
}
export function topic(value: unknown): SocialTopic | undefined {
  const raw = object(value);
  const topicId = id(raw.actId);
  const title = text(raw.title);
  if (!/^\d+$/.test(topicId) || !title) return;
  return {
    id: topicId,
    title,
    description: Array.isArray(raw.text)
      ? raw.text.map(text).filter(Boolean).join("\n")
      : text(raw.text),
    cover: imageUrl(raw.sharePicUrl),
    participants: number(raw.participateCount),
  };
}
export function playlist(value: unknown): SocialPlaylist {
  const raw = object(value);
  return {
    id: id(raw.id),
    name: text(raw.name),
    cover: imageUrl(raw.coverImgUrl ?? raw.picUrl),
    count: number(raw.trackCount),
    creator: id(object(raw.creator).userId),
  };
}
export function comment(value: unknown): SocialComment {
  const raw = object(value),
    reply = object(list(raw.beReplied)[0]);
  return {
    id: id(raw.commentId),
    user: user(raw.user),
    text: text(raw.content),
    time: number(raw.time),
    liked: raw.liked === true,
    likes: number(raw.likedCount),
    reply: reply.content ? { user: user(reply.user), text: text(reply.content) } : undefined,
  };
}
export function message(value: unknown): SocialMessage {
  const raw = object(value),
    content = decode(raw.msg);
  return {
    id: id(raw.id ?? raw.msgId),
    from: user(raw.fromUser),
    text: text(content.msg ?? content.content),
    time: number(raw.time),
    resource: resource(content),
  };
}
export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.filter((item) => item.id).map((item) => [item.id, item])).values()];
}
export function eventHref(event: SocialEventLinkSource): string {
  return (
    "/social/event?" +
    new URLSearchParams({ id: event.id, uid: event.user.id, threadId: event.threadId })
  );
}
export function profileHref(uid: string): string {
  return "/profile?" + new URLSearchParams({ userId: uid });
}

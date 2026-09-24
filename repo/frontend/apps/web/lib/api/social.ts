import { requestData } from "@/lib/web/request";
import { ApiError } from "@/lib/web/apiError";
import * as n from "@/lib/social/normalize";
import type { SocialRawResponse, SocialRequestParams } from "@/types/api/social";
import type {
  SocialCommentInput,
  SocialEventPage,
  SocialPeopleMode,
  SocialPeoplePage,
  SocialPlaylistPage,
  SocialPublishInput,
  SocialCommentPage,
  SocialMessagePage,
  SocialResource,
} from "@/types/social";
import type { UpdateUserProfilePayload } from "@/types/api/profileUpdate";

function businessResult(response: SocialRawResponse) {
  if (response?.code !== 200)
    throw new ApiError({
      kind: "business",
      message: "Unrecognized social response",
      data: response,
    });
  return response;
}
async function read(
  url: string,
  params: SocialRequestParams,
  signal?: AbortSignal,
  session = true,
) {
  return businessResult(
    await requestData<SocialRawResponse>({
      url,
      method: "get",
      params,
      signal,
      requiresMusicSession: session,
      expectedBusinessCodes: [200],
    }),
  );
}
async function write(url: string, data: SocialRequestParams) {
  return businessResult(
    await requestData<SocialRawResponse>({
      url,
      method: "post",
      data,
      requiresMusicSession: true,
      expectedBusinessCodes: [200],
    }),
  );
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("Unrecognized social response");
  return value;
}
export async function fetchEvents(
  uid: string | undefined,
  cursor: number,
  signal?: AbortSignal,
): Promise<SocialEventPage> {
  const response = await read(
    uid ? "/user/event" : "/event",
    uid ? { uid, limit: 20, lasttime: cursor } : { pagesize: 20, lasttime: cursor },
    signal,
  );
  const rows = array(response.events ?? response.event);
  const items = rows.flatMap((row) => {
    const item = n.event(row);
    return item ? [item] : [];
  });
  const next =
    n.number(response.lasttime) || Math.min(...items.map((item) => item.time).filter(Boolean));
  const more = response.more === true || (response.more === undefined && rows.length === 20);
  return {
    items,
    next:
      more && Number.isFinite(next) && next > 0 && (cursor === -1 || next < cursor)
        ? next
        : undefined,
  };
}
export async function fetchProfile(uid: string, signal?: AbortSignal) {
  return n.profile(await read("/user/detail", { uid }, signal, false));
}
export async function fetchPeople(
  uid: string,
  mode: SocialPeopleMode,
  query: string,
  offset: number,
  signal?: AbortSignal,
): Promise<SocialPeoplePage> {
  const searching = mode === "search";
  const response = await read(
    searching ? "/search" : mode === "followers" ? "/user/followeds" : "/user/follows",
    searching ? { keywords: query, type: 1002, limit: 30, offset } : { uid, limit: 30, offset },
    signal,
  );
  const result = searching ? n.object(response.result) : response;
  const raw = searching
    ? (result.userprofiles ?? [])
    : mode === "followers"
      ? result.followeds
      : result.follow;
  const rows = array(raw);
  const more =
    result.more ??
    result.hasMore ??
    (searching ? offset + rows.length < n.number(result.userprofileCount) : rows.length === 30);
  return {
    items: rows.map(n.user).filter((person) => person.id),
    next: more && rows.length ? offset + rows.length : undefined,
  };
}
export async function fetchPlaylists(
  uid: string,
  offset: number,
  signal?: AbortSignal,
): Promise<SocialPlaylistPage> {
  const response = await read("/user/playlist", { uid, limit: 30, offset }, signal, false);
  const rows = array(response.playlist);
  return {
    items: rows.map(n.playlist).filter((item) => item.id),
    next:
      (response.more === true || (response.more === undefined && rows.length === 30)) && rows.length
        ? offset + rows.length
        : undefined,
  };
}
export function followUser(uid: string, follow: boolean) {
  return write("/follow", { id: uid, t: follow ? 1 : 0 });
}
export function likeEvent(threadId: string, liked: boolean) {
  return write("/resource/like", { type: 6, threadId, t: liked ? 1 : 0 });
}
export function publishEvent(input: SocialPublishInput) {
  return write("/share/resource", {
    type: input.resource?.kind === "program" ? "djprogram" : (input.resource?.kind ?? "noresource"),
    id: input.resource?.id,
    msg: input.text,
  });
}
export function forwardEvent(evId: string, uid: string, forwards: string) {
  return write("/event/forward", { evId, uid, forwards });
}
export function deleteEvent(evId: string) {
  return write("/event/del", { evId });
}
export function updateProfile(payload: UpdateUserProfilePayload) {
  return write("/user/update", { ...payload });
}
export async function fetchComments(
  threadId: string,
  offset: number,
  signal?: AbortSignal,
): Promise<SocialCommentPage> {
  const response = await read("/comment/event", { threadId, limit: 20, offset }, signal);
  const rows = array(response.comments);
  return {
    items: rows.map(n.comment).filter((item) => item.id),
    total: n.number(response.total),
    next:
      (response.more === true ||
        (response.more === undefined && offset + rows.length < n.number(response.total))) &&
      rows.length
        ? offset + rows.length
        : undefined,
  };
}
export function changeComment(input: SocialCommentInput) {
  return write("/comment", {
    type: 6,
    threadId: input.threadId,
    t: input.operation === "add" ? 1 : input.operation === "reply" ? 2 : 0,
    content: input.text,
    commentId: input.commentId,
  });
}
export function likeComment(threadId: string, cid: string, liked: boolean) {
  return write("/comment/like", { type: 6, threadId, cid, t: liked ? 1 : 0 });
}
export async function searchResources(
  query: string,
  kind: "song" | "playlist",
  signal?: AbortSignal,
): Promise<SocialResource[]> {
  const response = await read(
    "/search",
    { keywords: query, type: kind === "song" ? 1 : 1000, limit: 20 },
    signal,
  );
  const result = n.object(response.result);
  return n.list(kind === "song" ? result.songs : result.playlists).flatMap((raw) => {
    const item = n.resource({ [kind]: raw });
    return item ? [item] : [];
  });
}
export async function fetchMessages(
  uid: string,
  before: number,
  signal?: AbortSignal,
): Promise<SocialMessagePage> {
  const response = await read("/msg/private/history", { uid, before, limit: 30 }, signal);
  const rows = array(response.msgs);
  const items = rows
    .map(n.message)
    .map((item) => ({ ...item, id: item.id || item.from.id + ":" + item.time }));
  const next = Math.min(...items.map((item) => item.time).filter(Boolean));
  return {
    items,
    next:
      (response.more === true || (response.more === undefined && rows.length === 30)) &&
      Number.isFinite(next) &&
      next > 0 &&
      (!before || next < before)
        ? next
        : undefined,
  };
}
export function sendMessage(uid: string, msg: string) {
  return write("/send/text", { user_ids: uid, msg });
}

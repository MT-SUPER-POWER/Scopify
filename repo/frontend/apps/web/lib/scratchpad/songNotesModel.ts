import type { MusicProvider } from "@scopify/music-domain/identity";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import type { PlayerTrack } from "@/types/player/model";
import type {
  SongNoteComment,
  SongNoteRecord,
  SongNoteSort,
  SongNoteTag,
  SongNoteTagGroup,
} from "@/types/scratchpad/model";

export const MAX_TAGS_PER_SONG = 32;
export const MAX_COMMENTS_PER_SONG = 1000;
export const MAX_TAG_LENGTH = 64;
export const MAX_COMMENT_LENGTH = 10000;

export function normalizeTagName(raw: string): string {
  return raw.trim().replace(/^#+/, "").replace(/\s+/g, " ").trim().slice(0, MAX_TAG_LENGTH);
}

export function normalizeTagKey(raw: string): string {
  return normalizeTagName(raw).toLowerCase();
}

export function formatMomentAt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const rounded = Math.floor(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function createCommentId(now: number): string {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `cmt_${now}_${random}`;
}

function pruneIfEmpty(
  records: Record<string, SongNoteRecord>,
  trackKey: string,
  nextRecord: SongNoteRecord,
): Record<string, SongNoteRecord> {
  if (nextRecord.tags.length === 0 && nextRecord.comments.length === 0) {
    const rest = { ...records };
    delete rest[trackKey];
    return rest;
  }
  return { ...records, [trackKey]: nextRecord };
}

export function addSongMomentComment(
  records: Readonly<Record<string, SongNoteRecord>>,
  track: PlayerTrack,
  rawText: string,
  at?: number,
  now = Date.now(),
): { records: Record<string, SongNoteRecord>; comment: SongNoteComment | null } {
  const text = rawText.trim().slice(0, MAX_COMMENT_LENGTH);
  const normalizedAt =
    at !== undefined && Number.isFinite(at) && at >= 0 ? Math.round(at * 10) / 10 : undefined;
  if (!text && normalizedAt === undefined) {
    return { records: { ...records }, comment: null };
  }

  const key = playerTrackKey(track);
  const existing = records[key];
  if (existing && existing.comments.length >= MAX_COMMENTS_PER_SONG) {
    return { records: { ...records }, comment: null };
  }

  const comment: SongNoteComment = {
    id: createCommentId(now),
    text,
    ...(normalizedAt !== undefined ? { at: normalizedAt } : {}),
    createdAt: now,
  };

  const nextRecord: SongNoteRecord = existing
    ? {
        ...existing,
        track,
        comments: [comment, ...existing.comments],
        updatedAt: now,
      }
    : {
        key,
        track,
        tags: [],
        tagAddedAt: {},
        comments: [comment],
        updatedAt: now,
      };

  return {
    records: { ...records, [key]: nextRecord },
    comment,
  };
}

export function editSongMomentComment(
  records: Readonly<Record<string, SongNoteRecord>>,
  trackKey: string,
  commentId: string,
  rawText: string,
  now = Date.now(),
): Record<string, SongNoteRecord> {
  const existing = records[trackKey];
  if (!existing) return { ...records };

  const target = existing.comments.find((item) => item.id === commentId);
  if (!target) return { ...records };

  const text = rawText.trim().slice(0, MAX_COMMENT_LENGTH);
  if (!text && target.at === undefined) return { ...records };

  const nextComments = existing.comments.map((item) =>
    item.id === commentId ? { ...item, text, editedAt: now } : item,
  );
  return {
    ...records,
    [trackKey]: { ...existing, comments: nextComments, updatedAt: now },
  };
}

export function deleteSongMomentComment(
  records: Readonly<Record<string, SongNoteRecord>>,
  trackKey: string,
  commentId: string,
): Record<string, SongNoteRecord> {
  const existing = records[trackKey];
  if (!existing) return { ...records };

  const nextComments = existing.comments.filter((item) => item.id !== commentId);
  if (nextComments.length === existing.comments.length) return { ...records };

  return pruneIfEmpty({ ...records }, trackKey, {
    ...existing,
    comments: nextComments,
  });
}

export function addTagToSongRecords(
  records: Readonly<Record<string, SongNoteRecord>>,
  tags: readonly SongNoteTag[],
  tracks: readonly PlayerTrack[],
  rawTagName: string,
  now = Date.now(),
): { records: Record<string, SongNoteRecord>; tags: SongNoteTag[]; changed: boolean } {
  const name = normalizeTagName(rawTagName);
  const tagKey = normalizeTagKey(rawTagName);
  if (!name || !tagKey || tracks.length === 0) {
    return { records: { ...records }, tags: [...tags], changed: false };
  }

  let nextTags = [...tags];
  if (!nextTags.some((tag) => tag.key === tagKey)) {
    nextTags = [...nextTags, { key: tagKey, name, createdAt: now }];
  }

  const nextRecords: Record<string, SongNoteRecord> = { ...records };
  let changed = false;

  for (const track of tracks) {
    const key = playerTrackKey(track);
    const existing = nextRecords[key];
    if (existing) {
      if (existing.tags.includes(tagKey) || existing.tags.length >= MAX_TAGS_PER_SONG) continue;
      changed = true;
      nextRecords[key] = {
        ...existing,
        track,
        tags: [...existing.tags, tagKey],
        tagAddedAt: { ...existing.tagAddedAt, [tagKey]: now },
        updatedAt: now,
      };
    } else {
      changed = true;
      nextRecords[key] = {
        key,
        track,
        tags: [tagKey],
        tagAddedAt: { [tagKey]: now },
        comments: [],
        updatedAt: now,
      };
    }
  }

  return { records: nextRecords, tags: changed ? nextTags : [...tags], changed };
}

export function removeTagFromSongRecord(
  records: Readonly<Record<string, SongNoteRecord>>,
  trackKey: string,
  tagKey: string,
): Record<string, SongNoteRecord> {
  const existing = records[trackKey];
  if (!existing || !existing.tags.includes(tagKey)) return { ...records };

  const nextAddedAt = { ...existing.tagAddedAt };
  delete nextAddedAt[tagKey];

  return pruneIfEmpty({ ...records }, trackKey, {
    ...existing,
    tags: existing.tags.filter((item) => item !== tagKey),
    tagAddedAt: nextAddedAt,
  });
}

export function renameSongTag(
  records: Readonly<Record<string, SongNoteRecord>>,
  tags: readonly SongNoteTag[],
  tagKey: string,
  rawNextName: string,
): { records: Record<string, SongNoteRecord>; tags: SongNoteTag[]; renamed: boolean } {
  const nextName = normalizeTagName(rawNextName);
  const nextKey = normalizeTagKey(rawNextName);
  if (!nextName || !nextKey) {
    return { records: { ...records }, tags: [...tags], renamed: false };
  }
  const sourceIndex = tags.findIndex((tag) => tag.key === tagKey);
  if (sourceIndex < 0) return { records: { ...records }, tags: [...tags], renamed: false };

  if (nextKey === tagKey) {
    const nextTags = tags.map((tag) => (tag.key === tagKey ? { ...tag, name: nextName } : tag));
    return { records: { ...records }, tags: nextTags, renamed: true };
  }

  const targetExists = tags.some((tag) => tag.key === nextKey);
  const nextTags = targetExists
    ? tags.filter((tag) => tag.key !== tagKey)
    : tags.map((tag) => (tag.key === tagKey ? { ...tag, key: nextKey, name: nextName } : tag));

  const nextRecords: Record<string, SongNoteRecord> = {};
  for (const [songKey, record] of Object.entries(records)) {
    if (!record.tags.includes(tagKey)) {
      nextRecords[songKey] = record;
      continue;
    }
    const filtered = record.tags.filter((t) => t !== tagKey);
    const merged = filtered.includes(nextKey) ? filtered : [...filtered, nextKey];
    const nextAdded = { ...record.tagAddedAt };
    const oldTime = nextAdded[tagKey];
    delete nextAdded[tagKey];
    if (oldTime !== undefined && nextAdded[nextKey] === undefined) {
      nextAdded[nextKey] = oldTime;
    }
    nextRecords[songKey] = {
      ...record,
      tags: merged,
      tagAddedAt: nextAdded,
    };
  }

  return { records: nextRecords, tags: nextTags, renamed: true };
}

export function deleteSongTag(
  records: Readonly<Record<string, SongNoteRecord>>,
  tags: readonly SongNoteTag[],
  tagKey: string,
): { records: Record<string, SongNoteRecord>; tags: SongNoteTag[] } {
  const nextTags = tags.filter((tag) => tag.key !== tagKey);
  let nextRecords: Record<string, SongNoteRecord> = { ...records };
  for (const songKey of Object.keys(records)) {
    nextRecords = removeTagFromSongRecord(nextRecords, songKey, tagKey);
  }
  return { records: nextRecords, tags: nextTags };
}

export function sortMomentComments(
  comments: readonly SongNoteComment[],
  sort: SongNoteSort,
): SongNoteComment[] {
  if (sort === "written") {
    return [...comments].sort((a, b) => b.createdAt - a.createdAt);
  }
  const timed = comments
    .filter((c) => c.at !== undefined)
    .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const untimed = comments
    .filter((c) => c.at === undefined)
    .sort((a, b) => b.createdAt - a.createdAt);
  return [...timed, ...untimed];
}

export function getRecentMomentRecords(
  records: Readonly<Record<string, SongNoteRecord>>,
  limit = 16,
): SongNoteRecord[] {
  return Object.values(records)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}

const UNTAGGED_GROUP_KEY = "__untagged__";

export function buildMomentTagGroups(
  records: Readonly<Record<string, SongNoteRecord>>,
  tags: readonly SongNoteTag[],
  query: string,
  providerFilter: "all" | MusicProvider,
  untaggedName: string,
): SongNoteTagGroup[] {
  const tagMap = new Map(tags.map((tag) => [tag.key, tag]));
  const normalizedQuery = query.trim().toLowerCase();

  const matching = Object.values(records).filter((record) => {
    if (providerFilter !== "all" && record.track.ref.provider !== providerFilter) return false;
    if (!normalizedQuery) return true;
    const title = record.track.title.toLowerCase();
    const artists = formatTrackArtists(record.track).toLowerCase();
    const tagText = record.tags.map((key) => tagMap.get(key)?.name.toLowerCase() ?? key).join(" ");
    const commentText = record.comments.map((c) => c.text.toLowerCase()).join(" ");
    return (
      title.includes(normalizedQuery) ||
      artists.includes(normalizedQuery) ||
      tagText.includes(normalizedQuery) ||
      commentText.includes(normalizedQuery)
    );
  });

  const byTag = new Map<string, SongNoteRecord[]>();
  const untagged: SongNoteRecord[] = [];
  for (const record of matching) {
    if (record.tags.length === 0) {
      untagged.push(record);
      continue;
    }
    for (const key of record.tags) {
      let bucket = byTag.get(key);
      if (!bucket) {
        bucket = [];
        byTag.set(key, bucket);
      }
      bucket.push(record);
    }
  }

  const orderedTags = [
    ...tags.map((tag) => ({ key: tag.key, name: tag.name })),
    ...[...byTag.keys()].filter((key) => !tagMap.has(key)).map((key) => ({ key, name: key })),
  ];

  const groups: SongNoteTagGroup[] = [];
  for (const tag of orderedTags) {
    const list = byTag.get(tag.key);
    if (!list || list.length === 0) continue;
    const sorted = [...list].sort(
      (a, b) => (b.tagAddedAt[tag.key] ?? b.updatedAt) - (a.tagAddedAt[tag.key] ?? a.updatedAt),
    );
    groups.push({ key: tag.key, tagKey: tag.key, name: tag.name, records: sorted });
  }

  if (untagged.length > 0) {
    groups.push({
      key: UNTAGGED_GROUP_KEY,
      tagKey: null,
      name: untaggedName,
      records: [...untagged].sort((a, b) => b.updatedAt - a.updatedAt),
    });
  }

  return groups;
}

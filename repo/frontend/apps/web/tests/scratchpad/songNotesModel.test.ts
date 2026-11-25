import { describe, expect, test } from "bun:test";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import {
  addSongMomentComment,
  addTagToSongRecords,
  buildMomentTagGroups,
  deleteSongMomentComment,
  deleteSongTag,
  editSongMomentComment,
  formatMomentAt,
  normalizeTagKey,
  normalizeTagName,
  removeTagFromSongRecord,
  renameSongTag,
  sortMomentComments,
} from "@/lib/scratchpad/songNotesModel";
import type { PlayerTrack } from "@/types/player/model";

function trackOf(id: string, title = `Track ${id}`): PlayerTrack {
  return {
    ref: { provider: "netease", kind: "track", id },
    title,
    artists: [{ ref: { provider: "netease", kind: "artist", id: "1" }, name: "Artist" }],
    album: null,
    durationMs: 240000,
  };
}

describe("songNotesModel", () => {
  test("normalizes tags and formats timestamps", () => {
    expect(normalizeTagName("  #City   Pop  ")).toBe("City Pop");
    expect(normalizeTagKey("  #City   Pop  ")).toBe("city pop");
    expect(formatMomentAt(65.9)).toBe("1:05");
    expect(formatMomentAt(-1)).toBe("0:00");
  });

  test("adds, edits, deletes comments and prunes empty records", () => {
    const t1 = trackOf("1");
    const k1 = playerTrackKey(t1);

    const added1 = addSongMomentComment({}, t1, "Chorus hits hard", 61.52, 100);
    expect(added1.comment?.at).toBe(61.5);
    const added2 = addSongMomentComment(added1.records, t1, "Opening riff", 12.1, 200);
    const added3 = addSongMomentComment(added2.records, t1, "", 90, 300);
    expect(added3.comment).not.toBeNull();

    const written = sortMomentComments(added3.records[k1].comments, "written");
    expect(written.map((c) => c.createdAt)).toEqual([300, 200, 100]);

    const timeline = sortMomentComments(added3.records[k1].comments, "timeline");
    expect(timeline.map((c) => c.at)).toEqual([12.1, 61.5, 90]);

    const edited = editSongMomentComment(
      added3.records,
      k1,
      added1.comment!.id,
      "Updated chorus",
      400,
    );
    expect(edited[k1].comments.find((c) => c.id === added1.comment!.id)?.text).toBe(
      "Updated chorus",
    );

    let afterDelete = deleteSongMomentComment(edited, k1, added1.comment!.id);
    afterDelete = deleteSongMomentComment(afterDelete, k1, added2.comment!.id);
    afterDelete = deleteSongMomentComment(afterDelete, k1, added3.comment!.id);
    expect(afterDelete[k1]).toBeUndefined();
  });

  test("manages tags, batch tagging, renaming, deleting, and grouping", () => {
    const t1 = trackOf("1", "Midnight");
    const t2 = trackOf("2", "Rain");
    const k1 = playerTrackKey(t1);

    const tagged1 = addTagToSongRecords({}, [], [t1, t2], "#City Pop", 100);
    expect(tagged1.changed).toBe(true);
    expect(tagged1.tags).toHaveLength(1);

    const tagged2 = addTagToSongRecords(tagged1.records, tagged1.tags, [t2], "Late Night", 200);
    const tagged3 = addSongMomentComment(tagged2.records, t1, "Nice", undefined, 300);

    const groups = buildMomentTagGroups(tagged3.records, tagged2.tags, "rain", "all", "Untagged");
    expect(groups.map((g) => g.name)).toEqual(["City Pop", "Late Night"]);
    expect(groups[0].records).toHaveLength(1);

    const renamed = renameSongTag(tagged3.records, tagged2.tags, "city pop", "Synthwave");
    expect(renamed.renamed).toBe(true);
    expect(renamed.records[k1].tags).toContain("synthwave");

    const removedTag = removeTagFromSongRecord(renamed.records, k1, "synthwave");
    expect(removedTag[k1]).toBeDefined(); // Still has a comment

    const deletedTag = deleteSongTag(removedTag, renamed.tags, "late night");
    expect(deletedTag.tags.map((tag) => tag.key)).toEqual(["synthwave"]);
  });
});

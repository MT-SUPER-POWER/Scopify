import { describe, expect, it } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { musicQueryKeys } from "@/lib/query/queryKeys";

const keys = musicQueryKeys.mv;

describe("MV query cache boundaries", () => {
  it("shares cache entries for implicit defaults and numeric/string IDs", () => {
    expect(keys.list()).toEqual(
      keys.list({
        area: "全部",
        type: "全部",
        order: "上升最快",
        limit: 30,
        offset: 0,
      }),
    );
    expect(keys.detail(123, "a")).toEqual(keys.detail("123", "a"));
    expect(keys.subscribed("a")).toEqual(keys.subscribed("a", { limit: 25, offset: 0 }));
  });

  it("keeps filters, pagination and comment cursors in separate entries", () => {
    expect(keys.list({ area: "日本" })).not.toEqual(keys.list({ area: "韩国" }));
    expect(keys.list({ type: "现场版" })).not.toEqual(keys.list());
    expect(keys.list({ order: "最热" })).not.toEqual(keys.list());
    expect(keys.artist(1, { offset: 30 })).not.toEqual(keys.artist(1));
    expect(keys.comments(1, "a", { before: 123 })).not.toEqual(keys.comments(1, "a"));
  });

  it("invalidates every subscription page for only the affected account", async () => {
    const client = new QueryClient();
    const first = keys.subscribed("a");
    const second = keys.subscribed("a", { offset: 25 });
    const other = keys.subscribed("b");
    for (const key of [first, second, other]) client.setQueryData(key, []);
    await client.invalidateQueries({ queryKey: keys.subscriptions("a") });
    expect(client.getQueryState(first)?.isInvalidated).toBe(true);
    expect(client.getQueryState(second)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
    client.clear();
  });

  it("isolates liked state by both MV and account", async () => {
    const client = new QueryClient();
    const affected = keys.info(1, "a");
    const otherAccount = keys.info(1, "b");
    const otherMV = keys.info(2, "a");
    for (const key of [affected, otherAccount, otherMV]) client.setQueryData(key, {});
    await client.invalidateQueries({ queryKey: affected });
    expect(client.getQueryState(affected)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherAccount)?.isInvalidated).toBe(false);
    expect(client.getQueryState(otherMV)?.isInvalidated).toBe(false);
    client.clear();
  });

  it("keeps playback URLs separate across resolutions and accounts", () => {
    expect(keys.url(1, 1080, "a")).not.toEqual(keys.url(1, 720, "a"));
    expect(keys.url(1, 1080, "a")).not.toEqual(keys.url(1, 1080, "b"));
    expect(keys.recommended("a")).not.toEqual(keys.recommended("b"));
  });
});

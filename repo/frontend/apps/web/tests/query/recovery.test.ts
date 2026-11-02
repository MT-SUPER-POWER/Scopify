import { expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { probeConnectivity, refetchFailedActiveQueries } from "@/lib/query/backendRecovery";
import { createQueryRecovery } from "@/lib/query/recovery";
import { ApiError } from "@/lib/web/apiError";

function createFakeClock() {
  let time = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  let nextId = 1;
  return {
    clock: {
      now: () => time,
      setTimer: (callback: () => void, delay: number) => {
        const id = nextId++;
        timers.set(id, { at: time + delay, callback });
        return id;
      },
      clearTimer: (id: unknown) => {
        timers.delete(id as number);
      },
    },
    pendingDelays: () => [...timers.values()].map((timer) => timer.at - time),
    async advance(ms: number) {
      time += ms;
      for (const [id, timer] of [...timers]) {
        if (timer.at > time) continue;
        timers.delete(id);
        timer.callback();
      }
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

function setup(probeResults: boolean[]) {
  const fake = createFakeClock();
  const recovery = createQueryRecovery(fake.clock);
  const recovered: boolean[] = [];
  recovery.connect({
    probe: async () => probeResults.shift() ?? true,
    onRecovered: (wasVisible) => recovered.push(wasVisible),
  });
  const resets: string[] = [];
  const region = (name: string) => {
    const unregister = recovery.register(() => {
      resets.push(name);
      unregister();
    });
    return unregister;
  };
  return { fake, recovery, recovered, resets, region };
}

test("stays silent until the first probe fails, then backs off and escalates", async () => {
  const { fake, recovery, recovered, resets, region } = setup([false, false, false, true]);
  region("toplists");
  region("banners");
  expect(recovery.getSnapshot().phase).toBe("pending");
  expect(fake.pendingDelays()).toEqual([2_000]);

  await fake.advance(2_000);
  expect(recovery.getSnapshot().phase).toBe("degraded");
  expect(fake.pendingDelays()).toEqual([5_000]);

  await fake.advance(5_000);
  await fake.advance(10_000);
  expect(recovery.getSnapshot().phase).toBe("persistent");

  await fake.advance(20_000);
  expect(resets).toEqual(["toplists", "banners"]);
  expect(recovery.getSnapshot()).toMatchObject({ phase: "ok", waitingRegions: 0, retryAt: null });
  expect(recovered).toEqual([true]);
});

test("a success elsewhere recovers every waiting region outside the cooldown", async () => {
  const { fake, recovery, recovered, resets, region } = setup([false]);
  region("playlists");
  await fake.advance(2_000);
  recovery.noteSuccess();
  expect(resets).toEqual([]);

  await fake.advance(3_000);
  recovery.noteSuccess();
  expect(resets).toEqual(["playlists"]);
  expect(recovered).toEqual([true]);
});

test("offline pauses probing and reconnecting probes immediately", async () => {
  const { fake, recovery, resets, region } = setup([]);
  region("artists");
  recovery.setOnline(false);
  expect(recovery.getSnapshot().phase).toBe("offline");
  expect(fake.pendingDelays()).toEqual([]);

  recovery.setOnline(true);
  await fake.advance(0);
  expect(resets).toEqual(["artists"]);
});

test("backend failure owns the state until the backend runs again", async () => {
  const { fake, recovery, recovered, resets, region } = setup([]);
  recovery.setBackendError("port 3000 in use");
  region("releases");
  expect(recovery.getSnapshot()).toMatchObject({ phase: "backend", waitingRegions: 1 });
  expect(fake.pendingDelays()).toEqual([]);

  recovery.setBackendError(null);
  expect(resets).toEqual(["releases"]);
  expect(recovered).toEqual([true]);
  expect(recovery.getSnapshot().phase).toBe("ok");
});

test("unmounting the last waiting region clears the schedule", () => {
  const { fake, recovery, region } = setup([]);
  const unregister = region("voices");
  unregister();
  expect(fake.pendingDelays()).toEqual([]);
  expect(recovery.getSnapshot().phase).toBe("ok");
});

test("probing replays the latest connectivity failure and ignores business errors", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const calls: string[] = [];
  try {
    for (const kind of ["business", "network"] as const) {
      await client
        .fetchQuery({
          queryKey: [kind],
          queryFn: async () => {
            calls.push(kind);
            if (calls.filter((call) => call === kind).length === 1)
              throw new ApiError({ kind, message: "failed" });
            return "recovered";
          },
        })
        .catch(() => undefined);
    }
    expect(await probeConnectivity(client)).toBe(true);
    expect(calls).toEqual(["business", "network", "network"]);
    expect(client.getQueryState(["business"])?.status).toBe("error");
  } finally {
    client.clear();
  }
});

test("refetches only active transient failures", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const calls: string[] = [];
  const cleanups: (() => void)[] = [];
  try {
    for (const kind of ["network", "timeout", "backend", "business", "unauthenticated"] as const) {
      const queryKey = [kind];
      await client
        .fetchQuery({
          queryKey,
          queryFn: async () => {
            throw new ApiError({ kind, message: "failed" });
          },
        })
        .catch(() => undefined);
      const observer = new QueryObserver(client, {
        queryKey,
        queryFn: async () => {
          calls.push(kind);
          return "recovered";
        },
        retryOnMount: false,
      });
      cleanups.push(observer.subscribe(() => {}));
    }
    await refetchFailedActiveQueries(client);
    expect(calls.sort()).toEqual(["backend", "network", "timeout"]);
    expect(client.getQueryState(["business"])?.status).toBe("error");
  } finally {
    cleanups.forEach((cleanup) => cleanup());
    client.clear();
  }
});

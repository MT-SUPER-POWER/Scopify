import { expect, test } from "bun:test";

import { normalizeRendererLogEvent } from "@/lib/web/logger";

test("normalizes a classified event and redacts nested NetEase credentials", () => {
  const event = normalizeRendererLogEvent({
    event: "transport.request_failed",
    level: "error",
    message: "Request failed with MUSIC_R_T=do-not-record",
    metadata: {
      cookie: "MUSIC_U=do-not-record; __csrf=do-not-record",
      nested: { MUSIC_A_T: "do-not-record" },
    },
    source: "transport",
    traceId: "request-42",
  });

  expect(event).toMatchObject({
    event: "transport.request_failed",
    level: "error",
    source: "transport",
    traceId: "request-42",
  });
  expect(event.id).toBeString();
  expect(event.timestamp).toBeString();
  expect(JSON.stringify(event)).not.toContain("do-not-record");
  expect(JSON.stringify(event)).toContain("[REDACTED]");
});

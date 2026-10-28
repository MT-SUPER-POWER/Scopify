import { describe, expect, test } from "bun:test";
import axios from "axios";
import request from "@/lib/web/request";

describe("request cancellation", () => {
  test("preserves cancellation rather than reporting a network error", async () => {
    const cancellation = new axios.CanceledError("cancelled");
    const result = await request
      .get("/cancelled", {
        adapter: async () => Promise.reject(cancellation),
      })
      .catch((error: unknown) => error);

    expect(result).toBe(cancellation);
    expect(axios.isCancel(result)).toBe(true);
  });
});

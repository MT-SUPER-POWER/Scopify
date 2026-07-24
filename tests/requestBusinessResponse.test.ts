import { expect, test } from "bun:test";
import { AxiosError } from "axios";

import { isApiError } from "@/lib/web/apiError";
import { requestData } from "@/lib/web/request";

test("rejects an HTTP 200 playlist mutation with an unexpected business code", async () => {
  const error = await requestData({
    adapter: async (config) => ({
      config,
      data: { code: 502, message: "track cannot be added" },
      headers: {},
      status: 200,
      statusText: "OK",
    }),
    expectedBusinessCodes: [200],
    method: "get",
    url: "/playlist/tracks",
  }).then(
    () => undefined,
    (reason: unknown) => reason,
  );

  expect(error).toSatisfy(
    (error: unknown) =>
      isApiError(error) &&
      error.kind === "business" &&
      error.status === 200 &&
      error.message === "track cannot be added",
  );
});

test("does not replay a failed transport request", async () => {
  let attempts = 0;
  const error = await requestData({
    adapter: async (config) => {
      attempts += 1;
      throw new AxiosError("network unavailable", "ERR_NETWORK", config);
    },
    method: "get",
    url: "/retry-test",
  }).then(
    () => undefined,
    (reason: unknown) => reason,
  );

  expect(attempts).toBe(1);
  expect(isApiError(error) && error.kind).toBe("network");
});

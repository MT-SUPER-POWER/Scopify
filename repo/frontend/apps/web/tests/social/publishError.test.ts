import { describe, expect, it } from "bun:test";

import { getSocialPublishErrorMessage } from "@/lib/social/publishError";
import { ApiError } from "@/lib/web/apiError";

describe("social publish errors", () => {
  it("shows the business message returned for a rejected share", () => {
    const error = new ApiError({
      kind: "business",
      message: "安全验证分享异常",
      data: { code: 250, message: "安全验证分享异常" },
    });
    expect(getSocialPublishErrorMessage(error, "fallback")).toBe("安全验证分享异常");
  });

  it("falls back for empty business messages and transport failures", () => {
    const empty = new ApiError({
      kind: "business",
      message: "Business request failed",
      data: { msg: " ", message: "" },
    });
    const network = new ApiError({ kind: "network", message: "Network Error" });
    expect(getSocialPublishErrorMessage(empty, "fallback")).toBe("fallback");
    expect(getSocialPublishErrorMessage(network, "fallback")).toBe("fallback");
    expect(getSocialPublishErrorMessage(new Error("internal detail"), "fallback")).toBe("fallback");
  });
});

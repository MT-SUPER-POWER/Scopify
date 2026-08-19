import { createOpenAPI } from "fumadocs-openapi/server";

export const neteaseOpenAPI = createOpenAPI({
  input: ["./openapi/netease-api.json"],
});

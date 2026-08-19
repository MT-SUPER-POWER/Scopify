import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { generateNeteaseApiSchema } from "../lib/netease-api-schema";

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const endpointCount = await generateNeteaseApiSchema({
  backendRoot: resolve(docsRoot, "../../../backend/api-enhanced"),
  output: resolve(docsRoot, "openapi/netease-api.json"),
});

console.log(`Generated OpenAPI schema from ${endpointCount} backend modules.`);

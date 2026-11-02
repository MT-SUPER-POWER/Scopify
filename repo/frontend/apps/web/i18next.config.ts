import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["zh-CN", "zh-TW", "en-US"],
  extract: {
    input: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    output: "locales/{{language}}/{{namespace}}.json",
    defaultNS: "common",
  },
  types: {
    input: ["locales/zh-CN/*.json"],
    output: "types/i18n/i18next.d.ts",
    resourcesFile: "types/i18n/resources.generated.d.ts",
    enableSelector: "optimize",
  },
});

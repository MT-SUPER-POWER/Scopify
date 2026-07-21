import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3111",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "bun run tests/e2e/mock-backend.ts",
      env: {
        PLAYWRIGHT_BACKEND_PORT: "3839",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      url: "http://127.0.0.1:3839/health",
    },
    {
      command: "bun run dev:web",
      env: {
        APP_CFG_BACKEND_HOST: "127.0.0.1",
        APP_CFG_BACKEND_PORT: "3839",
        FRONTEND_PORT: "3111",
        NEXT_DIST_DIR: "renderer-e2e",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: "http://127.0.0.1:3111",
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
